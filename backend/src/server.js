import app from './app.js';
import { connectDatabase } from './config/database.js';
import { env, validateEnv } from './config/env.js';

async function startServer() {
  validateEnv();
  await connectDatabase();

  app.listen(env.port, () => {
    console.log(`Server running on http://localhost:${env.port}`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start server:', error.message);
  process.exit(1);
});
