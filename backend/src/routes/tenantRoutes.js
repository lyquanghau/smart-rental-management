import { Router } from 'express';
import {
  createTenant,
  deleteTenant,
  getTenant,
  listTenants,
  restoreTenant,
  updateTenant,
} from '../controllers/tenantController.js';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';
import { required, validateBody } from '../middleware/validateRequest.js';

const router = Router();

const tenantRules = {
  fullName: [required('Họ tên')],
  phone: [required('Số điện thoại')],
};

router.get('/', requireAuth, listTenants);
router.patch(
  '/:id/restore',
  requireAuth,
  requireRole('landlord'),
  restoreTenant,
);
router.get('/:id', requireAuth, getTenant);
router.post(
  '/',
  requireAuth,
  requireRole('landlord'),
  validateBody(tenantRules),
  createTenant,
);
router.put(
  '/:id',
  requireAuth,
  requireRole('landlord'),
  validateBody(tenantRules),
  updateTenant,
);
router.delete('/:id', requireAuth, requireRole('landlord'), deleteTenant);

export default router;
