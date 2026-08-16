import { Router } from 'express';
import {
  closeSupportRequest,
  createSupportRequest,
  getSupportRequest,
  listSupportRequests,
  updateSupportRequest,
} from '../controllers/supportRequestController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import {
  oneOf,
  required,
  validateBody,
} from '../middleware/validateRequest.js';

const router = Router();

const categoryValues = ['billing', 'contract', 'room', 'account', 'other'];
const priorityValues = ['normal', 'urgent'];
const statusValues = ['open', 'in_progress', 'resolved', 'closed'];

router.get('/', requireAuth, listSupportRequests);
router.get('/:id', requireAuth, getSupportRequest);
router.post(
  '/',
  requireAuth,
  validateBody({
    category: [oneOf('Loai yeu cau', categoryValues)],
    description: [required('Noi dung')],
    priority: [oneOf('Muc do uu tien', priorityValues)],
    subject: [required('Tieu de')],
  }),
  createSupportRequest,
);
router.patch(
  '/:id',
  requireAuth,
  validateBody({
    priority: [oneOf('Muc do uu tien', priorityValues)],
    status: [oneOf('Trang thai', statusValues)],
  }),
  updateSupportRequest,
);
router.patch('/:id/close', requireAuth, closeSupportRequest);

export default router;
