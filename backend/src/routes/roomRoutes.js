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
  name: [required('Tên phòng')],
  floor: [required('Tầng'), minNumber('Tầng', 1)],
  price: [required('Giá phòng'), minNumber('Giá phòng', 0)],
  maxOccupants: [minNumber('Số người tối đa', 1)],
  status: [oneOf('Trạng thái', ['available', 'occupied', 'maintenance'])],
};

router.get('/', requireAuth, requireRole('landlord'), listRooms);
router.get('/:id', requireAuth, requireRole('landlord'), getRoom);
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
