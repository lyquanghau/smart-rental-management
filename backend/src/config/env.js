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
  allowPublicRegistration:
    process.env.ALLOW_PUBLIC_REGISTRATION === undefined
      ? process.env.NODE_ENV !== 'production'
      : process.env.ALLOW_PUBLIC_REGISTRATION === 'true',
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

  if (env.nodeEnv === 'production') {
    if (env.jwtSecret === 'change_me' || env.jwtSecret.length < 32) {
      throw new Error(
        'JWT_SECRET must be changed to a strong secret with at least 32 characters in production',
      );
    }

    if (env.mongodbUri.includes('<') || env.mongodbUri.includes('>')) {
      throw new Error('MONGODB_URI still contains placeholder values');
    }

    if (env.clientUrls.includes('*')) {
      throw new Error('CLIENT_URLS cannot include "*" in production');
    }
  }
}
