import type { NextFunction, Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { config } from '../config/env';
import { ApiError, asyncHandler } from '../utils/http';
import { verifyToken } from '../utils/jwt';

function extractToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) return header.slice(7).trim();
  const cookies = req.cookies as Record<string, string> | undefined;
  return cookies?.[config.cookieName] ?? null;
}

export const attachUser = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  const token = extractToken(req);
  if (!token) return next();
  try {
    const payload = verifyToken(token);
    const user = await prisma.user.findFirst({
      where: { id: payload.sub, deletedAt: null },
      select: { id: true, role: true, username: true, fullName: true, isActive: true },
    });
    if (user && user.isActive) {
      req.user = {
        sub: user.id,
        username: user.username,
        role: user.role,
        fullName: user.fullName,
      };
    }
  } catch {
    req.user = undefined;
  }
  return next();
});

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) return next(ApiError.unauthorized());
  return next();
}

export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden('این عملیات تنها برای مدیر سیستم مجاز است.'));
    }
    return next();
  };
}

export const requireAdmin = requireRole('ADMIN');
