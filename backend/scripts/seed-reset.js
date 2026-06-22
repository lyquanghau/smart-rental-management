import { connectDatabase } from '../src/config/database.js';
import { validateEnv } from '../src/config/env.js';
import { Room } from '../src/models/Room.js';
import { rooms } from './seed-data.js';

async function resetSeed() {
  validateEnv();
  await connectDatabase();

  await Room.deleteMany({});
  await Room.insertMany(rooms);

  console.log(`Reset and seeded ${rooms.length} rooms`);
  process.exit(0);
}

resetSeed().catch((error) => {
  console.error('Seed reset failed:', error.message);
  process.exit(1);
});
