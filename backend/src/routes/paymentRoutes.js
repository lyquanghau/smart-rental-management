import { Router } from 'express';
import {
  cancelPayment,
  createPayment,
  getPayment,
  listPayments,
  markPaymentPaid,
  updatePayment,
} from '../controllers/paymentController.js';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';
import {
  minNumber,
  oneOf,
  required,
  validateBody,
} from '../middleware/validateRequest.js';

const router = Router();

const paymentRules = {
  contract: [required('Contract')],
  amount: [required('Amount'), minNumber('Amount', 0)],
  dueDate: [required('Due date')],
  method: [oneOf('Method', ['cash', 'bank_transfer', 'momo', 'vnpay'])],
  status: [oneOf('Status', ['pending', 'paid', 'overdue', 'cancelled'])],
};

const markPaidRules = {
  method: [oneOf('Method', ['cash', 'bank_transfer', 'momo', 'vnpay'])],
};

router.get('/', requireAuth, listPayments);
router.get('/:id', requireAuth, getPayment);
router.post(
  '/',
  requireAuth,
  requireRole('landlord'),
  validateBody(paymentRules),
  createPayment,
);
router.put(
  '/:id',
  requireAuth,
  requireRole('landlord'),
  validateBody(paymentRules),
  updatePayment,
);
router.patch(
  '/:id/mark-paid',
  requireAuth,
  requireRole('landlord'),
  validateBody(markPaidRules),
  markPaymentPaid,
);
router.patch(
  '/:id/cancel',
  requireAuth,
  requireRole('landlord'),
  cancelPayment,
);

export default router;
