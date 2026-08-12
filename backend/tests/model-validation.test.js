import assert from 'node:assert/strict';
import { test } from 'node:test';
import mongoose from 'mongoose';
import { Contract } from '../src/models/Contract.js';
import { Invoice } from '../src/models/Invoice.js';
import { Notification } from '../src/models/Notification.js';
import { Payment } from '../src/models/Payment.js';
import { Room } from '../src/models/Room.js';
import { ServiceSetting } from '../src/models/ServiceSetting.js';
import { Tenant } from '../src/models/Tenant.js';
import { User } from '../src/models/User.js';
import { UtilityReading } from '../src/models/UtilityReading.js';

function id() {
  return new mongoose.Types.ObjectId();
}

test('business models require an owner for tenant data isolation', () => {
  const models = [
    new Room({ name: 'A101', floor: 1, price: 2500000 }),
    new Tenant({ fullName: 'Nguyen Van An', phone: '0901000001' }),
    new Contract({
      room: id(),
      tenant: id(),
      startDate: new Date('2026-07-01'),
      monthlyPrice: 2500000,
    }),
    new Payment({
      contract: id(),
      amount: 2500000,
      dueDate: new Date('2026-07-30'),
    }),
    new Invoice({
      contract: id(),
      room: id(),
      tenant: id(),
      month: 7,
      year: 2026,
      dueDate: new Date('2026-07-30'),
      rentAmount: 2500000,
      totalAmount: 2500000,
    }),
    new UtilityReading({
      room: id(),
      contract: id(),
      month: 7,
      year: 2026,
    }),
    new ServiceSetting(),
    new Notification({
      message: 'Hoa don da thanh toan',
      title: 'Thanh toan thanh cong',
    }),
  ];

  for (const model of models) {
    const error = model.validateSync();
    assert.ok(
      error?.errors.owner,
      `${model.constructor.modelName} lacks owner`,
    );
  }
});

test('room validation rejects invalid status and negative prices', () => {
  const room = new Room({
    owner: id(),
    name: 'A101',
    floor: 1,
    price: -1,
    maxOccupants: 0,
    status: 'reserved',
  });

  const error = room.validateSync();

  assert.ok(error?.errors.price);
  assert.ok(error?.errors.maxOccupants);
  assert.ok(error?.errors.status);
});

test('payment validation keeps manual and mock payment states bounded', () => {
  const payment = new Payment({
    owner: id(),
    contract: id(),
    amount: -1000,
    dueDate: new Date('2026-07-30'),
    method: 'paypal',
    status: 'refunded',
  });

  const error = payment.validateSync();

  assert.ok(error?.errors.amount);
  assert.ok(error?.errors.method);
  assert.ok(error?.errors.status);
});

test('invoice validation rejects invalid billing periods and negative items', () => {
  const invoice = new Invoice({
    owner: id(),
    contract: id(),
    room: id(),
    tenant: id(),
    month: 13,
    year: 1999,
    dueDate: new Date('2026-07-30'),
    rentAmount: 2500000,
    serviceAmount: -1,
    totalAmount: 2499999,
    items: [{ name: 'Electricity', quantity: 10, unitPrice: 3500, amount: -1 }],
  });

  const error = invoice.validateSync();

  assert.ok(error?.errors.month);
  assert.ok(error?.errors.year);
  assert.ok(error?.errors.serviceAmount);
  assert.ok(error?.errors['items.0.amount']);
});

test('utility reading validation rejects impossible periods and negative values', () => {
  const reading = new UtilityReading({
    owner: id(),
    room: id(),
    contract: id(),
    month: 0,
    year: 1999,
    electricityCurrent: -1,
    waterCurrent: -1,
  });

  const error = reading.validateSync();

  assert.ok(error?.errors.month);
  assert.ok(error?.errors.year);
  assert.ok(error?.errors.electricityCurrent);
  assert.ok(error?.errors.waterCurrent);
});

test('user validation normalizes login identifiers and limits roles', () => {
  const user = new User({
    fullName: 'Admin Smart Rental',
    email: 'ADMIN@SMARTRENTAL.LOCAL',
    username: 'ADMIN',
    passwordHash: 'hashed-password',
    role: 'manager',
  });

  const error = user.validateSync();

  assert.equal(user.email, 'admin@smartrental.local');
  assert.equal(user.username, 'admin');
  assert.ok(error?.errors.role);
});
