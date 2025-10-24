import { Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../utils/prisma';
import { HttpError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { Role } from '@prisma/client';

export class UserController {
  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const users = await prisma.user.findMany({
        include: { roles: true },
        orderBy: { createdAt: 'desc' },
      });

      res.json(users.map(u => ({
        id: u.id,
        username: u.username,
        email: u.email,
        displayName: u.displayName,
        status: u.status,
        lastLogin: u.lastLogin,
        roles: u.roles.map(r => r.role),
        createdAt: u.createdAt,
      })));
    } catch (error) {
      next(error);
    }
  }

  async get(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;

      if (req.user?.id !== userId && !req.user?.roles.includes('ADMIN')) {
        throw new HttpError(403, 'Insufficient permissions');
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { roles: true },
      });

      if (!user) {
        throw new HttpError(404, 'User not found');
      }

      res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        status: user.status,
        lastLogin: user.lastLogin,
        roles: user.roles.map(r => r.role),
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      });
    } catch (error) {
      next(error);
    }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { username, email, password, displayName, roles } = req.body;

      if (!username || !email || !password) {
        throw new HttpError(400, 'Username, email, and password are required');
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const user = await prisma.user.create({
        data: {
          username,
          email,
          passwordHash,
          displayName,
          roles: {
            create: (roles || ['GUEST']).map((role: Role) => ({ role })),
          },
        },
        include: { roles: true },
      });

      await prisma.auditLog.create({
        data: {
          userId: req.user?.id,
          action: 'CREATE_USER',
          entity: 'User',
          entityId: user.id,
          ipAddress: req.ip,
        },
      });

      res.status(201).json({
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        roles: user.roles.map(r => r.role),
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;

      if (req.user?.id !== userId && !req.user?.roles.includes('ADMIN')) {
        throw new HttpError(403, 'Insufficient permissions');
      }

      const { email, displayName, status } = req.body;
      const updateData: any = {};

      if (email) updateData.email = email;
      if (displayName !== undefined) updateData.displayName = displayName;
      if (status && req.user?.roles.includes('ADMIN')) updateData.status = status;

      const user = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        include: { roles: true },
      });

      await prisma.auditLog.create({
        data: {
          userId: req.user?.id,
          action: 'UPDATE_USER',
          entity: 'User',
          entityId: userId,
          changes: updateData,
          ipAddress: req.ip,
        },
      });

      res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        status: user.status,
        roles: user.roles.map(r => r.role),
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;

      await prisma.user.update({
        where: { id: userId },
        data: { status: 'INACTIVE' },
      });

      await prisma.auditLog.create({
        data: {
          userId: req.user?.id,
          action: 'DELETE_USER',
          entity: 'User',
          entityId: userId,
          ipAddress: req.ip,
        },
      });

      res.json({ message: 'User deactivated successfully' });
    } catch (error) {
      next(error);
    }
  }

  async forceLogout(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;

      await prisma.userSession.deleteMany({
        where: { userId },
      });

      await prisma.auditLog.create({
        data: {
          userId: req.user?.id,
          action: 'FORCE_LOGOUT',
          entity: 'User',
          entityId: userId,
          ipAddress: req.ip,
        },
      });

      res.json({ message: 'User sessions terminated' });
    } catch (error) {
      next(error);
    }
  }

  async getSessions(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;

      if (req.user?.id !== userId && !req.user?.roles.includes('ADMIN')) {
        throw new HttpError(403, 'Insufficient permissions');
      }

      const sessions = await prisma.userSession.findMany({
        where: { 
          userId,
          expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: 'desc' },
      });

      res.json(sessions.map(s => ({
        id: s.id,
        ipAddress: s.ipAddress,
        userAgent: s.userAgent,
        expiresAt: s.expiresAt,
        createdAt: s.createdAt,
      })));
    } catch (error) {
      next(error);
    }
  }

  async addRole(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const { role } = req.body;

      if (!role) {
        throw new HttpError(400, 'Role is required');
      }

      await prisma.userRole.create({
        data: {
          userId,
          role,
        },
      });

      await prisma.auditLog.create({
        data: {
          userId: req.user?.id,
          action: 'ADD_ROLE',
          entity: 'User',
          entityId: userId,
          changes: { role },
          ipAddress: req.ip,
        },
      });

      res.json({ message: 'Role added successfully' });
    } catch (error) {
      next(error);
    }
  }

  async removeRole(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { userId, role } = req.params;

      await prisma.userRole.deleteMany({
        where: {
          userId,
          role: role as Role,
        },
      });

      await prisma.auditLog.create({
        data: {
          userId: req.user?.id,
          action: 'REMOVE_ROLE',
          entity: 'User',
          entityId: userId,
          changes: { role },
          ipAddress: req.ip,
        },
      });

      res.json({ message: 'Role removed successfully' });
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const { currentPassword, newPassword } = req.body;

      if (req.user?.id !== userId && !req.user?.roles.includes('ADMIN')) {
        throw new HttpError(403, 'Insufficient permissions');
      }

      if (!newPassword) {
        throw new HttpError(400, 'New password is required');
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new HttpError(404, 'User not found');
      }

      if (req.user?.id === userId && !req.user?.roles.includes('ADMIN')) {
        if (!currentPassword) {
          throw new HttpError(400, 'Current password is required');
        }

        const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!isValid) {
          throw new HttpError(401, 'Current password is incorrect');
        }
      }

      const passwordHash = await bcrypt.hash(newPassword, 10);

      await prisma.user.update({
        where: { id: userId },
        data: { passwordHash },
      });

      await prisma.userSession.deleteMany({
        where: { userId },
      });

      await prisma.auditLog.create({
        data: {
          userId: req.user?.id,
          action: 'CHANGE_PASSWORD',
          entity: 'User',
          entityId: userId,
          ipAddress: req.ip,
        },
      });

      res.json({ message: 'Password changed successfully' });
    } catch (error) {
      next(error);
    }
  }
}
