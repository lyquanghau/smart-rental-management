import { Router } from 'express';
import {
  cancelInvoice,
  generateMonthlyInvoices,
  getInvoice,
  listInvoices,
  markInvoicePaid,
} from '../controllers/invoiceController.js';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';
import {
  minNumber,
  oneOf,
  required,
  validateBody,
} from '../middleware/validateRequest.js';

const router = Router();

const generateRules = {
  month: [required('Tháng'), minNumber('Tháng', 1)],
  year: [required('Năm'), minNumber('Năm', 2000)],
  dueDate: [required('Hạn thanh toán')],
};

const markPaidRules = {
  method: [oneOf('Phương thức', ['cash', 'bank_transfer', 'momo', 'vnpay'])],
};

router.get('/', requireAuth, listInvoices);
router.get('/:id', requireAuth, getInvoice);
router.post(
  '/generate-monthly',
  requireAuth,
  requireRole('landlord'),
  validateBody(generateRules),
  generateMonthlyInvoices,
);
router.patch(
  '/:id/mark-paid',
  requireAuth,
  requireRole('landlord'),
  validateBody(markPaidRules),
  markInvoicePaid,
);
router.patch(
  '/:id/cancel',
  requireAuth,
  requireRole('landlord'),
  cancelInvoice,
);

export default router;
