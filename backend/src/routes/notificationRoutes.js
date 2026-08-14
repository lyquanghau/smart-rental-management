import { Router } from 'express';
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../controllers/notificationController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', requireAuth, listNotifications);
router.patch('/read-all', requireAuth, markAllNotificationsRead);
router.patch('/:id/read', requireAuth, markNotificationRead);

export default router;
