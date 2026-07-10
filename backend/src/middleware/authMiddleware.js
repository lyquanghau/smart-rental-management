import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { createHttpError } from '../utils/httpError.js';

export async function requireAuth(req, _res, next) {
  try {
    const authHeader = req.get('Authorization') || '';
    const [scheme, token] = authHeader.split(' ');

    if (scheme !== 'Bearer' || !token) {
      throw createHttpError(401, 'Thiếu token đăng nhập');
    }

    const payload = jwt.verify(token, env.jwtSecret);
    const user = await User.findById(payload.sub).select('-passwordHash');

    if (!user || !user.isActive) {
      throw createHttpError(401, 'Tài khoản đăng nhập không hợp lệ');
    }

    if (
      user.mustChangePassword &&
      user.temporaryPasswordExpiresAt &&
      user.temporaryPasswordExpiresAt <= new Date()
    ) {
      await User.updateOne({ _id: user._id }, { $set: { isActive: false } });
      throw createHttpError(
        403,
        'Tài khoản đã bị khóa vì quá hạn đổi mật khẩu tạm. Vui lòng liên hệ chủ trọ để mở khóa.',
      );
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.statusCode) return next(error);
    return next(
      createHttpError(401, 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn'),
    );
  }
}

export function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(
        createHttpError(403, 'Bạn không có quyền thực hiện thao tác này'),
      );
    }

    return next();
  };
}
