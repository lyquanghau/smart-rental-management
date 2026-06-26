import { Router } from 'express';
import authRoutes from './authRoutes.js';
import healthRoutes from './healthRoutes.js';
import roomRoutes from './roomRoutes.js';
import tenantRoutes from './tenantRoutes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/health', healthRoutes);
router.use('/rooms', roomRoutes);
router.use('/tenants', tenantRoutes);

export default router;
