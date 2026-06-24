import { Room } from '../models/Room.js';
import { createHttpError } from '../utils/httpError.js';

function normalizeRoomPayload(body) {
  return {
    name: body.name,
    floor: Number(body.floor),
    price: Number(body.price),
    status: body.status,
  };
}

export async function listRooms(req, res, next) {
  try {
    const { status, floor, page = 1, limit = 20 } = req.query;
    const filters = { deletedAt: null };
    const safePage = Math.max(Number(page) || 1, 1);
    const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);

    if (status) filters.status = status;
    if (floor) filters.floor = Number(floor);

    const [rooms, total] = await Promise.all([
      Room.find(filters)
        .sort({ name: 1 })
        .skip((safePage - 1) * safeLimit)
        .limit(safeLimit),
      Room.countDocuments(filters),
    ]);

    res.json({
      data: rooms,
      meta: {
        page: safePage,
        limit: safeLimit,
        total,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getRoom(req, res, next) {
  try {
    const room = await Room.findOne({ _id: req.params.id, deletedAt: null });

    if (!room) {
      throw createHttpError(404, 'Room not found');
    }

    res.json({ data: room });
  } catch (error) {
    next(error);
  }
}

export async function createRoom(req, res, next) {
  try {
    const room = await Room.create(normalizeRoomPayload(req.body));

    res.status(201).json({
      data: room,
      message: 'Room created successfully',
    });
  } catch (error) {
    next(error);
  }
}

export async function updateRoom(req, res, next) {
  try {
    const room = await Room.findOneAndUpdate(
      { _id: req.params.id, deletedAt: null },
      normalizeRoomPayload(req.body),
      {
        new: true,
        runValidators: true,
      },
    );

    if (!room) {
      throw createHttpError(404, 'Room not found');
    }

    res.json({
      data: room,
      message: 'Room updated successfully',
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteRoom(req, res, next) {
  try {
    const room = await Room.findOneAndUpdate(
      { _id: req.params.id, deletedAt: null },
      { deletedAt: new Date() },
      { new: true },
    );

    if (!room) {
      throw createHttpError(404, 'Room not found');
    }

    res.json({
      data: room,
      message: 'Room deleted successfully',
    });
  } catch (error) {
    next(error);
  }
}
