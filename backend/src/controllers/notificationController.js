import { Notification } from '../models/Notification.js';
import { Invoice } from '../models/Invoice.js';
import { createHttpError } from '../utils/httpError.js';
import { getTenantForUser, ownerFilter } from '../utils/ownership.js';

async function buildNotificationFilter(req, extraFilters = {}) {
  if (req.user.role === 'landlord') {
    return ownerFilter(req, extraFilters);
  }

  const tenant = await getTenantForUser(req.user._id);
  const invoices = await Invoice.find({
    owner: tenant.owner,
    tenant: tenant._id,
  }).select('_id');

  return {
    ...extraFilters,
    entityType: 'invoice',
    entityId: { $in: invoices.map((invoice) => invoice._id) },
    owner: tenant.owner,
  };
}

export async function listNotifications(req, res, next) {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 50);
    const filters = await buildNotificationFilter(req);

    if (req.query.unread === 'true') {
      filters.readAt = null;
    }

    const unreadFilters = await buildNotificationFilter(req, { readAt: null });
    const [notifications, unreadCount] = await Promise.all([
      Notification.find(filters).sort({ createdAt: -1 }).limit(limit),
      Notification.countDocuments(unreadFilters),
    ]);

    res.json({
      data: notifications,
      meta: { unreadCount },
    });
  } catch (error) {
    next(error);
  }
}

export async function markNotificationRead(req, res, next) {
  try {
    const filters = await buildNotificationFilter(req, { _id: req.params.id });
    const notification = await Notification.findOneAndUpdate(
      filters,
      { readAt: new Date() },
      { new: true, runValidators: true },
    );

    if (!notification) {
      throw createHttpError(404, 'Khong tim thay thong bao');
    }

    res.json({ data: notification, message: 'Da danh dau thong bao da doc' });
  } catch (error) {
    next(error);
  }
}

export async function markAllNotificationsRead(req, res, next) {
  try {
    const filters = await buildNotificationFilter(req, { readAt: null });

    await Notification.updateMany(filters, {
      readAt: new Date(),
    });

    res.json({ message: 'Da danh dau tat ca thong bao da doc' });
  } catch (error) {
    next(error);
  }
}
