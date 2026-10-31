import type { NextFunction, Request, Response } from 'express';
import { config } from '../config/env';
import { ApiError } from '../utils/http';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export function csrfGuard(req: Request, _res: Response, next: NextFunction) {
  if (SAFE_METHODS.has(req.method)) return next();
  if (req.path === '/auth/login') return next();

  const cookies = req.cookies as Record<string, string> | undefined;
  const cookieToken = cookies?.[config.csrfCookieName];
  const headerToken = req.headers['x-csrf-token'];
  const provided = typeof headerToken === 'string' ? headerToken : undefined;

  const usesBearer = Boolean(req.headers.authorization?.startsWith('Bearer '));
  if (usesBearer) return next();

  if (!cookieToken || !provided || cookieToken !== provided) {
    return next(
      new ApiError(403, 'درخواست به دلیل نامعتبر بودن توکن امنیتی رد شد. صفحه را تازه‌سازی کنید.', 'CSRF_INVALID'),
    );
  }
  return next();
}
