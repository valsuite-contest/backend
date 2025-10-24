import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { HttpError } from './errorHandler';
import prisma from '../utils/prisma';
import { Role } from '@prisma/client';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    username: string;
    email: string;
    roles: Role[];
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new HttpError(401, 'Authentication required');
    }

    const token = authHeader.substring(7);
    const secret = process.env.JWT_SECRET || 'your-secret-key';

    const decoded = jwt.verify(token, secret) as { userId: string };

    const session = await prisma.userSession.findUnique({
      where: { token },
      include: {
        user: {
          include: {
            roles: true,
          },
        },
      },
    });

    if (!session || session.expiresAt < new Date()) {
      throw new HttpError(401, 'Invalid or expired token');
    }

    if (session.user.status !== 'ACTIVE') {
      throw new HttpError(403, 'Account is not active');
    }

    req.user = {
      id: session.user.id,
      username: session.user.username,
      email: session.user.email,
      roles: session.user.roles.map((r) => r.role),
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new HttpError(401, 'Invalid token'));
    } else {
      next(error);
    }
  }
};

export const authorize = (...allowedRoles: Role[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new HttpError(401, 'Authentication required'));
    }

    const hasRole = req.user.roles.some((role) => allowedRoles.includes(role));

    if (!hasRole) {
      return next(new HttpError(403, 'Insufficient permissions'));
    }

    next();
  };
};
