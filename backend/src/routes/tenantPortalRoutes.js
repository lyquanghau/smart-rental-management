import { Router } from 'express';
import { getTenantPortalSummary } from '../controllers/tenantPortalController.js';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

router.get(
  '/summary',
  requireAuth,
  requireRole('tenant'),
  getTenantPortalSummary,
);

export default router;
