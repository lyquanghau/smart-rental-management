import dotenv from 'dotenv';

dotenv.config();

function parseNumber(value, fallback) {
  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseClientUrls() {
  const rawValue = process.env.CLIENT_URLS || process.env.CLIENT_URL;

  if (!rawValue) return ['http://localhost:5173'];

  return rawValue
    .split(',')
    .map((url) => url.trim())
    .filter(Boolean);
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 5000,
  mongodbUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  clientUrls: parseClientUrls(),
  rateLimitWindowMs: parseNumber(process.env.RATE_LIMIT_WINDOW_MS, 900000),
  rateLimitMax: parseNumber(process.env.RATE_LIMIT_MAX, 300),
};

export function validateEnv() {
  const missing = [];

  if (!env.mongodbUri) missing.push('MONGODB_URI');
  if (!env.jwtSecret) missing.push('JWT_SECRET');

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`,
    );
  }
}
