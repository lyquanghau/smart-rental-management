import dotenv from 'dotenv';

if (process.env.SMART_RENTAL_SKIP_DOTENV !== 'true') {
  dotenv.config();
}

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
  discordWebhookUrl: process.env.DISCORD_WEBHOOK_URL || '',
  mail: {
    from: process.env.SMTP_FROM || '',
    host: process.env.SMTP_HOST || '',
    password: process.env.SMTP_PASSWORD || '',
    port: parseNumber(process.env.SMTP_PORT, 587),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
  },
  momo: {
    accessKey: process.env.MOMO_ACCESS_KEY || '',
    endpoint:
      process.env.MOMO_ENDPOINT ||
      'https://test-payment.momo.vn/v2/gateway/api/create',
    ipnUrl: process.env.MOMO_IPN_URL || '',
    mockMode: process.env.MOMO_MOCK_MODE !== 'false',
    partnerCode: process.env.MOMO_PARTNER_CODE || '',
    redirectUrl: process.env.MOMO_REDIRECT_URL || '',
    secretKey: process.env.MOMO_SECRET_KEY || '',
  },
  sepay: {
    apiKey: process.env.SEPAY_API_KEY || '',
    authMode: process.env.SEPAY_AUTH_MODE || 'hmac',
    mockMode: process.env.SEPAY_MOCK_MODE !== 'false',
    webhookSecret: process.env.SEPAY_WEBHOOK_SECRET || '',
  },
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

    if (!env.momo.mockMode) {
      const missingMomo = [];

      if (!env.momo.partnerCode) missingMomo.push('MOMO_PARTNER_CODE');
      if (!env.momo.accessKey) missingMomo.push('MOMO_ACCESS_KEY');
      if (!env.momo.secretKey) missingMomo.push('MOMO_SECRET_KEY');
      if (!env.momo.redirectUrl) missingMomo.push('MOMO_REDIRECT_URL');
      if (!env.momo.ipnUrl) missingMomo.push('MOMO_IPN_URL');

      if (missingMomo.length > 0) {
        throw new Error(
          `Missing MoMo production settings: ${missingMomo.join(', ')}`,
        );
      }
    }

    if (!env.sepay.mockMode) {
      const missingSepay = [];

      if (env.sepay.authMode === 'hmac' && !env.sepay.webhookSecret) {
        missingSepay.push('SEPAY_WEBHOOK_SECRET');
      }

      if (env.sepay.authMode === 'api_key' && !env.sepay.apiKey) {
        missingSepay.push('SEPAY_API_KEY');
      }

      if (env.sepay.authMode === 'none') {
        throw new Error('SEPAY_AUTH_MODE cannot be "none" in production');
      }

      if (missingSepay.length > 0) {
        throw new Error(
          `Missing SePay production settings: ${missingSepay.join(', ')}`,
        );
      }
    }
  }
}
