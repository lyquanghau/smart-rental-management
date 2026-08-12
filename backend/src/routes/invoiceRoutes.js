import { Router } from 'express';
import {
  cancelInvoice,
  downloadInvoicePdf,
  generateMonthlyInvoices,
  getInvoice,
  listInvoices,
  markInvoicePaid,
} from '../controllers/invoiceController.js';
import {
  createMomoPaymentLink,
  createSepayPaymentCode,
  simulateMomoSuccess,
  simulateSepaySuccess,
} from '../controllers/paymentGatewayController.js';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';
import {
  minNumber,
  oneOf,
  required,
  validateBody,
} from '../middleware/validateRequest.js';

const router = Router();

const generateRules = {
  month: [required('Thang'), minNumber('Thang', 1)],
  year: [required('Nam'), minNumber('Nam', 2000)],
  dueDate: [required('Han thanh toan')],
};

const markPaidRules = {
  method: [
    oneOf('Phuong thuc', ['cash', 'bank_transfer', 'momo', 'vnpay', 'sepay']),
  ],
};

router.get('/', requireAuth, listInvoices);
router.get('/:id/pdf', requireAuth, downloadInvoicePdf);
router.get('/:id', requireAuth, getInvoice);
router.post('/:id/momo-payment-link', requireAuth, createMomoPaymentLink);
router.post('/:id/momo-mock-success', requireAuth, simulateMomoSuccess);
router.post('/:id/sepay-payment-code', requireAuth, createSepayPaymentCode);
router.post('/:id/sepay-mock-success', requireAuth, simulateSepaySuccess);
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
