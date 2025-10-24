import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/errorHandler';
import { securityHeaders, corsConfig } from './middleware/security';
import { sanitizeBody } from './middleware/validation';
import { apiLimiter, authLimiter, submissionLimiter, clarificationLimiter } from './middleware/rateLimiter';
import { authRouter } from './routes/auth';
import { userRouter } from './routes/users';
import { teamRouter } from './routes/teams';
import { siteRouter } from './routes/sites';
import { contestRouter } from './routes/contests';
import { languageRouter } from './routes/languages';
import { problemRouter } from './routes/problems';
import { submissionRouter } from './routes/submissions';
import { scoreboardRouter } from './routes/scoreboard';
import { clarificationRouter } from './routes/clarifications';
import { announcementRouter } from './routes/announcements';
import { eventRouter } from './routes/events';
import { webhookRouter } from './routes/webhooks';
import { fileRouter } from './routes/files';
import { configRouter } from './routes/config';
import { auditRouter } from './routes/audit';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(securityHeaders);
app.use(cors(corsConfig));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(sanitizeBody);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api', apiLimiter);
app.use('/api/auth', authLimiter, authRouter);
app.use('/api/users', userRouter);
app.use('/api/teams', teamRouter);
app.use('/api/sites', siteRouter);
app.use('/api/contests', contestRouter);
app.use('/api/languages', languageRouter);
app.use('/api/problems', problemRouter);
app.use('/api/submissions', submissionLimiter, submissionRouter);
app.use('/api/scoreboard', scoreboardRouter);
app.use('/api/clarifications', clarificationLimiter, clarificationRouter);
app.use('/api/announcements', announcementRouter);
app.use('/api/events', eventRouter);
app.use('/api/webhooks', webhookRouter);
app.use('/api/files', fileRouter);
app.use('/api/config', configRouter);
app.use('/api/audit', auditRouter);

app.use(errorHandler);

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
