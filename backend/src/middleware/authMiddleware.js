import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { createHttpError } from '../utils/httpError.js';

export async function requireAuth(req, _res, next) {
  try {
    const authHeader = req.get('Authorization') || '';
    const [scheme, token] = authHeader.split(' ');

    if (scheme !== 'Bearer' || !token) {
      throw createHttpError(401, 'Missing bearer token');
    }

    const payload = jwt.verify(token, env.jwtSecret);
    const user = await User.findById(payload.sub).select('-passwordHash');

    if (!user || !user.isActive) {
      throw createHttpError(401, 'Invalid token user');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.statusCode) return next(error);
    return next(createHttpError(401, 'Invalid or expired token'));
  }
}

export function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(createHttpError(403, 'Permission denied'));
    }

    return next();
  };
}
