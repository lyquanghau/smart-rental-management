import { Router } from 'express';
import authRoutes from './authRoutes.js';
import contractRoutes from './contractRoutes.js';
import dashboardRoutes from './dashboardRoutes.js';
import healthRoutes from './healthRoutes.js';
import invoiceRoutes from './invoiceRoutes.js';
import notificationRoutes from './notificationRoutes.js';
import paymentRoutes from './paymentRoutes.js';
import roomRoutes from './roomRoutes.js';
import serviceSettingRoutes from './serviceSettingRoutes.js';
import tenantPortalRoutes from './tenantPortalRoutes.js';
import tenantRoutes from './tenantRoutes.js';
import utilityReadingRoutes from './utilityReadingRoutes.js';
import webhookRoutes from './webhookRoutes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/health', healthRoutes);
router.use('/rooms', roomRoutes);
router.use('/tenants', tenantRoutes);
router.use('/contracts', contractRoutes);
router.use('/invoices', invoiceRoutes);
router.use('/notifications', notificationRoutes);
router.use('/payments', paymentRoutes);
router.use('/service-settings', serviceSettingRoutes);
router.use('/tenant-portal', tenantPortalRoutes);
router.use('/utility-readings', utilityReadingRoutes);
router.use('/webhooks', webhookRoutes);

export default router;
