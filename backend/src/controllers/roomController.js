import { Room } from '../models/Room.js';

export async function listRooms(_req, res, next) {
  try {
    const rooms = await Room.find().sort({ name: 1 });
    res.json({ data: rooms });
  } catch (error) {
    next(error);
  }
}
