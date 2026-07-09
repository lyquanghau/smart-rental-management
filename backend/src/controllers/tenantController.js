import { Room } from '../models/Room.js';
import { Tenant } from '../models/Tenant.js';
import { createHttpError } from '../utils/httpError.js';

async function normalizeTenantPayload(body) {
  const room = body.room || null;
  const payload = {
    fullName: body.fullName?.trim(),
    phone: body.phone?.trim(),
    email: body.email?.trim() || null,
    identityNumber: body.identityNumber?.trim() || null,
    room,
  };

  if (room) {
    const existingRoom = await Room.findOne({ _id: room, deletedAt: null });

    if (!existingRoom) {
      throw createHttpError(400, 'Phòng không tồn tại');
    }
  }

  return payload;
}

async function syncRoomStatus(roomId) {
  if (!roomId) return;

  const room = await Room.findOne({ _id: roomId, deletedAt: null });

  if (!room || room.status === 'maintenance') return;

  const activeTenantCount = await Tenant.countDocuments({
    room: roomId,
    deletedAt: null,
  });

  room.status = activeTenantCount > 0 ? 'occupied' : 'available';
  await room.save();
}

async function syncRelatedRoomStatuses(...roomIds) {
  const uniqueRoomIds = [
    ...new Set(roomIds.filter(Boolean).map((roomId) => String(roomId))),
  ];

  await Promise.all(uniqueRoomIds.map((roomId) => syncRoomStatus(roomId)));
}

export async function listTenants(req, res, next) {
  try {
    const { room, page = 1, limit = 20 } = req.query;
    const filters = { deletedAt: null };
    const safePage = Math.max(Number(page) || 1, 1);
    const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);

    if (room) filters.room = room;

    const [tenants, total] = await Promise.all([
      Tenant.find(filters)
        .populate('room', 'name floor price maxOccupants status')
        .sort({ fullName: 1 })
        .skip((safePage - 1) * safeLimit)
        .limit(safeLimit),
      Tenant.countDocuments(filters),
    ]);

    res.json({
      data: tenants,
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

export async function getTenant(req, res, next) {
  try {
    const tenant = await Tenant.findOne({
      _id: req.params.id,
      deletedAt: null,
    }).populate('room', 'name floor price maxOccupants status');

    if (!tenant) {
      throw createHttpError(404, 'Không tìm thấy khách thuê');
    }

    res.json({ data: tenant });
  } catch (error) {
    next(error);
  }
}

export async function createTenant(req, res, next) {
  try {
    const tenant = await Tenant.create(await normalizeTenantPayload(req.body));
    await syncRelatedRoomStatuses(tenant.room);
    const populatedTenant = await tenant.populate(
      'room',
      'name floor price maxOccupants status',
    );

    res.status(201).json({
      data: populatedTenant,
      message: 'Tạo khách thuê thành công',
    });
  } catch (error) {
    next(error);
  }
}

export async function updateTenant(req, res, next) {
  try {
    const currentTenant = await Tenant.findOne({
      _id: req.params.id,
      deletedAt: null,
    });

    if (!currentTenant) {
      throw createHttpError(404, 'Không tìm thấy khách thuê');
    }

    const tenant = await Tenant.findOneAndUpdate(
      { _id: req.params.id, deletedAt: null },
      await normalizeTenantPayload(req.body),
      {
        new: true,
        runValidators: true,
      },
    ).populate('room', 'name floor price maxOccupants status');

    await syncRelatedRoomStatuses(currentTenant.room, tenant.room);

    res.json({
      data: tenant,
      message: 'Cập nhật khách thuê thành công',
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteTenant(req, res, next) {
  try {
    const currentTenant = await Tenant.findOne({
      _id: req.params.id,
      deletedAt: null,
    });

    if (!currentTenant) {
      throw createHttpError(404, 'Không tìm thấy khách thuê');
    }

    const tenant = await Tenant.findOneAndUpdate(
      { _id: req.params.id, deletedAt: null },
      { deletedAt: new Date() },
      { new: true },
    ).populate('room', 'name floor price maxOccupants status');

    await syncRelatedRoomStatuses(currentTenant.room);

    res.json({
      data: tenant,
      message: 'Xóa khách thuê thành công',
    });
  } catch (error) {
    next(error);
  }
}
