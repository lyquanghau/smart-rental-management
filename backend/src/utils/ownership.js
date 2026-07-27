import { Tenant } from '../models/Tenant.js';
import { createHttpError } from './httpError.js';

export function ownerFilter(req, extraFilters = {}) {
  return {
    ...extraFilters,
    owner: req.user._id,
  };
}

export async function getTenantForUser(userId) {
  const tenant = await Tenant.findOne({ user: userId, deletedAt: null }).select(
    '_id owner room',
  );

  if (!tenant) {
    throw createHttpError(
      404,
      'Khong tim thay ho so khach thue lien ket voi tai khoan nay',
    );
  }

  return tenant;
}

export async function getTenantIdForUser(userId) {
  const tenant = await getTenantForUser(userId);
  return tenant._id;
}
