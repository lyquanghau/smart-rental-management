import { Notification } from '../models/Notification.js';
import { createHttpError } from '../utils/httpError.js';
import { ownerFilter } from '../utils/ownership.js';

export async function listNotifications(req, res, next) {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 50);
    const filters = ownerFilter(req);

    if (req.query.unread === 'true') {
      filters.readAt = null;
    }

    const [notifications, unreadCount] = await Promise.all([
      Notification.find(filters).sort({ createdAt: -1 }).limit(limit),
      Notification.countDocuments(ownerFilter(req, { readAt: null })),
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
    const notification = await Notification.findOneAndUpdate(
      ownerFilter(req, { _id: req.params.id }),
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
    await Notification.updateMany(ownerFilter(req, { readAt: null }), {
      readAt: new Date(),
    });

    res.json({ message: 'Da danh dau tat ca thong bao da doc' });
  } catch (error) {
    next(error);
  }
}
