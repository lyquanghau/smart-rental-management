import bcrypt from 'bcryptjs';
import { connectDatabase } from '../src/config/database.js';
import { validateEnv } from '../src/config/env.js';
import { Contract } from '../src/models/Contract.js';
import { Invoice } from '../src/models/Invoice.js';
import { Payment } from '../src/models/Payment.js';
import { Room } from '../src/models/Room.js';
import { ServiceSetting } from '../src/models/ServiceSetting.js';
import { Tenant } from '../src/models/Tenant.js';
import { UtilityReading } from '../src/models/UtilityReading.js';
import { User } from '../src/models/User.js';
import {
  contracts,
  invoices,
  payments,
  rooms,
  serviceSetting,
  tenants,
  users,
  utilityReadings,
} from './seed-data.js';

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

  await ServiceSetting.updateOne(
    {},
    { $set: serviceSetting },
    { upsert: true },
  );

  for (const readingData of utilityReadings) {
    const tenant = await Tenant.findOne({ email: readingData.tenantEmail });
    const contract = await Contract.findOne({ tenant: tenant._id });
    const electricityUsage =
      readingData.electricityCurrent - readingData.electricityPrevious;
    const waterUsage = readingData.waterCurrent - readingData.waterPrevious;
    const electricityAmount =
      electricityUsage * serviceSetting.electricityUnitPrice;
    const waterAmount = waterUsage * serviceSetting.waterUnitPrice;
    const parkingAmount =
      readingData.parkingVehicleCount * serviceSetting.parkingFeePerVehicle;
    const serviceTotal =
      electricityAmount +
      waterAmount +
      readingData.internetAmount +
      readingData.trashAmount +
      parkingAmount;

    await UtilityReading.updateOne(
      {
        contract: contract._id,
        month: readingData.month,
        year: readingData.year,
      },
      {
        $set: {
          room: contract.room,
          contract: contract._id,
          month: readingData.month,
          year: readingData.year,
          electricityPrevious: readingData.electricityPrevious,
          electricityCurrent: readingData.electricityCurrent,
          electricityUsage,
          electricityAmount,
          waterPrevious: readingData.waterPrevious,
          waterCurrent: readingData.waterCurrent,
          waterUsage,
          waterAmount,
          internetAmount: readingData.internetAmount,
          trashAmount: readingData.trashAmount,
          parkingVehicleCount: readingData.parkingVehicleCount,
          parkingAmount,
          serviceTotal,
          note: readingData.note,
        },
      },
      { upsert: true },
    );
  }

  for (const invoiceData of invoices) {
    const tenant = await Tenant.findOne({ email: invoiceData.tenantEmail });
    const contract = await Contract.findOne({ tenant: tenant._id });
    const reading = await UtilityReading.findOne({
      contract: contract._id,
      month: invoiceData.month,
      year: invoiceData.year,
    });
    const serviceAmount = reading?.serviceTotal || 0;
    const totalAmount = contract.monthlyPrice + serviceAmount;
    const invoice = await Invoice.findOneAndUpdate(
      {
        contract: contract._id,
        month: invoiceData.month,
        year: invoiceData.year,
      },
      {
        $set: {
          contract: contract._id,
          room: contract.room,
          tenant: contract.tenant,
          utilityReading: reading?._id,
          month: invoiceData.month,
          year: invoiceData.year,
          dueDate: invoiceData.dueDate,
          rentAmount: contract.monthlyPrice,
          serviceAmount,
          totalAmount,
          status: invoiceData.status,
          note: invoiceData.note,
          items: [
            {
              name: 'Tien phong',
              quantity: 1,
              unitPrice: contract.monthlyPrice,
              amount: contract.monthlyPrice,
            },
            {
              name: 'Dich vu',
              quantity: 1,
              unitPrice: serviceAmount,
              amount: serviceAmount,
            },
          ],
        },
      },
      { new: true, upsert: true },
    );

    await Payment.updateOne(
      { invoice: invoice._id },
      {
        $set: {
          invoice: invoice._id,
          contract: contract._id,
          amount: totalAmount,
          dueDate: invoiceData.dueDate,
          method: 'cash',
          status: 'pending',
          note: invoiceData.note,
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
