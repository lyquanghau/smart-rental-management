import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  buildOverdueStatusFilters,
  getOverdueCutoff,
  syncOverdueBillingStatuses,
} from '../src/utils/billingStatus.js';

test('getOverdueCutoff returns the start of the current local day', () => {
  const cutoff = getOverdueCutoff(new Date('2026-08-13T15:30:00+07:00'));

  assert.equal(cutoff.getHours(), 0);
  assert.equal(cutoff.getMinutes(), 0);
  assert.equal(cutoff.getSeconds(), 0);
  assert.equal(cutoff.getMilliseconds(), 0);
});

test('buildOverdueStatusFilters scopes landlord overdue invoice and payment updates', () => {
  const owner = 'owner-1';
  const { invoiceFilter, paymentFilter } = buildOverdueStatusFilters({
    now: new Date('2026-08-13T15:30:00'),
    owner,
  });

  assert.equal(invoiceFilter.owner, owner);
  assert.equal(invoiceFilter.status, 'issued');
  assert.deepEqual(invoiceFilter.dueDate, {
    $lt: new Date('2026-08-13T00:00:00'),
  });
  assert.equal(paymentFilter.owner, owner);
  assert.equal(paymentFilter.status, 'pending');
  assert.deepEqual(paymentFilter.dueDate, {
    $lt: new Date('2026-08-13T00:00:00'),
  });
});

test('buildOverdueStatusFilters scopes tenant payment updates by contracts', () => {
  const { invoiceFilter, paymentFilter } = buildOverdueStatusFilters({
    contractIds: ['contract-1', 'contract-2'],
    now: new Date('2026-08-13T15:30:00'),
    tenant: 'tenant-1',
  });

  assert.equal(invoiceFilter.tenant, 'tenant-1');
  assert.deepEqual(paymentFilter.contract, {
    $in: ['contract-1', 'contract-2'],
  });
});

test('buildOverdueStatusFilters rejects unscoped updates', () => {
  assert.throws(
    () => buildOverdueStatusFilters(),
    /requires owner, tenant, or contracts/,
  );
});

test('syncOverdueBillingStatuses updates only overdue open statuses', async () => {
  const calls = [];
  const invoiceModel = {
    async updateMany(filter, update) {
      calls.push({ collection: 'invoices', filter, update });
      return { modifiedCount: 2 };
    },
  };
  const paymentModel = {
    async updateMany(filter, update) {
      calls.push({ collection: 'payments', filter, update });
      return { modifiedCount: 1 };
    },
  };

  const result = await syncOverdueBillingStatuses({
    invoiceModel,
    now: new Date('2026-08-13T15:30:00'),
    owner: 'owner-1',
    paymentModel,
  });

  assert.deepEqual(result, {
    invoicesModified: 2,
    paymentsModified: 1,
  });
  assert.equal(calls[0].filter.status, 'issued');
  assert.equal(calls[1].filter.status, 'pending');
  assert.deepEqual(calls[0].update, { $set: { status: 'overdue' } });
  assert.deepEqual(calls[1].update, { $set: { status: 'overdue' } });
});
