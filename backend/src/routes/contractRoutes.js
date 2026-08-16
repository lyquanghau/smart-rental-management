import { Router } from 'express';
import {
  createContract,
  deleteContract,
  downloadContractPdf,
  endContract,
  getContract,
  listContracts,
  restoreContract,
  updateContract,
} from '../controllers/contractController.js';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';
import {
  minNumber,
  oneOf,
  required,
  validateBody,
} from '../middleware/validateRequest.js';

const router = Router();

const contractRules = {
  room: [required('Phong')],
  startDate: [required('Ngay bat dau')],
  monthlyPrice: [
    required('Gia thue hang thang'),
    minNumber('Gia thue hang thang', 0),
  ],
  deposit: [minNumber('Tien coc', 0)],
  vehicleCount: [minNumber('So xe', 0)],
  status: [oneOf('Trang thai', ['active', 'ended', 'cancelled'])],
};

router.get('/', requireAuth, listContracts);
router.get('/:id/pdf', requireAuth, downloadContractPdf);
router.patch('/:id/end', requireAuth, requireRole('landlord'), endContract);
router.patch(
  '/:id/restore',
  requireAuth,
  requireRole('landlord'),
  restoreContract,
);
router.get('/:id', requireAuth, getContract);
router.post(
  '/',
  requireAuth,
  requireRole('landlord'),
  validateBody(contractRules),
  createContract,
);
router.put(
  '/:id',
  requireAuth,
  requireRole('landlord'),
  validateBody(contractRules),
  updateContract,
);
router.delete('/:id', requireAuth, requireRole('landlord'), deleteContract);

export default router;
