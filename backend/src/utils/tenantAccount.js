import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { createHttpError } from './httpError.js';
import { sendTenantCredentialsEmail } from './mailService.js';

export function normalizeLoginPart(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

export function buildTenantRoomUsername(tenant, room) {
  const namePart = normalizeLoginPart(tenant.fullName);
  const roomPart = normalizeLoginPart(room?.name);

  if (!namePart || !roomPart) {
    throw createHttpError(400, 'Khong tao duoc ten dang nhap khach thue', {
      fullName: 'Ho ten va phong phai hop le de tao ten dang nhap',
    });
  }

  return `${namePart}${roomPart}`;
}

export async function ensureTenantAccountForRoom({ room, tenant }) {
  if (tenant.user) return null;

  if (!tenant.email) {
    throw createHttpError(
      400,
      'Can email khach thue de gui thong tin dang nhap',
      {
        email: 'Email la bat buoc khi khach thue duoc gan phong',
      },
    );
  }

  const username = buildTenantRoomUsername(tenant, room);
  const email = tenant.email.trim().toLowerCase();
  const password = tenant.phone.trim();
  const existingUser = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (existingUser) {
    throw createHttpError(409, 'Email hoac ten dang nhap da ton tai', {
      email: 'Email hoac ten dang nhap da duoc dung cho tai khoan khac',
      username,
    });
  }

  const user = await User.create({
    email,
    fullName: tenant.fullName,
    isActive: true,
    mustChangePassword: false,
    passwordHash: await bcrypt.hash(password, 10),
    role: 'tenant',
    temporaryPasswordExpiresAt: null,
    username,
  });
  const emailDelivery = await sendTenantCredentialsEmail({
    password,
    tenantEmail: email,
    tenantName: tenant.fullName,
    username,
  });

  tenant.user = user._id;
  await tenant.save();

  return {
    emailDelivery,
    password,
    user: {
      _id: user._id,
      email: user.email,
      fullName: user.fullName,
      mustChangePassword: user.mustChangePassword,
      role: user.role,
      temporaryPasswordExpiresAt: user.temporaryPasswordExpiresAt,
      username: user.username,
    },
  };
}
