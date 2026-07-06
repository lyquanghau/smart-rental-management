import { Contract } from '../models/Contract.js';
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

export async function getDashboardSummary(_req, res, next) {
  try {
    const monthRange = currentMonthRange();

    const [
      roomStatusRows,
      totalRooms,
      activeTenants,
      contractStatusRows,
      paymentRows,
    ] = await Promise.all([
      Room.aggregate([
        { $match: { deletedAt: null } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Room.countDocuments({ deletedAt: null }),
      Tenant.countDocuments({ deletedAt: null }),
      Contract.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Payment.aggregate([
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
    ]);

    const roomCounts = mapStatusCounts(roomStatusRows);
    const contractCounts = mapStatusCounts(contractStatusRows);
    const paymentSummary = paymentRows[0] || {};

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
      },
    });
  } catch (error) {
    next(error);
  }
}
