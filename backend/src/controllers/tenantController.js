import { Room } from '../models/Room.js';
import { Contract } from '../models/Contract.js';
import { Tenant } from '../models/Tenant.js';
import { createHttpError } from '../utils/httpError.js';
import { isMailConfigured } from '../utils/mailService.js';
import { ownerFilter } from '../utils/ownership.js';
import { ensureTenantAccountForRoom } from '../utils/tenantAccount.js';

function parseOptionalDate(value) {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return date;
}

async function normalizeTenantPayload(body, ownerId) {
  const room = body.room || null;
  const dateOfBirth = parseOptionalDate(body.dateOfBirth);
  const payload = {
    owner: ownerId,
    fullName: body.fullName?.trim(),
    phone: body.phone?.trim(),
    email: body.email?.trim() || null,
    identityNumber: body.identityNumber?.trim() || null,
    dateOfBirth,
    permanentAddress: body.permanentAddress?.trim() || null,
    room,
  };

  if (body.dateOfBirth && !dateOfBirth) {
    throw createHttpError(400, 'Ngay sinh khong hop le', {
      dateOfBirth: 'Ngay sinh phai la ngay hop le',
    });
  }

  if (room) {
    const existingRoom = await Room.findOne({
      _id: room,
      owner: ownerId,
      deletedAt: null,
    });

    if (!existingRoom) {
      throw createHttpError(400, 'Phòng không tồn tại');
    }

    if (!payload.email) {
      throw createHttpError(
        400,
        'Can email khach thue de tao tai khoan dang nhap',
        {
          email: 'Email la bat buoc khi gan khach vao phong',
        },
      );
    }

    if (!isMailConfigured()) {
      throw createHttpError(
        503,
        'Chua cau hinh SMTP de gui tai khoan khach thue',
        {
          email:
            'He thong chi tao tai khoan khi gui duoc thong tin dang nhap qua email',
        },
      );
    }
  }

  return payload;
}

async function syncRoomStatus(ownerId, roomId) {
  if (!roomId) return;

  const [room, activeContractCount, activeContractTenantIds] =
    await Promise.all([
      Room.findOne({
        _id: roomId,
        owner: ownerId,
        deletedAt: null,
      }),
      Contract.countDocuments({
        deletedAt: null,
        owner: ownerId,
        room: roomId,
        status: 'active',
      }),
      Contract.find({
        deletedAt: null,
        owner: ownerId,
        status: 'active',
      }).distinct('tenant'),
    ]);

  if (!room || room.status === 'maintenance') return;

  const directAssignedTenantCount = await Tenant.countDocuments({
    _id: { $nin: activeContractTenantIds },
    owner: ownerId,
    room: roomId,
    deletedAt: null,
  });

  room.status =
    activeContractCount > 0 || directAssignedTenantCount > 0
      ? 'occupied'
      : 'available';
  await room.save();
}

async function syncRelatedRoomStatuses(ownerId, ...roomIds) {
  const uniqueRoomIds = [
    ...new Set(roomIds.filter(Boolean).map((roomId) => String(roomId))),
  ];

  await Promise.all(
    uniqueRoomIds.map((roomId) => syncRoomStatus(ownerId, roomId)),
  );
}

const tenantPopulate = [
  { path: 'room', select: 'name floor price maxOccupants status' },
  {
    path: 'user',
    select:
      'fullName email username role isActive mustChangePassword temporaryPasswordExpiresAt',
  },
];

export async function listTenants(req, res, next) {
  try {
    const { includeDeleted, room, page = 1, limit = 20 } = req.query;
    const shouldIncludeDeleted =
      req.user.role === 'landlord' && includeDeleted === 'true';
    const filters =
      req.user.role === 'landlord'
        ? ownerFilter(req, shouldIncludeDeleted ? {} : { deletedAt: null })
        : { deletedAt: null };
    const safePage = Math.max(Number(page) || 1, 1);
    const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);

    if (room) filters.room = room;
    if (req.user.role === 'tenant') filters.user = req.user._id;

    const [tenants, total] = await Promise.all([
      Tenant.find(filters)
        .populate(tenantPopulate)
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
    const filters = {
      _id: req.params.id,
    };

    if (req.user.role !== 'landlord') filters.deletedAt = null;
    if (req.user.role === 'landlord') filters.owner = req.user._id;
    if (req.user.role === 'tenant') filters.user = req.user._id;

    const tenant = await Tenant.findOne(filters).populate(tenantPopulate);

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
    const tenant = await Tenant.create(
      await normalizeTenantPayload(req.body, req.user._id),
    );
    const room = tenant.room
      ? await Room.findOne({
          _id: tenant.room,
          owner: req.user._id,
          deletedAt: null,
        })
      : null;
    const loginAccount = room
      ? await ensureTenantAccountForRoom({ room, tenant })
      : null;

    await syncRelatedRoomStatuses(req.user._id, tenant.room);
    const populatedTenant = await tenant.populate(tenantPopulate);

    res.status(201).json({
      data: {
        ...populatedTenant.toObject(),
        loginAccount,
      },
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
      owner: req.user._id,
      deletedAt: null,
    });

    if (!currentTenant) {
      throw createHttpError(404, 'Không tìm thấy khách thuê');
    }

    const tenant = await Tenant.findOneAndUpdate(
      ownerFilter(req, { _id: req.params.id, deletedAt: null }),
      await normalizeTenantPayload(req.body, req.user._id),
      {
        new: true,
        runValidators: true,
      },
    ).populate(tenantPopulate);
    const room = tenant.room
      ? await Room.findOne({
          _id: tenant.room?._id || tenant.room,
          owner: req.user._id,
          deletedAt: null,
        })
      : null;
    const loginAccount =
      room && !tenant.user
        ? await ensureTenantAccountForRoom({ room, tenant })
        : null;
    const populatedTenant = await Tenant.findById(tenant._id).populate(
      tenantPopulate,
    );

    await syncRelatedRoomStatuses(
      req.user._id,
      currentTenant.room,
      tenant.room?._id || tenant.room,
    );

    res.json({
      data: {
        ...populatedTenant.toObject(),
        loginAccount,
      },
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
      owner: req.user._id,
      deletedAt: null,
    });

    if (!currentTenant) {
      throw createHttpError(404, 'Không tìm thấy khách thuê');
    }

    const activeContract = await Contract.findOne({
      owner: req.user._id,
      tenant: req.params.id,
      status: 'active',
      deletedAt: null,
    });

    if (activeContract) {
      throw createHttpError(
        400,
        'Khach thue dang co hop dong hieu luc. Hay ket thuc hoac xoa hop dong truoc khi xoa khach.',
        {
          contract:
            'Khach thue dang co hop dong hieu luc. Hay ket thuc hoac xoa hop dong truoc khi xoa khach.',
        },
      );
    }

    const tenant = await Tenant.findOneAndUpdate(
      ownerFilter(req, { _id: req.params.id, deletedAt: null }),
      { deletedAt: new Date() },
      { new: true },
    ).populate(tenantPopulate);

    await syncRelatedRoomStatuses(req.user._id, currentTenant.room);

    res.json({
      data: tenant,
      message: 'Xóa khách thuê thành công',
    });
  } catch (error) {
    next(error);
  }
}

export async function restoreTenant(req, res, next) {
  try {
    const tenant = await Tenant.findOneAndUpdate(
      ownerFilter(req, { _id: req.params.id, deletedAt: { $ne: null } }),
      { deletedAt: null },
      { new: true, runValidators: true },
    ).populate(tenantPopulate);

    if (!tenant) {
      throw createHttpError(404, 'Khong tim thay khach thue da xoa');
    }

    await syncRelatedRoomStatuses(
      req.user._id,
      tenant.room?._id || tenant.room,
    );

    res.json({
      data: tenant,
      message: 'Khoi phuc khach thue thanh cong',
    });
  } catch (error) {
    next(error);
  }
}
