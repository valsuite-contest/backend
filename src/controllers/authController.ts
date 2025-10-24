import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import prisma from '../utils/prisma';
import { HttpError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { validateUsername, validatePassword } from '../middleware/validation';

export class AuthController {
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        throw new HttpError(400, 'Username and password are required');
      }
      
      if (!validateUsername(username)) {
        throw new HttpError(400, 'Invalid username format');
      }

      if (!validatePassword(password)) {
        throw new HttpError(400, 'Invalid password format');
      }

      const user = await prisma.user.findUnique({
        where: { username },
        include: { roles: true },
      });

      if (!user) {
        throw new HttpError(401, 'Invalid credentials');
      }

      if (user.status !== 'ACTIVE') {
        throw new HttpError(403, 'Account is not active');
      }

      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

      if (!isPasswordValid) {
        throw new HttpError(401, 'Invalid credentials');
      }

      const secret = process.env.JWT_SECRET || 'your-secret-key';
      const expiresInValue = (process.env.JWT_EXPIRES_IN || '24h');
      const signOptions: SignOptions = { expiresIn: expiresInValue as any };
      const token = jwt.sign({ userId: user.id }, secret, signOptions);
      const expiresIn = expiresInValue;

      const expirationMs = typeof expiresIn === 'string' && expiresIn.endsWith('h') 
        ? parseInt(expiresIn) * 60 * 60 * 1000 
        : 24 * 60 * 60 * 1000;
      const expiresAt = new Date(Date.now() + expirationMs);

      await prisma.userSession.create({
        data: {
          userId: user.id,
          token,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
          expiresAt,
        },
      });

      await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() },
      });

      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'LOGIN',
          entity: 'User',
          entityId: user.id,
          ipAddress: req.ip,
        },
      });

      res.json({
        token,
        expiresAt,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          displayName: user.displayName,
          roles: user.roles.map((r) => r.role),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async logout(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader?.substring(7);

      if (token) {
        await prisma.userSession.delete({
          where: { token },
        });

        if (req.user) {
          await prisma.auditLog.create({
            data: {
              userId: req.user.id,
              action: 'LOGOUT',
              entity: 'User',
              entityId: req.user.id,
              ipAddress: req.ip,
            },
          });
        }
      }

      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      next(error);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const { token: oldToken } = req.body;

      if (!oldToken) {
        throw new HttpError(400, 'Token is required');
      }

      const session = await prisma.userSession.findUnique({
        where: { token: oldToken },
        include: { user: { include: { roles: true } } },
      });

      if (!session || session.expiresAt < new Date()) {
        throw new HttpError(401, 'Invalid or expired token');
      }

      const secret = process.env.JWT_SECRET || 'your-secret-key';
      const expiresInValue = (process.env.JWT_EXPIRES_IN || '24h');
      const signOptions: SignOptions = { expiresIn: expiresInValue as any };
      const newToken = jwt.sign({ userId: session.user.id }, secret, signOptions);
      const expiresIn = expiresInValue;

      const expirationMs = typeof expiresIn === 'string' && expiresIn.endsWith('h') 
        ? parseInt(expiresIn) * 60 * 60 * 1000 
        : 24 * 60 * 60 * 1000;
      const expiresAt = new Date(Date.now() + expirationMs);

      await prisma.userSession.delete({ where: { token: oldToken } });
      await prisma.userSession.create({
        data: {
          userId: session.user.id,
          token: newToken,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
          expiresAt,
        },
      });

      res.json({
        token: newToken,
        expiresAt,
      });
    } catch (error) {
      next(error);
    }
  }

  async me(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new HttpError(401, 'Authentication required');
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
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
        roles: user.roles.map((r) => r.role),
      });
    } catch (error) {
      next(error);
    }
  }
}
