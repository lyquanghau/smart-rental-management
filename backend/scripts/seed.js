import bcrypt from 'bcryptjs';
import { connectDatabase } from '../src/config/database.js';
import { validateEnv } from '../src/config/env.js';
import { Contract } from '../src/models/Contract.js';
import { Payment } from '../src/models/Payment.js';
import { Room } from '../src/models/Room.js';
import { Tenant } from '../src/models/Tenant.js';
import { User } from '../src/models/User.js';
import { contracts, payments, rooms, tenants, users } from './seed-data.js';

async function seed() {
  validateEnv();
  await connectDatabase();

  for (const room of rooms) {
    await Room.updateOne(
      { name: room.name },
      { $set: { ...room, deletedAt: null } },
      { upsert: true },
    );
  }

  for (const user of users) {
    const passwordHash = await bcrypt.hash(user.password, 10);
    await User.updateOne(
      { email: user.email },
      {
        $set: {
          fullName: user.fullName,
          email: user.email,
          username: user.username,
          passwordHash,
          role: user.role,
          isActive: true,
          mustChangePassword: false,
          temporaryPasswordExpiresAt: null,
        },
      },
      { upsert: true },
    );
  }

  for (const tenant of tenants) {
    const room = await Room.findOne({ name: tenant.roomName });
    await Tenant.updateOne(
      { email: tenant.email },
      {
        $set: {
          fullName: tenant.fullName,
          phone: tenant.phone,
          email: tenant.email,
          identityNumber: tenant.identityNumber,
          room: room?._id,
        },
      },
      { upsert: true },
    );
  }

  for (const contractData of contracts) {
    const [room, tenant] = await Promise.all([
      Room.findOne({ name: contractData.roomName }),
      Tenant.findOne({ email: contractData.tenantEmail }),
    ]);

    await Contract.updateOne(
      { room: room._id, tenant: tenant._id, startDate: contractData.startDate },
      {
        $set: {
          room: room._id,
          tenant: tenant._id,
          startDate: contractData.startDate,
          monthlyPrice: contractData.monthlyPrice,
          deposit: contractData.deposit,
          status: contractData.status,
        },
      },
      { upsert: true },
    );
  }

  for (const paymentData of payments) {
    const tenant = await Tenant.findOne({ email: paymentData.tenantEmail });
    const contract = await Contract.findOne({ tenant: tenant._id });

    await Payment.updateOne(
      { contract: contract._id, dueDate: paymentData.dueDate },
      {
        $set: {
          contract: contract._id,
          amount: paymentData.amount,
          dueDate: paymentData.dueDate,
          paidAt: paymentData.paidAt,
          method: paymentData.method,
          status: paymentData.status,
          note: paymentData.note,
        },
      },
      { upsert: true },
    );
  }

  console.log(
    `Seeded ${rooms.length} rooms, ${users.length} users, ${tenants.length} tenants`,
  );
  process.exit(0);
}

seed().catch((error) => {
  console.error('Seed failed:', error.message);
  process.exit(1);
});
