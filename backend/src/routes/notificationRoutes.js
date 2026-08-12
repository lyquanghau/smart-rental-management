import { Router } from 'express';
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../controllers/notificationController.js';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', requireAuth, requireRole('landlord'), listNotifications);
router.patch(
  '/read-all',
  requireAuth,
  requireRole('landlord'),
  markAllNotificationsRead,
);
router.patch(
  '/:id/read',
  requireAuth,
  requireRole('landlord'),
  markNotificationRead,
);

export default router;
