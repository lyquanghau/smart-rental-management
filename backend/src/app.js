import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import routes from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFoundHandler } from './middleware/notFoundHandler.js';

const app = express();
const allowedOrigins = new Set(env.clientUrls);
const apiLimiter = rateLimit({
  legacyHeaders: false,
  limit: env.rateLimitMax,
  message: {
    message: 'Qua nhieu yeu cau, vui long thu lai sau',
  },
  standardHeaders: 'draft-7',
  windowMs: env.rateLimitWindowMs,
});

function corsOrigin(origin, callback) {
  if (!origin || allowedOrigins.has('*') || allowedOrigins.has(origin)) {
    callback(null, true);
    return;
  }

  callback(new Error('Origin khong duoc phep truy cap API'));
}

app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(apiLimiter);
app.use(express.json());
app.use(morgan('dev'));

app.use('/api', routes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
