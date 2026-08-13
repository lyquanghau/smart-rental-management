import { Invoice } from '../models/Invoice.js';
import { Payment } from '../models/Payment.js';

export function getOverdueCutoff(now = new Date()) {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function buildOverdueStatusFilters({
  contractIds,
  now = new Date(),
  owner,
  tenant,
} = {}) {
  if (!owner && !tenant && !contractIds) {
    throw new Error('Overdue status sync requires owner, tenant, or contracts');
  }

  const cutoff = getOverdueCutoff(now);
  const invoiceFilter = {
    dueDate: { $lt: cutoff },
    status: 'issued',
  };
  const paymentFilter = {
    dueDate: { $lt: cutoff },
    status: 'pending',
  };

  if (owner) {
    invoiceFilter.owner = owner;
    paymentFilter.owner = owner;
  }

  if (tenant) {
    invoiceFilter.tenant = tenant;
  }

  if (contractIds) {
    paymentFilter.contract = { $in: contractIds };
  }

  return { invoiceFilter, paymentFilter };
}

export async function syncOverdueBillingStatuses({
  contractIds,
  invoiceModel = Invoice,
  now = new Date(),
  owner,
  paymentModel = Payment,
  tenant,
} = {}) {
  const { invoiceFilter, paymentFilter } = buildOverdueStatusFilters({
    contractIds,
    now,
    owner,
    tenant,
  });

  const [invoiceResult, paymentResult] = await Promise.all([
    invoiceModel.updateMany(invoiceFilter, { $set: { status: 'overdue' } }),
    paymentModel.updateMany(paymentFilter, { $set: { status: 'overdue' } }),
  ]);

  return {
    invoicesModified: invoiceResult.modifiedCount || 0,
    paymentsModified: paymentResult.modifiedCount || 0,
  };
}
