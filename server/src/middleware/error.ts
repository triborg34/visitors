import type { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { config } from '../config/env';
import { ApiError } from '../utils/http';

export function notFoundHandler(req: Request, _res: Response, next: NextFunction) {
  next(new ApiError(404, 'مسیر ' + req.method + ' ' + req.originalUrl + ' یافت نشد.', 'NOT_FOUND'));
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  let status = 500;
  let code = 'INTERNAL_ERROR';
  let message = 'خطای غیرمنتظره در سرور رخ داد.';
  let details: unknown;

  if (err instanceof ApiError) {
    status = err.statusCode;
    code = err.code;
    message = err.message;
    details = err.details;
  } else if (err instanceof ZodError) {
    status = 422;
    code = 'VALIDATION_ERROR';
    message = 'اطلاعات وارد شده معتبر نیست.';
    details = err.flatten();
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      status = 409;
      code = 'DUPLICATE';
      message = 'این مقدار قبلاً ثبت شده است.';
      details = err.meta?.target;
    } else if (err.code === 'P2025') {
      status = 404;
      code = 'NOT_FOUND';
      message = 'رکورد مورد نظر یافت نشد.';
    } else if (err.code === 'P2003') {
      status = 400;
      code = 'FOREIGN_KEY';
      message = 'به دلیل وابستگی به داده‌های دیگر امکان این عملیات وجود ندارد.';
    } else {
      message = 'خطا در ارتباط با پایگاه داده.';
    }
  } else if (err instanceof Error) {
    message = config.isProd ? 'خطای غیرمنتظره در سرور رخ داد.' : err.message;
  }

  if (status >= 500) {
    console.error('[error]', err);
  }

  res.status(status).json({ success: false, error: { code, message, details } });
}
