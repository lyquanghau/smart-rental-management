import { Room } from '../models/Room.js';
import { Contract } from '../models/Contract.js';
import { Tenant } from '../models/Tenant.js';
import { createHttpError } from '../utils/httpError.js';
import { ownerFilter } from '../utils/ownership.js';

function normalizeRoomPayload(body) {
  return {
    name: body.name,
    floor: Number(body.floor),
    price: Number(body.price),
    maxOccupants: Number(body.maxOccupants || 2),
    status: body.status,
  };
}

async function syncRoomOccupancyStatuses(ownerId) {
  const activeTenantsByRoom = await Tenant.aggregate([
    {
      $match: {
        owner: ownerId,
        deletedAt: null,
        room: { $ne: null },
      },
    },
    {
      $group: {
        _id: '$room',
        total: { $sum: 1 },
      },
    },
  ]);

  const occupiedRoomIds = new Set(
    activeTenantsByRoom.map((item) => String(item._id)),
  );
  const rooms = await Room.find({
    owner: ownerId,
    deletedAt: null,
    status: { $ne: 'maintenance' },
  });

  await Promise.all(
    rooms.map((room) => {
      const nextStatus = occupiedRoomIds.has(String(room._id))
        ? 'occupied'
        : 'available';

      if (room.status === nextStatus) return Promise.resolve();

      room.status = nextStatus;
      return room.save();
    }),
  );
}

export async function listRooms(req, res, next) {
  try {
    await syncRoomOccupancyStatuses(req.user._id);

    const { includeDeleted, status, floor, page = 1, limit = 20 } = req.query;
    const shouldIncludeDeleted = includeDeleted === 'true';
    const filters = ownerFilter(
      req,
      shouldIncludeDeleted ? {} : { deletedAt: null },
    );
    const safePage = Math.max(Number(page) || 1, 1);
    const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);

    if (status === 'deleted') filters.deletedAt = { $ne: null };
    else if (status) filters.status = status;
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
    await syncRoomOccupancyStatuses(req.user._id);

    const [room, currentTenants, activeContract] = await Promise.all([
      Room.findOne(ownerFilter(req, { _id: req.params.id })),
      Tenant.find({
        owner: req.user._id,
        room: req.params.id,
        deletedAt: null,
      }).sort({ fullName: 1 }),
      Contract.findOne({
        deletedAt: null,
        owner: req.user._id,
        room: req.params.id,
        status: 'active',
      })
        .populate('tenant', 'fullName phone email identityNumber')
        .sort({ startDate: -1 }),
    ]);

    if (!room) {
      throw createHttpError(404, 'Không tìm thấy phòng');
    }

    res.json({
      data: {
        ...room.toObject(),
        activeContract,
        currentTenants,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function createRoom(req, res, next) {
  try {
    const room = await Room.create({
      ...normalizeRoomPayload(req.body),
      owner: req.user._id,
    });

    res.status(201).json({
      data: room,
      message: 'Tạo phòng thành công',
    });
  } catch (error) {
    next(error);
  }
}

export async function updateRoom(req, res, next) {
  try {
    const room = await Room.findOneAndUpdate(
      ownerFilter(req, { _id: req.params.id, deletedAt: null }),
      normalizeRoomPayload(req.body),
      {
        new: true,
        runValidators: true,
      },
    );

    if (!room) {
      throw createHttpError(404, 'Không tìm thấy phòng');
    }

    res.json({
      data: room,
      message: 'Cập nhật phòng thành công',
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteRoom(req, res, next) {
  try {
    const room = await Room.findOneAndUpdate(
      ownerFilter(req, { _id: req.params.id, deletedAt: null }),
      { deletedAt: new Date() },
      { new: true },
    );

    if (!room) {
      throw createHttpError(404, 'Không tìm thấy phòng');
    }

    res.json({
      data: room,
      message: 'Xóa phòng thành công',
    });
  } catch (error) {
    next(error);
  }
}

export async function restoreRoom(req, res, next) {
  try {
    const room = await Room.findOneAndUpdate(
      ownerFilter(req, { _id: req.params.id, deletedAt: { $ne: null } }),
      { deletedAt: null },
      { new: true, runValidators: true },
    );

    if (!room) {
      throw createHttpError(404, 'Khong tim thay phong da xoa');
    }

    await syncRoomOccupancyStatuses(req.user._id);

    const restoredRoom = await Room.findById(room._id);

    res.json({
      data: restoredRoom,
      message: 'Khoi phuc phong thanh cong',
    });
  } catch (error) {
    next(error);
  }
}
