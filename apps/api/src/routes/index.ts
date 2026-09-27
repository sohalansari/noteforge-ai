import { Router } from 'express';
import { authRouter } from './auth.routes.js';
import { userRouter } from './user.routes.js';
import { documentRouter } from './document.routes.js';
import { notesRouter } from './notes.routes.js';
import { jobRouter } from './job.routes.js';
import { usageRouter } from './usage.routes.js';

export const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/users', userRouter);
apiRouter.use('/documents', documentRouter);
apiRouter.use('/notes', notesRouter);
apiRouter.use('/jobs', jobRouter);
apiRouter.use('/usage', usageRouter);