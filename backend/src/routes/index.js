import { Router } from 'express';
import authRoutes from './authRoutes.js';
import contractRoutes from './contractRoutes.js';
import dashboardRoutes from './dashboardRoutes.js';
import healthRoutes from './healthRoutes.js';
import invoiceRoutes from './invoiceRoutes.js';
import paymentRoutes from './paymentRoutes.js';
import roomRoutes from './roomRoutes.js';
import serviceSettingRoutes from './serviceSettingRoutes.js';
import tenantRoutes from './tenantRoutes.js';
import utilityReadingRoutes from './utilityReadingRoutes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/health', healthRoutes);
router.use('/rooms', roomRoutes);
router.use('/tenants', tenantRoutes);
router.use('/contracts', contractRoutes);
router.use('/invoices', invoiceRoutes);
router.use('/payments', paymentRoutes);
router.use('/service-settings', serviceSettingRoutes);
router.use('/utility-readings', utilityReadingRoutes);

export default router;
