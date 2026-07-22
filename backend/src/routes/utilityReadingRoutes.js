import { Router } from 'express';
import {
  deleteUtilityReading,
  getUtilityReading,
  listUtilityReadings,
  updateUtilityReading,
  upsertUtilityReading,
} from '../controllers/utilityReadingController.js';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';
import {
  minNumber,
  required,
  validateBody,
} from '../middleware/validateRequest.js';

const router = Router();

const readingRules = {
  contract: [required('Hợp đồng')],
  month: [required('Tháng'), minNumber('Tháng', 1)],
  year: [required('Năm'), minNumber('Năm', 2000)],
  electricityPrevious: [minNumber('Chỉ số điện cũ', 0)],
  electricityCurrent: [minNumber('Chỉ số điện mới', 0)],
  waterPrevious: [minNumber('Chỉ số nước cũ', 0)],
  waterCurrent: [minNumber('Chỉ số nước mới', 0)],
  internetAmount: [minNumber('Phí internet', 0)],
  trashAmount: [minNumber('Phí rác', 0)],
  parkingVehicleCount: [minNumber('Số xe', 0)],
};

router.get('/', requireAuth, requireRole('landlord'), listUtilityReadings);
router.get('/:id', requireAuth, requireRole('landlord'), getUtilityReading);
router.post(
  '/',
  requireAuth,
  requireRole('landlord'),
  validateBody(readingRules),
  upsertUtilityReading,
);
router.put(
  '/:id',
  requireAuth,
  requireRole('landlord'),
  validateBody(readingRules),
  updateUtilityReading,
);
router.delete(
  '/:id',
  requireAuth,
  requireRole('landlord'),
  deleteUtilityReading,
);

export default router;
