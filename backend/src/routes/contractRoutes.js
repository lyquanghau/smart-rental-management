import { Router } from 'express';
import {
  createContract,
  deleteContract,
  downloadContractPdf,
  getContract,
  listContracts,
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
  room: [required('Phòng')],
  tenant: [required('Khách thuê')],
  startDate: [required('Ngày bắt đầu')],
  monthlyPrice: [
    required('Giá thuê hằng tháng'),
    minNumber('Giá thuê hằng tháng', 0),
  ],
  deposit: [minNumber('Tiền cọc', 0)],
  status: [oneOf('Trạng thái', ['active', 'ended', 'cancelled'])],
};

router.get('/', requireAuth, listContracts);
router.get('/:id/pdf', requireAuth, downloadContractPdf);
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
