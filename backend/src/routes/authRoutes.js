import { Router } from 'express';
import { getProfile, login, register } from '../controllers/authController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import {
  oneOf,
  required,
  validateBody,
} from '../middleware/validateRequest.js';

const router = Router();

const authRules = {
  email: [required('Email')],
  password: [required('Mật khẩu')],
};

router.post(
  '/register',
  validateBody({
    fullName: [required('Họ tên')],
    ...authRules,
    role: [oneOf('Vai trò', ['landlord', 'tenant'])],
  }),
  register,
);
router.post('/login', validateBody(authRules), login);
router.get('/me', requireAuth, getProfile);

export default router;
