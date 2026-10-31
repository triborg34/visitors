import { Router } from 'express';
import { config } from '../config/env';
import { prisma } from '../config/prisma';
import { requireAuth } from '../middleware/auth';
import { loginLimiter } from '../middleware/rateLimit';
import { validate } from '../middleware/validate';
import { changePasswordSchema, loginSchema } from '../validators/auth.validator';
import { ApiError, asyncHandler } from '../utils/http';
import { hashPassword, verifyPassword } from '../utils/password';
import { signToken } from '../utils/jwt';
import { clientIp, recordAudit } from '../services/audit.service';

export const authRouter = Router();

function cookieOptions() {
  return {
    httpOnly: true,
    secure: config.cookieSecure,
    sameSite: config.cookieSameSite as 'lax' | 'strict' | 'none',
    path: '/',
    maxAge: 8 * 60 * 60 * 1000,
  };
}

function issueCsrfToken(res: import('express').Response): string {
  const token = Math.random().toString(36).slice(2) + Date.now().toString(36);
  res.cookie(config.csrfCookieName, token, {
    httpOnly: false,
    secure: config.cookieSecure,
    sameSite: config.cookieSameSite as 'lax' | 'strict' | 'none',
    path: '/',
    maxAge: 8 * 60 * 60 * 1000,
  });
  return token;
}

authRouter.post(
  '/login',
  loginLimiter,
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const { username, password } = req.body as { username: string; password: string };
    const user = await prisma.user.findFirst({
      where: { username: username.toLowerCase(), deletedAt: null },
    });

    const invalid = ApiError.unauthorized('نام کاربری یا رمز عبور نادرست است.');
    if (!user) {
      await recordAudit({
        action: 'AUTH_LOGIN_FAILED',
        entity: 'User',
        details: { username },
        ip: clientIp(req),
      });
      throw invalid;
    }
    if (!user.isActive) {
      throw ApiError.forbidden('حساب کاربری شما غیرفعال است. با مدیر سیستم تماس بگیرید.');
    }
    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      await recordAudit({
        userId: user.id,
        action: 'AUTH_LOGIN_FAILED',
        entity: 'User',
        entityId: user.id,
        ip: clientIp(req),
      });
      throw invalid;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const token = signToken({
      sub: user.id,
      username: user.username,
      role: user.role,
      fullName: user.fullName,
    });
    res.cookie(config.cookieName, token, cookieOptions());
    const csrfToken = issueCsrfToken(res);

    await recordAudit({
      userId: user.id,
      action: 'AUTH_LOGIN',
      entity: 'User',
      entityId: user.id,
      ip: clientIp(req),
    });

    res.json({
      success: true,
      data: {
        csrfToken,
        user: {
          id: user.id,
          username: user.username,
          fullName: user.fullName,
          role: user.role,
          email: user.email,
          phone: user.phone,
          activeExhibitionId: user.activeExhibitionId,
          mustChangePassword: user.mustChangePassword,
        },
      },
    });
  }),
);

authRouter.post(
  '/logout',
  asyncHandler(async (req, res) => {
    await recordAudit({
      userId: req.user?.sub,
      action: 'AUTH_LOGOUT',
      entity: 'User',
      entityId: req.user?.sub,
      ip: clientIp(req),
    });
    res.clearCookie(config.cookieName, { path: '/' });
    res.clearCookie(config.csrfCookieName, { path: '/' });
    res.json({ success: true, data: { message: 'با موفقیت خارج شدید.' } });
  }),
);

authRouter.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.sub },
      select: {
        id: true,
        username: true,
        fullName: true,
        role: true,
        email: true,
        phone: true,
        activeExhibitionId: true,
        mustChangePassword: true,
        activeExhibition: { select: { id: true, name: true } },
      },
    });
    if (!user) throw ApiError.unauthorized();
    res.json({ success: true, data: user });
  }),
);

authRouter.get(
  '/csrf',
  asyncHandler(async (_req, res) => {
    const csrfToken = issueCsrfToken(res);
    res.json({ success: true, data: { csrfToken } });
  }),
);

authRouter.post(
  '/change-password',
  requireAuth,
  validate(changePasswordSchema),
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body as {
      currentPassword: string;
      newPassword: string;
    };
    const user = await prisma.user.findUnique({ where: { id: req.user!.sub } });
    if (!user) throw ApiError.notFound('کاربر یافت نشد.');
    const valid = await verifyPassword(currentPassword, user.passwordHash);
    if (!valid) throw ApiError.badRequest('رمز عبور فعلی نادرست است.');

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: await hashPassword(newPassword),
        mustChangePassword: false,
      },
    });
    await recordAudit({
      userId: user.id,
      action: 'AUTH_PASSWORD_CHANGED',
      entity: 'User',
      entityId: user.id,
      ip: clientIp(req),
    });
    res.json({ success: true, data: { message: 'رمز عبور با موفقیت تغییر کرد.' } });
  }),
);
