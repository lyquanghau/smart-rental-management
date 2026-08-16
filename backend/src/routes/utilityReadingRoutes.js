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
  contract: [required('Hop dong')],
  month: [required('Thang'), minNumber('Thang', 1)],
  year: [required('Nam'), minNumber('Nam', 2000)],
  electricityCurrent: [
    required('Chi so dien moi'),
    minNumber('Chi so dien moi', 0),
  ],
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
