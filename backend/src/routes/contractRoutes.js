import { Router } from 'express';
import {
  createContract,
  deleteContract,
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
  room: [required('Room')],
  tenant: [required('Tenant')],
  startDate: [required('Start date')],
  monthlyPrice: [required('Monthly price'), minNumber('Monthly price', 0)],
  deposit: [minNumber('Deposit', 0)],
  status: [oneOf('Status', ['active', 'ended', 'cancelled'])],
};

router.get('/', requireAuth, listContracts);
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
