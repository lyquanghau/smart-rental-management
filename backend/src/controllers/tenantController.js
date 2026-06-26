import { Room } from '../models/Room.js';
import { Tenant } from '../models/Tenant.js';
import { createHttpError } from '../utils/httpError.js';

async function normalizeTenantPayload(body) {
  const payload = {
    fullName: body.fullName,
    phone: body.phone,
    email: body.email || undefined,
    identityNumber: body.identityNumber || undefined,
    room: body.room || undefined,
  };

  if (payload.room) {
    const room = await Room.findOne({ _id: payload.room, deletedAt: null });

    if (!room) {
      throw createHttpError(400, 'Room does not exist');
    }
  }

  return payload;
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
        .populate('room', 'name floor price status')
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
    }).populate('room', 'name floor price status');

    if (!tenant) {
      throw createHttpError(404, 'Tenant not found');
    }

    res.json({ data: tenant });
  } catch (error) {
    next(error);
  }
}

export async function createTenant(req, res, next) {
  try {
    const tenant = await Tenant.create(await normalizeTenantPayload(req.body));
    const populatedTenant = await tenant.populate(
      'room',
      'name floor price status',
    );

    res.status(201).json({
      data: populatedTenant,
      message: 'Tenant created successfully',
    });
  } catch (error) {
    next(error);
  }
}

export async function updateTenant(req, res, next) {
  try {
    const tenant = await Tenant.findOneAndUpdate(
      { _id: req.params.id, deletedAt: null },
      await normalizeTenantPayload(req.body),
      {
        new: true,
        runValidators: true,
      },
    ).populate('room', 'name floor price status');

    if (!tenant) {
      throw createHttpError(404, 'Tenant not found');
    }

    res.json({
      data: tenant,
      message: 'Tenant updated successfully',
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteTenant(req, res, next) {
  try {
    const tenant = await Tenant.findOneAndUpdate(
      { _id: req.params.id, deletedAt: null },
      { deletedAt: new Date() },
      { new: true },
    ).populate('room', 'name floor price status');

    if (!tenant) {
      throw createHttpError(404, 'Tenant not found');
    }

    res.json({
      data: tenant,
      message: 'Tenant deleted successfully',
    });
  } catch (error) {
    next(error);
  }
}
