import bcrypt from 'bcryptjs';
import { connectDatabase } from '../src/config/database.js';
import { validateEnv } from '../src/config/env.js';
import { Contract } from '../src/models/Contract.js';
import { Payment } from '../src/models/Payment.js';
import { Room } from '../src/models/Room.js';
import { Tenant } from '../src/models/Tenant.js';
import { User } from '../src/models/User.js';
import { contracts, payments, rooms, tenants, users } from './seed-data.js';

async function resetSeed() {
  validateEnv();
  await connectDatabase();

  await Promise.all([
    Payment.deleteMany({}),
    Contract.deleteMany({}),
    Tenant.deleteMany({}),
    User.deleteMany({}),
    Room.deleteMany({}),
  ]);

  await Room.insertMany(rooms.map((room) => ({ ...room, deletedAt: null })));

  const usersToInsert = await Promise.all(
    users.map(async (user) => ({
      fullName: user.fullName,
      email: user.email,
      passwordHash: await bcrypt.hash(user.password, 10),
      role: user.role,
      isActive: true,
    })),
  );
  await User.insertMany(usersToInsert);

  for (const tenant of tenants) {
    const room = await Room.findOne({ name: tenant.roomName });
    await Tenant.create({
      fullName: tenant.fullName,
      phone: tenant.phone,
      email: tenant.email,
      identityNumber: tenant.identityNumber,
      room: room?._id,
    });
  }

  for (const contractData of contracts) {
    const [room, tenant] = await Promise.all([
      Room.findOne({ name: contractData.roomName }),
      Tenant.findOne({ email: contractData.tenantEmail }),
    ]);

    await Contract.create({
      room: room._id,
      tenant: tenant._id,
      startDate: contractData.startDate,
      monthlyPrice: contractData.monthlyPrice,
      deposit: contractData.deposit,
      status: contractData.status,
    });
  }

  for (const paymentData of payments) {
    const tenant = await Tenant.findOne({ email: paymentData.tenantEmail });
    const contract = await Contract.findOne({ tenant: tenant._id });

    await Payment.create({
      contract: contract._id,
      amount: paymentData.amount,
      dueDate: paymentData.dueDate,
      paidAt: paymentData.paidAt,
      method: paymentData.method,
      status: paymentData.status,
      note: paymentData.note,
    });
  }

  console.log(
    `Reset and seeded ${rooms.length} rooms, ${users.length} users, ${tenants.length} tenants`,
  );
  process.exit(0);
}

resetSeed().catch((error) => {
  console.error('Seed reset failed:', error.message);
  process.exit(1);
});
