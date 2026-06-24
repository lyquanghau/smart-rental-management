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
  password: [required('Password')],
};

router.post(
  '/register',
  validateBody({
    fullName: [required('Full name')],
    ...authRules,
    role: [oneOf('Role', ['landlord', 'tenant'])],
  }),
  register,
);
router.post('/login', validateBody(authRules), login);
router.get('/me', requireAuth, getProfile);

export default router;
