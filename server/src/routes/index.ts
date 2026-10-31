import { Router } from 'express';
import { authRouter } from './auth.routes';
import { userRouter } from './user.routes';
import { exhibitionRouter } from './exhibition.routes';
import { visitorRouter } from './visitor.routes';
import { visitDetailRouter } from './visit-detail.routes';
import { templateRouter } from './template.routes';
import { settingsRouter } from './settings.routes';
import { reportRouter } from './report.routes';
import { exportRouter } from './export.routes';
import { messagingRouter } from './messaging.routes';

export const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/users', userRouter);
apiRouter.use('/exhibitions', exhibitionRouter);
apiRouter.use('/visitors', visitorRouter);
apiRouter.use('/visitors', visitDetailRouter);
apiRouter.use('/templates', templateRouter);
apiRouter.use('/settings', settingsRouter);
apiRouter.use('/reports', reportRouter);
apiRouter.use('/export', exportRouter);
apiRouter.use('/messaging', messagingRouter);
