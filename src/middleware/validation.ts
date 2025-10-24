import { Request, Response, NextFunction } from 'express';
import { HttpError } from './errorHandler';

export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/[<>]/g, '')
    .trim();
};

export const sanitizeObject = (obj: any): any => {
  if (typeof obj !== 'object' || obj === null) return obj;
  
  const sanitized: any = Array.isArray(obj) ? [] : {};
  
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];
      
      if (typeof value === 'string') {
        sanitized[key] = sanitizeInput(value);
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
  }
  
  return sanitized;
};

export const sanitizeBody = (req: Request, res: Response, next: NextFunction) => {
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  next();
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateUsername = (username: string): boolean => {
  const usernameRegex = /^[a-zA-Z0-9_-]{3,30}$/;
  return usernameRegex.test(username);
};

export const validatePassword = (password: string): boolean => {
  return password.length >= 8 && password.length <= 128;
};

export const validateUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

export const validateFileUpload = (req: Request, res: Response, next: NextFunction) => {
  if (!req.file) {
    return next();
  }

  const allowedMimeTypes = [
    'text/plain',
    'application/pdf',
    'application/zip',
    'application/x-zip-compressed',
  ];

  const maxFileSize = 10 * 1024 * 1024;

  if (!allowedMimeTypes.includes(req.file.mimetype)) {
    throw new HttpError(400, 'Invalid file type');
  }

  if (req.file.size > maxFileSize) {
    throw new HttpError(400, 'File size exceeds limit');
  }

  next();
};

export const validateProblemLabel = (label: string): boolean => {
  const labelRegex = /^[A-Z][0-9]?$/;
  return labelRegex.test(label);
};

export const validateTimeLimit = (timeLimit: number): boolean => {
  return timeLimit > 0 && timeLimit <= 60000;
};

export const validateMemoryLimit = (memoryLimit: number): boolean => {
  return memoryLimit > 0 && memoryLimit <= 2048;
};
