import { connectDatabase } from '../src/config/database.js';
import { validateEnv } from '../src/config/env.js';
import { Room } from '../src/models/Room.js';
import { rooms } from './seed-data.js';

async function seed() {
  validateEnv();
  await connectDatabase();

  for (const room of rooms) {
    await Room.updateOne({ name: room.name }, { $set: room }, { upsert: true });
  }

  console.log(`Seeded ${rooms.length} rooms`);
  process.exit(0);
}

seed().catch((error) => {
  console.error('Seed failed:', error.message);
  process.exit(1);
});
