import { Router } from 'express';
import {
  getServiceSetting,
  updateServiceSetting,
} from '../controllers/serviceSettingController.js';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';
import { minNumber, validateBody } from '../middleware/validateRequest.js';

const router = Router();

const settingRules = {
  electricityUnitPrice: [minNumber('Đơn giá điện', 0)],
  waterUnitPrice: [minNumber('Đơn giá nước', 0)],
  internetFee: [minNumber('Phí internet', 0)],
  trashFee: [minNumber('Phí rác', 0)],
  parkingFeePerVehicle: [minNumber('Phí gửi xe', 0)],
};

router.get('/', requireAuth, getServiceSetting);
router.put(
  '/',
  requireAuth,
  requireRole('landlord'),
  validateBody(settingRules),
  updateServiceSetting,
);

export default router;
