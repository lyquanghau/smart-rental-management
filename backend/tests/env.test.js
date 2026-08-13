import assert from 'node:assert/strict';
import { test } from 'node:test';

const ENV_KEYS = [
  'NODE_ENV',
  'PORT',
  'MONGODB_URI',
  'JWT_SECRET',
  'CLIENT_URL',
  'CLIENT_URLS',
  'ALLOW_PUBLIC_REGISTRATION',
  'RATE_LIMIT_WINDOW_MS',
  'RATE_LIMIT_MAX',
  'MOMO_ACCESS_KEY',
  'MOMO_ENDPOINT',
  'MOMO_IPN_URL',
  'MOMO_MOCK_MODE',
  'MOMO_PARTNER_CODE',
  'MOMO_REDIRECT_URL',
  'MOMO_SECRET_KEY',
  'SEPAY_API_KEY',
  'SEPAY_AUTH_MODE',
  'SEPAY_MOCK_MODE',
  'SEPAY_WEBHOOK_SECRET',
  'SMART_RENTAL_SKIP_DOTENV',
  'SMTP_FROM',
  'SMTP_HOST',
  'SMTP_PASSWORD',
  'SMTP_PORT',
  'SMTP_SECURE',
  'SMTP_USER',
];

let importCounter = 0;

async function loadEnvModule(values) {
  const snapshot = new Map(ENV_KEYS.map((key) => [key, process.env[key]]));

  for (const key of ENV_KEYS) {
    delete process.env[key];
  }

  Object.assign(process.env, values);
  process.env.SMART_RENTAL_SKIP_DOTENV = 'true';

  const module = await import(
    `../src/config/env.js?testCase=${Date.now()}-${importCounter++}`
  );

  for (const key of ENV_KEYS) {
    if (snapshot.get(key) === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = snapshot.get(key);
    }
  }

  return module;
}

test('validateEnv requires database and JWT settings', async () => {
  const { validateEnv } = await loadEnvModule({
    MONGODB_URI: '',
    JWT_SECRET: '',
  });

  assert.throws(
    () => validateEnv(),
    /Missing required environment variables: MONGODB_URI, JWT_SECRET/,
  );
});

test('validateEnv rejects weak production secrets', async () => {
  const { validateEnv } = await loadEnvModule({
    NODE_ENV: 'production',
    MONGODB_URI: 'mongodb+srv://user:pass@example.mongodb.net/smart_rental',
    JWT_SECRET: 'short',
    CLIENT_URLS: 'https://smart-rental.example.com',
  });

  assert.throws(() => validateEnv(), /JWT_SECRET must be changed/);
});

test('validateEnv rejects placeholder production database URLs', async () => {
  const { validateEnv } = await loadEnvModule({
    NODE_ENV: 'production',
    MONGODB_URI: 'mongodb+srv://<username>:<password>@cluster/smart_rental',
    JWT_SECRET: 'a-production-secret-with-more-than-32-characters',
    CLIENT_URLS: 'https://smart-rental.example.com',
  });

  assert.throws(() => validateEnv(), /MONGODB_URI still contains placeholder/);
});

test('validateEnv rejects wildcard CORS in production', async () => {
  const { validateEnv } = await loadEnvModule({
    NODE_ENV: 'production',
    MONGODB_URI: 'mongodb+srv://user:pass@example.mongodb.net/smart_rental',
    JWT_SECRET: 'a-production-secret-with-more-than-32-characters',
    CLIENT_URLS: '*',
  });

  assert.throws(() => validateEnv(), /CLIENT_URLS cannot include/);
});

test('production env accepts strong deployment settings', async () => {
  const { env, validateEnv } = await loadEnvModule({
    NODE_ENV: 'production',
    MONGODB_URI: 'mongodb+srv://user:pass@example.mongodb.net/smart_rental',
    JWT_SECRET: 'a-production-secret-with-more-than-32-characters',
    CLIENT_URLS: 'https://smart-rental.example.com',
    ALLOW_PUBLIC_REGISTRATION: 'false',
  });

  assert.doesNotThrow(() => validateEnv());
  assert.equal(env.allowPublicRegistration, false);
  assert.deepEqual(env.clientUrls, ['https://smart-rental.example.com']);
});

test('production env rejects real MoMo mode without gateway settings', async () => {
  const { validateEnv } = await loadEnvModule({
    NODE_ENV: 'production',
    MONGODB_URI: 'mongodb+srv://user:pass@example.mongodb.net/smart_rental',
    JWT_SECRET: 'a-production-secret-with-more-than-32-characters',
    CLIENT_URLS: 'https://smart-rental.example.com',
    MOMO_MOCK_MODE: 'false',
  });

  assert.throws(() => validateEnv(), /Missing MoMo production settings/);
});

test('production env accepts real MoMo mode with gateway settings', async () => {
  const { env, validateEnv } = await loadEnvModule({
    NODE_ENV: 'production',
    MONGODB_URI: 'mongodb+srv://user:pass@example.mongodb.net/smart_rental',
    JWT_SECRET: 'a-production-secret-with-more-than-32-characters',
    CLIENT_URLS: 'https://smart-rental.example.com',
    MOMO_ACCESS_KEY: 'access-key',
    MOMO_IPN_URL: 'https://api.smart-rental.example.com/api/webhooks/momo',
    MOMO_MOCK_MODE: 'false',
    MOMO_PARTNER_CODE: 'partner-code',
    MOMO_REDIRECT_URL: 'https://smart-rental.example.com/tenant-portal',
    MOMO_SECRET_KEY: 'secret-key',
  });

  assert.doesNotThrow(() => validateEnv());
  assert.equal(env.momo.mockMode, false);
});

test('production env rejects real SePay mode without webhook secret', async () => {
  const { validateEnv } = await loadEnvModule({
    NODE_ENV: 'production',
    MONGODB_URI: 'mongodb+srv://user:pass@example.mongodb.net/smart_rental',
    JWT_SECRET: 'a-production-secret-with-more-than-32-characters',
    CLIENT_URLS: 'https://smart-rental.example.com',
    SEPAY_MOCK_MODE: 'false',
  });

  assert.throws(() => validateEnv(), /Missing SePay production settings/);
});

test('production env accepts real SePay HMAC mode with webhook secret', async () => {
  const { env, validateEnv } = await loadEnvModule({
    NODE_ENV: 'production',
    MONGODB_URI: 'mongodb+srv://user:pass@example.mongodb.net/smart_rental',
    JWT_SECRET: 'a-production-secret-with-more-than-32-characters',
    CLIENT_URLS: 'https://smart-rental.example.com',
    SEPAY_AUTH_MODE: 'hmac',
    SEPAY_MOCK_MODE: 'false',
    SEPAY_WEBHOOK_SECRET: 'sepay-webhook-secret',
  });

  assert.doesNotThrow(() => validateEnv());
  assert.equal(env.sepay.mockMode, false);
});
