import { Router } from 'express';
import {
  handleMomoIpn,
  handleSepayWebhook,
} from '../controllers/paymentGatewayController.js';

const router = Router();

router.post('/momo', handleMomoIpn);
router.post('/sepay', handleSepayWebhook);

export default router;
