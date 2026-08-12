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
const paymentMethods = ['cash', 'bank_transfer', 'momo', 'vnpay', 'sepay'];

const paymentRules = {
  contract: [required('Hop dong')],
  amount: [required('So tien'), minNumber('So tien', 0)],
  dueDate: [required('Han thanh toan')],
  method: [oneOf('Phuong thuc', paymentMethods)],
  status: [oneOf('Trang thai', ['pending', 'paid', 'overdue', 'cancelled'])],
};

const markPaidRules = {
  method: [oneOf('Phuong thuc', paymentMethods)],
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
