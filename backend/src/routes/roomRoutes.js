import { Router } from 'express';
import {
  createRoom,
  deleteRoom,
  getRoom,
  listRooms,
  updateRoom,
} from '../controllers/roomController.js';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';
import {
  minNumber,
  oneOf,
  required,
  validateBody,
} from '../middleware/validateRequest.js';

const router = Router();

const roomRules = {
  name: [required('Room name')],
  floor: [required('Floor'), minNumber('Floor', 1)],
  price: [required('Price'), minNumber('Price', 0)],
  status: [oneOf('Status', ['available', 'occupied', 'maintenance'])],
};

router.get('/', listRooms);
router.get('/:id', getRoom);
router.post(
  '/',
  requireAuth,
  requireRole('landlord'),
  validateBody(roomRules),
  createRoom,
);
router.put(
  '/:id',
  requireAuth,
  requireRole('landlord'),
  validateBody(roomRules),
  updateRoom,
);
router.delete('/:id', requireAuth, requireRole('landlord'), deleteRoom);

export default router;
