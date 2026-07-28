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
];

let importCounter = 0;

async function loadEnvModule(values) {
  const snapshot = new Map(ENV_KEYS.map((key) => [key, process.env[key]]));

  for (const key of ENV_KEYS) {
    delete process.env[key];
  }

  Object.assign(process.env, values);

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
