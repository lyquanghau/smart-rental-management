import { Router } from 'express';
import {
  changePassword,
  getProfile,
  login,
  register,
  unlockUser,
} from '../controllers/authController.js';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';
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

const passwordRules = {
  currentPassword: [required('Mật khẩu hiện tại')],
  newPassword: [required('Mật khẩu mới')],
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
router.patch(
  '/change-password',
  requireAuth,
  validateBody(passwordRules),
  changePassword,
);
router.patch(
  '/users/:id/unlock',
  requireAuth,
  requireRole('landlord'),
  unlockUser,
);

export default router;
