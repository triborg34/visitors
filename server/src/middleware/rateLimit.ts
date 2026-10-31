import rateLimit from 'express-rate-limit';
import { config } from '../config/env';

export const loginLimiter = rateLimit({
  windowMs: config.loginWindowMinutes * 60 * 1000,
  limit: config.loginMaxAttempts,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_ATTEMPTS',
      message: 'تلاش‌های ناموفق بیش از حد مجاز است. لطفاً چند دقیقه دیگر تلاش کنید.',
    },
  },
});

export const apiLimiter = rateLimit({
  windowMs: config.apiRateWindowMinutes * 60 * 1000,
  limit: config.apiRateLimit,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'تعداد درخواست‌ها بیش از حد مجاز است. کمی بعد دوباره تلاش کنید.',
    },
  },
});
