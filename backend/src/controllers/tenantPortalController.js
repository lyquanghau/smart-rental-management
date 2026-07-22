import { Contract } from '../models/Contract.js';
import { Invoice } from '../models/Invoice.js';
import { Payment } from '../models/Payment.js';
import { Tenant } from '../models/Tenant.js';
import { createHttpError } from '../utils/httpError.js';

const contractPopulate = [
  { path: 'room', select: 'name floor price maxOccupants status' },
  { path: 'tenant', select: 'fullName phone email identityNumber room user' },
];

const invoicePopulate = [
  { path: 'room', select: 'name floor price maxOccupants status' },
  { path: 'tenant', select: 'fullName phone email identityNumber room user' },
  {
    path: 'contract',
    select: 'room tenant startDate endDate monthlyPrice deposit status',
    populate: contractPopulate,
  },
  { path: 'utilityReading' },
];

const paymentPopulate = [
  {
    path: 'contract',
    select: 'room tenant startDate endDate monthlyPrice deposit status',
    populate: contractPopulate,
  },
  {
    path: 'invoice',
    select: 'month year dueDate rentAmount serviceAmount totalAmount status',
  },
];

async function getCurrentTenant(userId) {
  const tenant = await Tenant.findOne({
    user: userId,
    deletedAt: null,
  }).populate('room', 'name floor price maxOccupants status');

  if (!tenant) {
    throw createHttpError(
      404,
      'Khong tim thay ho so khach thue lien ket voi tai khoan nay',
    );
  }

  return tenant;
}

export async function getTenantPortalSummary(req, res, next) {
  try {
    if (req.user.role !== 'tenant') {
      throw createHttpError(
        403,
        'Chi tai khoan khach thue moi xem duoc cong nay',
      );
    }

    const tenant = await getCurrentTenant(req.user._id);
    const contracts = await Contract.find({ tenant: tenant._id })
      .populate(contractPopulate)
      .sort({ status: 1, startDate: -1, createdAt: -1 });
    const contractIds = contracts.map((contract) => contract._id);
    const [invoices, payments] = await Promise.all([
      Invoice.find({ tenant: tenant._id })
        .populate(invoicePopulate)
        .sort({ year: -1, month: -1, dueDate: -1 })
        .limit(12),
      Payment.find({ contract: { $in: contractIds } })
        .populate(paymentPopulate)
        .sort({ dueDate: -1, createdAt: -1 })
        .limit(12),
    ]);

    const activeContract =
      contracts.find((contract) => contract.status === 'active') || null;
    const openInvoices = invoices.filter((invoice) =>
      ['draft', 'issued', 'overdue'].includes(invoice.status),
    );
    const openPayments = payments.filter((payment) =>
      ['pending', 'overdue'].includes(payment.status),
    );

    res.json({
      data: {
        tenant,
        room: activeContract?.room || tenant.room || null,
        activeContract,
        contracts,
        invoices,
        payments,
        totals: {
          openInvoiceAmount: openInvoices.reduce(
            (total, invoice) => total + Number(invoice.totalAmount || 0),
            0,
          ),
          openInvoiceCount: openInvoices.length,
          openPaymentAmount: openPayments.reduce(
            (total, payment) => total + Number(payment.amount || 0),
            0,
          ),
          openPaymentCount: openPayments.length,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}
