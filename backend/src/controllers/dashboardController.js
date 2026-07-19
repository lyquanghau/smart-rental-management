import { Contract } from '../models/Contract.js';
import { Invoice } from '../models/Invoice.js';
import { Payment } from '../models/Payment.js';
import { Room } from '../models/Room.js';
import { Tenant } from '../models/Tenant.js';

function mapStatusCounts(rows) {
  return rows.reduce((result, row) => {
    result[row._id] = row.count;
    return result;
  }, {});
}

function currentMonthRange(now = new Date()) {
  const month = now.getMonth();
  const year = now.getFullYear();

  return {
    month: month + 1,
    year,
    start: new Date(year, month, 1),
    end: new Date(year, month + 1, 1),
    today: new Date(year, month, now.getDate()),
  };
}

function previousMonthRange(now = new Date()) {
  const month = now.getMonth();
  const year = now.getFullYear();

  return {
    start: new Date(year, month - 1, 1),
    end: new Date(year, month, 1),
  };
}

function expiringContractRange(now = new Date(), days = 30) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(today);
  end.setDate(end.getDate() + days);

  return { today, end };
}

function mapContractPreview(contract) {
  return {
    _id: contract._id,
    room: contract.room,
    tenant: contract.tenant,
    startDate: contract.startDate,
    endDate: contract.endDate,
    monthlyPrice: contract.monthlyPrice,
    status: contract.status,
  };
}

function mapInvoicePreview(invoice) {
  return {
    _id: invoice._id,
    contract: invoice.contract,
    amount: invoice.totalAmount,
    dueDate: invoice.dueDate,
    status: invoice.status,
    note: invoice.note,
  };
}

function mapPaymentPreview(payment) {
  return {
    _id: payment._id,
    contract: payment.contract,
    amount: payment.amount,
    dueDate: payment.dueDate,
    method: payment.method,
    status: payment.status,
    note: payment.note,
  };
}

export async function getDashboardSummary(_req, res, next) {
  try {
    const monthRange = currentMonthRange();
    const lastMonthRange = previousMonthRange();
    const contractRange = expiringContractRange();

    const [
      roomStatusRows,
      totalRooms,
      activeTenants,
      contractStatusRows,
      invoiceRows,
      previousInvoiceRows,
      standalonePaymentRows,
      previousStandalonePaymentRows,
      expiringContracts,
      unpaidInvoices,
      unpaidStandalonePayments,
    ] = await Promise.all([
      Room.aggregate([
        { $match: { deletedAt: null } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Room.countDocuments({ deletedAt: null }),
      Tenant.countDocuments({ deletedAt: null }),
      Contract.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Invoice.aggregate([
        {
          $match: {
            dueDate: { $gte: monthRange.start, $lt: monthRange.end },
            status: { $ne: 'cancelled' },
          },
        },
        {
          $group: {
            _id: null,
            paidAmount: {
              $sum: {
                $cond: [{ $eq: ['$status', 'paid'] }, '$totalAmount', 0],
              },
            },
            pendingAmount: {
              $sum: {
                $cond: [
                  { $in: ['$status', ['issued', 'overdue']] },
                  '$totalAmount',
                  0,
                ],
              },
            },
            paidCount: {
              $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] },
            },
            pendingCount: {
              $sum: {
                $cond: [{ $in: ['$status', ['issued', 'overdue']] }, 1, 0],
              },
            },
            overdueCount: {
              $sum: {
                $cond: [
                  {
                    $or: [
                      { $eq: ['$status', 'overdue'] },
                      {
                        $and: [
                          { $eq: ['$status', 'issued'] },
                          { $lt: ['$dueDate', monthRange.today] },
                        ],
                      },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
      ]),
      Invoice.aggregate([
        {
          $match: {
            dueDate: { $gte: lastMonthRange.start, $lt: lastMonthRange.end },
            status: 'paid',
          },
        },
        {
          $group: {
            _id: null,
            paidAmount: { $sum: '$totalAmount' },
            paidCount: { $sum: 1 },
          },
        },
      ]),
      Payment.aggregate([
        {
          $match: {
            dueDate: { $gte: monthRange.start, $lt: monthRange.end },
            invoice: { $exists: false },
            status: { $ne: 'cancelled' },
          },
        },
        {
          $group: {
            _id: null,
            paidAmount: {
              $sum: {
                $cond: [{ $eq: ['$status', 'paid'] }, '$amount', 0],
              },
            },
            pendingAmount: {
              $sum: {
                $cond: [
                  { $in: ['$status', ['pending', 'overdue']] },
                  '$amount',
                  0,
                ],
              },
            },
            paidCount: {
              $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] },
            },
            pendingCount: {
              $sum: {
                $cond: [{ $in: ['$status', ['pending', 'overdue']] }, 1, 0],
              },
            },
            overdueCount: {
              $sum: {
                $cond: [
                  {
                    $or: [
                      { $eq: ['$status', 'overdue'] },
                      {
                        $and: [
                          { $eq: ['$status', 'pending'] },
                          { $lt: ['$dueDate', monthRange.today] },
                        ],
                      },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
      ]),
      Payment.aggregate([
        {
          $match: {
            dueDate: { $gte: lastMonthRange.start, $lt: lastMonthRange.end },
            invoice: { $exists: false },
            status: 'paid',
          },
        },
        {
          $group: {
            _id: null,
            paidAmount: { $sum: '$amount' },
            paidCount: { $sum: 1 },
          },
        },
      ]),
      Contract.find({
        status: 'active',
        endDate: { $gte: contractRange.today, $lte: contractRange.end },
      })
        .populate([
          { path: 'room', select: 'name floor price maxOccupants status' },
          { path: 'tenant', select: 'fullName phone email identityNumber' },
        ])
        .sort({ endDate: 1 })
        .limit(5),
      Invoice.find({
        status: { $in: ['issued', 'overdue'] },
      })
        .populate({
          path: 'contract',
          select: 'room tenant startDate endDate monthlyPrice status',
          populate: [
            { path: 'room', select: 'name floor price maxOccupants status' },
            { path: 'tenant', select: 'fullName phone email identityNumber' },
          ],
        })
        .sort({ dueDate: 1 })
        .limit(5),
      Payment.find({
        invoice: { $exists: false },
        status: { $in: ['pending', 'overdue'] },
      })
        .populate({
          path: 'contract',
          select: 'room tenant startDate endDate monthlyPrice status',
          populate: [
            { path: 'room', select: 'name floor price maxOccupants status' },
            { path: 'tenant', select: 'fullName phone email identityNumber' },
          ],
        })
        .sort({ dueDate: 1 })
        .limit(5),
    ]);

    const roomCounts = mapStatusCounts(roomStatusRows);
    const contractCounts = mapStatusCounts(contractStatusRows);
    const invoiceSummary = invoiceRows[0] || {};
    const standalonePaymentSummary = standalonePaymentRows[0] || {};
    const previousInvoiceSummary = previousInvoiceRows[0] || {};
    const previousStandalonePaymentSummary =
      previousStandalonePaymentRows[0] || {};
    const paymentSummary = {
      paidAmount:
        (invoiceSummary.paidAmount || 0) +
        (standalonePaymentSummary.paidAmount || 0),
      pendingAmount:
        (invoiceSummary.pendingAmount || 0) +
        (standalonePaymentSummary.pendingAmount || 0),
      paidCount:
        (invoiceSummary.paidCount || 0) +
        (standalonePaymentSummary.paidCount || 0),
      pendingCount:
        (invoiceSummary.pendingCount || 0) +
        (standalonePaymentSummary.pendingCount || 0),
      overdueCount:
        (invoiceSummary.overdueCount || 0) +
        (standalonePaymentSummary.overdueCount || 0),
    };
    const previousPaymentSummary = {
      paidAmount:
        (previousInvoiceSummary.paidAmount || 0) +
        (previousStandalonePaymentSummary.paidAmount || 0),
      paidCount:
        (previousInvoiceSummary.paidCount || 0) +
        (previousStandalonePaymentSummary.paidCount || 0),
    };
    const unpaidPaymentPreviews = [
      ...unpaidInvoices.map(mapInvoicePreview),
      ...unpaidStandalonePayments.map(mapPaymentPreview),
    ].slice(0, 5);

    res.json({
      data: {
        rooms: {
          total: totalRooms,
          available: roomCounts.available || 0,
          occupied: roomCounts.occupied || 0,
          maintenance: roomCounts.maintenance || 0,
        },
        tenants: {
          active: activeTenants,
        },
        contracts: {
          active: contractCounts.active || 0,
          ended: contractCounts.ended || 0,
          cancelled: contractCounts.cancelled || 0,
        },
        payments: {
          month: monthRange.month,
          year: monthRange.year,
          pendingAmount: paymentSummary.pendingAmount || 0,
          paidAmount: paymentSummary.paidAmount || 0,
          pendingCount: paymentSummary.pendingCount || 0,
          paidCount: paymentSummary.paidCount || 0,
          overdueCount: paymentSummary.overdueCount || 0,
        },
        revenue: {
          currentMonth: paymentSummary.paidAmount || 0,
          previousMonth: previousPaymentSummary.paidAmount || 0,
          previousMonthPaidCount: previousPaymentSummary.paidCount || 0,
        },
        alerts: {
          expiringContracts: expiringContracts.map(mapContractPreview),
          unpaidPayments: unpaidPaymentPreviews,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}
