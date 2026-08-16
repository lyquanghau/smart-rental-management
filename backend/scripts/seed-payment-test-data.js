import bcrypt from 'bcryptjs';
import { connectDatabase } from '../src/config/database.js';
import { validateEnv } from '../src/config/env.js';
import { Contract } from '../src/models/Contract.js';
import { Invoice } from '../src/models/Invoice.js';
import { Payment } from '../src/models/Payment.js';
import { Room } from '../src/models/Room.js';
import { ServiceSetting } from '../src/models/ServiceSetting.js';
import { Tenant } from '../src/models/Tenant.js';
import { User } from '../src/models/User.js';

const landlordAccount = {
  email: 'payment-test-landlord@smartrental.local',
  fullName: 'Payment Test Landlord',
  password: 'Admin@123456',
  username: 'payment-test-landlord',
};
const tenantAccount = {
  email: 'payment-test-tenant@smartrental.local',
  fullName: 'Payment Test Tenant',
  password: 'Tenant@123456',
  phone: '0909000001',
  username: 'payment-test-tenant',
};

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function invoiceItems({ rentAmount, serviceAmount }) {
  return [
    {
      amount: rentAmount,
      name: 'Tien phong',
      quantity: 1,
      unitPrice: rentAmount,
    },
    {
      amount: serviceAmount,
      name: 'Dich vu test',
      quantity: 1,
      unitPrice: serviceAmount,
    },
  ];
}

async function upsertUser({ email, fullName, password, role, username }) {
  const passwordHash = await bcrypt.hash(password, 10);

  return User.findOneAndUpdate(
    { email },
    {
      $set: {
        email,
        fullName,
        isActive: true,
        mustChangePassword: false,
        passwordHash,
        role,
        temporaryPasswordExpiresAt: null,
        username,
      },
    },
    { new: true, runValidators: true, upsert: true },
  );
}

async function seedPaymentTestData() {
  validateEnv();
  await connectDatabase();

  const [landlord, tenantUser] = await Promise.all([
    upsertUser({ ...landlordAccount, role: 'landlord' }),
    upsertUser({ ...tenantAccount, role: 'tenant' }),
  ]);
  const room = await Room.findOneAndUpdate(
    { name: 'PAYMENT-TEST-101', owner: landlord._id },
    {
      $set: {
        deletedAt: null,
        floor: 1,
        maxOccupants: 2,
        name: 'PAYMENT-TEST-101',
        owner: landlord._id,
        price: 2500000,
        status: 'occupied',
      },
    },
    { new: true, runValidators: true, upsert: true },
  );
  const tenant = await Tenant.findOneAndUpdate(
    { email: tenantAccount.email, owner: landlord._id },
    {
      $set: {
        deletedAt: null,
        email: tenantAccount.email,
        fullName: tenantAccount.fullName,
        owner: landlord._id,
        phone: tenantAccount.phone,
        room: room._id,
        user: tenantUser._id,
      },
    },
    { new: true, runValidators: true, upsert: true },
  );
  const contract = await Contract.findOneAndUpdate(
    { owner: landlord._id, room: room._id, status: 'active' },
    {
      $set: {
        deposit: 2500000,
        monthlyPrice: 2500000,
        owner: landlord._id,
        room: room._id,
        startDate: new Date('2026-08-01T00:00:00.000Z'),
        status: 'active',
        tenant: tenant._id,
      },
    },
    { new: true, runValidators: true, upsert: true },
  );

  await ServiceSetting.findOneAndUpdate(
    { owner: landlord._id },
    {
      $set: {
        bankAccountName: 'PAYMENT TEST LANDLORD',
        bankAccountNumber: '0123456789',
        bankCode: 'MBBank',
        bankName: 'MBBank',
        electricityUnitPrice: 3500,
        internetFee: 100000,
        owner: landlord._id,
        parkingFeePerVehicle: 100000,
        paymentNote: 'Du lieu test auto payment cua Smart Rental.',
        transferContentTemplate: 'Thanh toan phong {room} thang {month}-{year}',
        trashFee: 30000,
        waterUnitPrice: 100000,
      },
    },
    { new: true, runValidators: true, upsert: true },
  );

  const today = new Date();
  const overdueDueDate = addDays(today, -3);
  const payableDueDate = addDays(today, 7);
  const overdueInvoice = await Invoice.findOneAndUpdate(
    { contract: contract._id, month: 1, owner: landlord._id, year: 2099 },
    {
      $set: {
        contract: contract._id,
        dueDate: overdueDueDate,
        items: invoiceItems({ rentAmount: 2500000, serviceAmount: 250000 }),
        month: 1,
        note: 'TEST_AUTO_OVERDUE - mo Dashboard/Thanh toan de tu chuyen overdue',
        owner: landlord._id,
        rentAmount: 2500000,
        room: room._id,
        serviceAmount: 250000,
        status: 'issued',
        tenant: tenant._id,
        totalAmount: 2750000,
        year: 2099,
      },
    },
    { new: true, runValidators: true, upsert: true },
  );

  await Payment.findOneAndUpdate(
    { invoice: overdueInvoice._id, owner: landlord._id },
    {
      $set: {
        amount: overdueInvoice.totalAmount,
        contract: contract._id,
        dueDate: overdueDueDate,
        invoice: overdueInvoice._id,
        method: 'bank_transfer',
        note: 'TEST_AUTO_OVERDUE - payment tu chuyen overdue',
        owner: landlord._id,
        status: 'pending',
      },
    },
    { new: true, runValidators: true, upsert: true },
  );

  const sepayInvoice = await Invoice.findOneAndUpdate(
    { contract: contract._id, month: 2, owner: landlord._id, year: 2099 },
    {
      $set: {
        contract: contract._id,
        dueDate: payableDueDate,
        items: invoiceItems({ rentAmount: 2500000, serviceAmount: 100000 }),
        month: 2,
        note: 'TEST_SEPAY_QR - dung de test QR/SePay/mock/Discord',
        owner: landlord._id,
        paymentOrderId: '',
        paymentProvider: 'manual',
        paymentQrCodeUrl: '',
        paymentRequestId: '',
        paymentStatus: 'none',
        rentAmount: 2500000,
        room: room._id,
        serviceAmount: 100000,
        status: 'issued',
        tenant: tenant._id,
        totalAmount: 2600000,
        year: 2099,
      },
    },
    { new: true, runValidators: true, upsert: true },
  );

  await Payment.findOneAndUpdate(
    { invoice: sepayInvoice._id, owner: landlord._id },
    {
      $set: {
        amount: sepayInvoice.totalAmount,
        contract: contract._id,
        dueDate: payableDueDate,
        invoice: sepayInvoice._id,
        method: 'bank_transfer',
        note: 'TEST_SEPAY_QR - payment dang cho thanh toan',
        owner: landlord._id,
        status: 'pending',
      },
    },
    { new: true, runValidators: true, upsert: true },
  );

  console.log('Payment test data is ready.');
  console.log(
    `Landlord: ${landlordAccount.email} / ${landlordAccount.password}`,
  );
  console.log(`Tenant: ${tenantAccount.email} / ${tenantAccount.password}`);
  console.log(`Room: ${room.name}`);
  console.log(`Overdue invoice id: ${overdueInvoice._id}`);
  console.log(`SePay invoice id: ${sepayInvoice._id}`);

  process.exit(0);
}

seedPaymentTestData().catch((error) => {
  console.error('Payment test seed failed:', error.message);
  process.exit(1);
});
