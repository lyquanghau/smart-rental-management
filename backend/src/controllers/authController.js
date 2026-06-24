import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { createHttpError } from '../utils/httpError.js';

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
    role: user.role,
  };
}

export async function register(req, res, next) {
  try {
    const { fullName, email, password, role = 'landlord' } = req.body;
    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      throw createHttpError(409, 'Email already exists');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      fullName,
      email: normalizedEmail,
      passwordHash,
      role,
    });

    res.status(201).json({
      data: {
        user: serializeUser(user),
        token: signToken(user),
      },
      message: 'Registered successfully',
    });
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email.trim().toLowerCase() });

    if (!user) {
      throw createHttpError(401, 'Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw createHttpError(401, 'Invalid email or password');
    }

    res.json({
      data: {
        user: serializeUser(user),
        token: signToken(user),
      },
      message: 'Logged in successfully',
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
