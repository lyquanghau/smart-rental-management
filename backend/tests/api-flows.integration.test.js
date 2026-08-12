import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const shouldRun = process.env.SMART_RENTAL_RUN_INTEGRATION_TESTS === 'true';
const mongodbUri = process.env.MONGODB_URI || '';
let server;

function isSafeTestDatabaseUri(uri) {
  if (!uri) return false;

  try {
    const parsed = new URL(uri);
    const databaseName = parsed.pathname.replace('/', '').split('?')[0];

    return databaseName.toLowerCase().includes('test');
  } catch {
    const databaseName = uri.split('/').pop()?.split('?')[0] || '';
    return databaseName.toLowerCase().includes('test');
  }
}

function authHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
  };
}

async function request(baseUrl, path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const contentType = response.headers.get('content-type') || '';
  const body = contentType.includes('application/json')
    ? await response.json()
    : await response.text();

  return { body, response };
}

async function seedLandlord(User, email, password) {
  return User.create({
    fullName: email,
    email,
    passwordHash: await bcrypt.hash(password, 10),
    role: 'landlord',
  });
}

after(async () => {
  if (server) {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }

  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
});

test(
  'integration: protects landlord data and syncs invoice payments',
  {
    skip: !shouldRun
      ? 'Set SMART_RENTAL_RUN_INTEGRATION_TESTS=true to run integration tests.'
      : !isSafeTestDatabaseUri(mongodbUri)
        ? 'MONGODB_URI must point to a database whose name contains "test".'
        : false,
  },
  async () => {
    const { default: app } = await import('../src/app.js');
    const { User } = await import('../src/models/User.js');
    const { Room } = await import('../src/models/Room.js');
    const { Tenant } = await import('../src/models/Tenant.js');
    const { Contract } = await import('../src/models/Contract.js');
    const { Invoice } = await import('../src/models/Invoice.js');
    const { Notification } = await import('../src/models/Notification.js');
    const { Payment } = await import('../src/models/Payment.js');
    const { UtilityReading } = await import('../src/models/UtilityReading.js');
    const { ServiceSetting } = await import('../src/models/ServiceSetting.js');

    await mongoose.connect(mongodbUri);
    await Promise.all([
      User.deleteMany({}),
      Room.deleteMany({}),
      Tenant.deleteMany({}),
      Contract.deleteMany({}),
      Invoice.deleteMany({}),
      Notification.deleteMany({}),
      Payment.deleteMany({}),
      UtilityReading.deleteMany({}),
      ServiceSetting.deleteMany({}),
    ]);

    await seedLandlord(User, 'owner-a@example.com', 'Password@123');
    await seedLandlord(User, 'owner-b@example.com', 'Password@123');

    server = app.listen(0);
    await new Promise((resolve) => server.once('listening', resolve));
    const address = server.address();
    const baseUrl = `http://127.0.0.1:${address.port}/api`;

    const ownerALogin = await request(baseUrl, '/auth/login', {
      body: JSON.stringify({
        email: 'owner-a@example.com',
        password: 'Password@123',
      }),
      method: 'POST',
    });
    const ownerBLogin = await request(baseUrl, '/auth/login', {
      body: JSON.stringify({
        email: 'owner-b@example.com',
        password: 'Password@123',
      }),
      method: 'POST',
    });
    const ownerAToken = ownerALogin.body.data.token;
    const ownerBToken = ownerBLogin.body.data.token;

    const ownerARoom = await request(baseUrl, '/rooms', {
      body: JSON.stringify({
        name: 'A101',
        floor: 1,
        price: 2500000,
        maxOccupants: 2,
        status: 'available',
      }),
      headers: authHeaders(ownerAToken),
      method: 'POST',
    });
    const ownerBRoom = await request(baseUrl, '/rooms', {
      body: JSON.stringify({
        name: 'B101',
        floor: 1,
        price: 2600000,
        maxOccupants: 2,
        status: 'available',
      }),
      headers: authHeaders(ownerBToken),
      method: 'POST',
    });

    assert.equal(ownerARoom.response.status, 201);
    assert.equal(ownerBRoom.response.status, 201);

    const blockedRoomRead = await request(
      baseUrl,
      `/rooms/${ownerARoom.body.data._id}`,
      {
        headers: authHeaders(ownerBToken),
      },
    );
    assert.equal(blockedRoomRead.response.status, 404);

    const ownerBRooms = await request(baseUrl, '/rooms', {
      headers: authHeaders(ownerBToken),
    });
    assert.equal(ownerBRooms.body.meta.total, 1);
    assert.equal(ownerBRooms.body.data[0]._id, ownerBRoom.body.data._id);

    const tenantA = await request(baseUrl, '/tenants', {
      body: JSON.stringify({
        fullName: 'Nguyen Van An',
        phone: '0901000001',
        room: ownerARoom.body.data._id,
      }),
      headers: authHeaders(ownerAToken),
      method: 'POST',
    });
    const secondTenantA = await request(baseUrl, '/tenants', {
      body: JSON.stringify({
        fullName: 'Tran Thi Binh',
        phone: '0901000002',
        room: ownerARoom.body.data._id,
      }),
      headers: authHeaders(ownerAToken),
      method: 'POST',
    });

    assert.equal(tenantA.response.status, 201);
    assert.equal(secondTenantA.response.status, 201);

    const contractA = await request(baseUrl, '/contracts', {
      body: JSON.stringify({
        room: ownerARoom.body.data._id,
        tenant: tenantA.body.data._id,
        startDate: '2026-07-01',
        endDate: '2027-07-01',
        monthlyPrice: 2500000,
        deposit: 2500000,
        status: 'active',
      }),
      headers: authHeaders(ownerAToken),
      method: 'POST',
    });
    assert.equal(contractA.response.status, 201);
    assert.ok(contractA.body.data.temporaryAccount);

    const duplicateContract = await request(baseUrl, '/contracts', {
      body: JSON.stringify({
        room: ownerARoom.body.data._id,
        tenant: secondTenantA.body.data._id,
        startDate: '2026-08-01',
        endDate: '2027-08-01',
        monthlyPrice: 2500000,
        deposit: 2500000,
        status: 'active',
      }),
      headers: authHeaders(ownerAToken),
      method: 'POST',
    });
    assert.equal(duplicateContract.response.status, 400);
    assert.ok(duplicateContract.body.errors.room);

    const generatedInvoices = await request(
      baseUrl,
      '/invoices/generate-monthly',
      {
        body: JSON.stringify({
          month: 7,
          year: 2026,
          dueDate: '2026-07-30',
        }),
        headers: authHeaders(ownerAToken),
        method: 'POST',
      },
    );
    assert.equal(generatedInvoices.response.status, 201);
    assert.equal(generatedInvoices.body.data.results[0].status, 'created');
    assert.equal(generatedInvoices.body.data.invoices.length, 1);

    const duplicateInvoices = await request(
      baseUrl,
      '/invoices/generate-monthly',
      {
        body: JSON.stringify({
          month: 7,
          year: 2026,
          dueDate: '2026-07-30',
        }),
        headers: authHeaders(ownerAToken),
        method: 'POST',
      },
    );
    assert.equal(duplicateInvoices.response.status, 201);
    assert.equal(duplicateInvoices.body.data.results[0].status, 'skipped');

    const invoiceId = generatedInvoices.body.data.invoices[0]._id;
    const pendingPayments = await request(baseUrl, '/payments', {
      headers: authHeaders(ownerAToken),
    });
    assert.equal(pendingPayments.response.status, 200);
    assert.equal(pendingPayments.body.data.length, 1);
    assert.equal(pendingPayments.body.data[0].invoice._id, invoiceId);
    assert.equal(pendingPayments.body.data[0].status, 'pending');

    const paidInvoice = await request(
      baseUrl,
      `/invoices/${invoiceId}/mark-paid`,
      {
        body: JSON.stringify({
          method: 'bank_transfer',
          paidAt: '2026-07-15',
        }),
        headers: authHeaders(ownerAToken),
        method: 'PATCH',
      },
    );
    assert.equal(paidInvoice.response.status, 200);
    assert.equal(paidInvoice.body.data.status, 'paid');

    const paidPayments = await request(baseUrl, '/payments', {
      headers: authHeaders(ownerAToken),
    });
    assert.equal(paidPayments.body.data[0].status, 'paid');
    assert.equal(paidPayments.body.data[0].method, 'bank_transfer');
  },
);
