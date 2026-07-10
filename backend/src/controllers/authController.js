import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomBytes } from 'node:crypto';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { createHttpError } from '../utils/httpError.js';

const TEMPORARY_PASSWORD_TTL_DAYS = 3;

function signToken(user) {
  return jwt.sign(
    {
      role: user.role,
    },
    env.jwtSecret,
    {
      subject: user.id,
      expiresIn: '7d',
    },
  );
}

function serializeUser(user) {
  return {
    _id: user._id,
    fullName: user.fullName,
    email: user.email,
    username: user.username,
    role: user.role,
    mustChangePassword: user.mustChangePassword,
    temporaryPasswordExpiresAt: user.temporaryPasswordExpiresAt,
  };
}

export function generateTemporaryPassword() {
  return `Sr@${randomBytes(6).toString('base64url')}`;
}

export function getTemporaryPasswordExpiresAt() {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + TEMPORARY_PASSWORD_TTL_DAYS);
  return expiresAt;
}

async function lockExpiredTemporaryPasswordUser(user) {
  if (
    user.mustChangePassword &&
    user.temporaryPasswordExpiresAt &&
    user.temporaryPasswordExpiresAt <= new Date()
  ) {
    user.isActive = false;
    await user.save();
    throw createHttpError(
      403,
      'Tài khoản đã bị khóa vì quá hạn đổi mật khẩu tạm. Vui lòng liên hệ chủ trọ để mở khóa.',
    );
  }
}

export async function register(req, res, next) {
  try {
    const { fullName, email, password, role = 'landlord' } = req.body;
    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      throw createHttpError(409, 'Email đã tồn tại');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      fullName,
      email: normalizedEmail,
      username: req.body.username?.trim().toLowerCase() || undefined,
      passwordHash,
      role,
    });

    res.status(201).json({
      data: {
        user: serializeUser(user),
        token: signToken(user),
      },
      message: 'Đăng ký thành công',
    });
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const loginId = email.trim().toLowerCase();
    const user = await User.findOne({
      $or: [{ email: loginId }, { username: loginId }],
    });

    if (!user) {
      throw createHttpError(401, 'Email hoặc mật khẩu không đúng');
    }

    if (!user.isActive) {
      throw createHttpError(
        403,
        'Tài khoản đang bị khóa. Vui lòng liên hệ chủ trọ để mở khóa.',
      );
    }

    await lockExpiredTemporaryPasswordUser(user);

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw createHttpError(401, 'Email hoặc mật khẩu không đúng');
    }

    res.json({
      data: {
        user: serializeUser(user),
        token: signToken(user),
      },
      message: 'Đăng nhập thành công',
    });
  } catch (error) {
    next(error);
  }
}

export function getProfile(req, res) {
  res.json({
    data: {
      user: serializeUser(req.user),
    },
  });
}

export async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    if (!user || !user.isActive) {
      throw createHttpError(401, 'Tài khoản đăng nhập không hợp lệ');
    }

    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw createHttpError(400, 'Mật khẩu hiện tại không đúng', {
        currentPassword: 'Mật khẩu hiện tại không đúng',
      });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    user.mustChangePassword = false;
    user.temporaryPasswordExpiresAt = null;
    user.isActive = true;
    await user.save();

    res.json({
      data: {
        user: serializeUser(user),
        token: signToken(user),
      },
      message: 'Đổi mật khẩu thành công',
    });
  } catch (error) {
    next(error);
  }
}

export async function unlockUser(req, res, next) {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      throw createHttpError(404, 'Không tìm thấy tài khoản');
    }

    const temporaryPassword = generateTemporaryPassword();

    user.passwordHash = await bcrypt.hash(temporaryPassword, 10);
    user.isActive = true;
    user.mustChangePassword = true;
    user.temporaryPasswordExpiresAt = getTemporaryPasswordExpiresAt();
    await user.save();

    res.json({
      data: {
        user: serializeUser(user),
        temporaryPassword,
      },
      message: 'Mở khóa tài khoản và cấp lại mật khẩu tạm thành công',
    });
  } catch (error) {
    next(error);
  }
}
