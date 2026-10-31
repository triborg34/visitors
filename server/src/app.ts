import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { config } from './config/env';
import { attachUser } from './middleware/auth';
import { csrfGuard } from './middleware/csrf';
import { errorHandler, notFoundHandler } from './middleware/error';
import { apiLimiter } from './middleware/rateLimit';
import { apiRouter } from './routes';

export function createApp() {
  const app = express();

  if (config.trustProxy) app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.use(
    cors({
      origin: true,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  app.use(cookieParser());

  app.get('/api/health', (_req, res) => {
    res.json({
      success: true,
      data: { status: 'ok', env: config.env, time: new Date().toISOString() },
    });
  });

  app.use('/api', apiLimiter, attachUser, csrfGuard, apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
