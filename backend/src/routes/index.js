import { Router } from 'express';
import healthRoutes from './healthRoutes.js';
import roomRoutes from './roomRoutes.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/rooms', roomRoutes);

export default router;
