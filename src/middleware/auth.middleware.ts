import type { NextFunction, Request, Response } from 'express';
import { TokenService } from '../services/token.service';
import type { UserRole } from '../types/auth';
import { AppError } from '../utils/errors';

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.header('authorization');
  const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : undefined;

  if (!token) {
    throw new AppError(401, 'AUTHENTICATION_ERROR', 'Missing bearer token');
  }

  try {
    req.user = TokenService.verifyAccessToken(token);
    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      next(new AppError(401, 'AUTHENTICATION_ERROR', 'Token expired'));
    } else {
      next(new AppError(401, 'AUTHENTICATION_ERROR', 'Invalid token'));
    }
  }
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError(401, 'AUTHENTICATION_ERROR', 'Authentication required');
    }

    if (!roles.includes(req.user.role)) {
      throw new AppError(403, 'AUTHORIZATION_ERROR', 'Insufficient role for this operation');
    }

    next();
  };
}

export function requireCompanyAccess(paramName = 'companyId') {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError(401, 'AUTHENTICATION_ERROR', 'Authentication required');
    }

    const companyId = req.params[paramName] ?? req.body?.[paramName];
    if (req.user.role === 'admin' || req.user.companyIds.includes(companyId)) {
      next();
      return;
    }

    throw new AppError(403, 'AUTHORIZATION_ERROR', 'Company access denied');
  };
}
