import assert from 'node:assert/strict';
import { test } from 'node:test';
import mongoose from 'mongoose';
import {
  createSepayCode,
  findSepayOrderId,
} from '../src/controllers/paymentGatewayController.js';

test('createSepayCode builds readable room-month payment content', () => {
  const invoice = {
    _id: new mongoose.Types.ObjectId('64f000000000000000000123'),
    month: 8,
    room: { name: '102' },
    year: 2026,
  };

  assert.equal(createSepayCode(invoice), 'P102-HD-T8-2026');
});

test('createSepayCode normalizes room names for transfer content', () => {
  const invoice = {
    _id: new mongoose.Types.ObjectId('64f000000000000000000123'),
    month: 12,
    room: { name: 'A 10-2' },
    year: 2026,
  };

  assert.equal(createSepayCode(invoice), 'PA10-2-HD-T12-2026');
});

test('findSepayOrderId supports readable and legacy SePay codes', () => {
  assert.equal(
    findSepayOrderId({
      code: '',
      content: 'Khach chuyen P102-HD-T8-2026 tien phong',
    }),
    'P102-HD-T8-2026',
  );
  assert.equal(
    findSepayOrderId({
      code: 'SRINVA1026F176E',
      content: '',
    }),
    'SRINVA1026F176E',
  );
});
