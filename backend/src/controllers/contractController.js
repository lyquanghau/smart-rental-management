import { existsSync } from 'node:fs';
import bcrypt from 'bcryptjs';
import PDFDocument from 'pdfkit';
import {
  generateTemporaryPassword,
  getTemporaryPasswordExpiresAt,
} from './authController.js';
import { Contract } from '../models/Contract.js';
import { Room } from '../models/Room.js';
import { Tenant } from '../models/Tenant.js';
import { User } from '../models/User.js';
import { createHttpError } from '../utils/httpError.js';

const contractPopulate = [
  { path: 'room', select: 'name floor price maxOccupants status' },
  { path: 'tenant', select: 'fullName phone email identityNumber room user' },
];

const vietnameseFontPaths = [
  'C:/Windows/Fonts/arial.ttf',
  '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
  '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf',
];

function getVietnameseFontPath() {
  return vietnameseFontPaths.find((fontPath) => existsSync(fontPath));
}

function parseOptionalDate(value) {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return date;
}

function formatDate(value) {
  if (!value) return 'Chưa có';

  return new Intl.DateTimeFormat('vi-VN').format(new Date(value));
}

function formatMoney(value) {
  return `${Number(value || 0).toLocaleString('vi-VN')} VND`;
}

function formatStatus(status) {
  const statusLabels = {
    active: 'Đang hiệu lực',
    ended: 'Đã kết thúc',
    cancelled: 'Đã hủy',
  };

  return statusLabels[status] || 'Không xác định';
}

function buildTenantUsername(tenant) {
  return tenant.phone.trim().toLowerCase();
}

function buildTenantEmail(tenant) {
  if (tenant.email) return tenant.email.trim().toLowerCase();

  const safePhone = tenant.phone.replace(/\D/g, '') || String(tenant._id);
  return `${safePhone}@tenant.smartrental.local`;
}

async function ensureTenantAccount(tenantId) {
  const tenant = await Tenant.findOne({ _id: tenantId, deletedAt: null });

  if (!tenant) {
    throw createHttpError(400, 'Khách thuê không tồn tại', {
      tenant: 'Khách thuê không tồn tại',
    });
  }

  if (tenant.user) {
    return null;
  }

  const username = buildTenantUsername(tenant);
  const email = buildTenantEmail(tenant);
  const existingUser = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (existingUser) {
    tenant.user = existingUser._id;
    await tenant.save();
    return null;
  }

  const temporaryPassword = generateTemporaryPassword();
  const user = await User.create({
    fullName: tenant.fullName,
    email,
    username,
    passwordHash: await bcrypt.hash(temporaryPassword, 10),
    role: 'tenant',
    isActive: true,
    mustChangePassword: true,
    temporaryPasswordExpiresAt: getTemporaryPasswordExpiresAt(),
  });

  tenant.user = user._id;
  await tenant.save();

  return {
    user: {
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      username: user.username,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
      temporaryPasswordExpiresAt: user.temporaryPasswordExpiresAt,
    },
    temporaryPassword,
  };
}

function buildContractPdf(contract, res) {
  const room = contract.room || {};
  const tenant = contract.tenant || {};
  const document = new PDFDocument({ margin: 48, size: 'A4' });
  const vietnameseFontPath = getVietnameseFontPath();

  document.pipe(res);

  if (vietnameseFontPath) {
    document.registerFont('Vietnamese', vietnameseFontPath);
    document.font('Vietnamese');
  }

  document.fontSize(20).text('SMART RENTAL', { align: 'center' });
  document.moveDown(0.4);
  document.fontSize(16).text('HỢP ĐỒNG THUÊ PHÒNG', { align: 'center' });
  document.moveDown(1.2);

  document.fontSize(11).text(`Mã hợp đồng: ${contract._id}`);
  document.text(`Ngày tạo file: ${formatDate(new Date())}`);
  document.moveDown();

  document.fontSize(13).text('1. Thông tin phòng', { underline: true });
  document.moveDown(0.3);
  document.fontSize(11);
  document.text(`Phòng: ${room.name || 'Chưa có'}`);
  document.text(`Tầng: ${room.floor ?? 'Chưa có'}`);
  document.text(`Giá niêm yết: ${formatMoney(room.price)}`);
  document.text(`Số người tối đa: ${room.maxOccupants || 2}`);
  document.moveDown();

  document.fontSize(13).text('2. Thông tin khách thuê', { underline: true });
  document.moveDown(0.3);
  document.fontSize(11);
  document.text(`Họ tên: ${tenant.fullName || 'Chưa có'}`);
  document.text(`Số điện thoại: ${tenant.phone || 'Chưa có'}`);
  document.text(`Email: ${tenant.email || 'Chưa có'}`);
  document.text(`CCCD/CMND: ${tenant.identityNumber || 'Chưa có'}`);
  document.moveDown();

  document.fontSize(13).text('3. Điều khoản hợp đồng', { underline: true });
  document.moveDown(0.3);
  document.fontSize(11);
  document.text(`Ngày bắt đầu: ${formatDate(contract.startDate)}`);
  document.text(`Ngày kết thúc: ${formatDate(contract.endDate)}`);
  document.text(`Tiền thuê hằng tháng: ${formatMoney(contract.monthlyPrice)}`);
  document.text(`Tiền cọc: ${formatMoney(contract.deposit)}`);
  document.text(`Trạng thái: ${formatStatus(contract.status)}`);
  document.moveDown(1.4);

  document
    .fontSize(10)
    .text(
      'File PDF này được tạo từ dữ liệu Smart Rental để phục vụ demo chuyên đề tốt nghiệp.',
    );
  document.moveDown(2);

  const signatureY = document.y;
  document.text('Chữ ký chủ trọ', 80, signatureY, { width: 180 });
  document.text('Chữ ký khách thuê', 340, signatureY, { width: 180 });

  document.end();
}

async function normalizeContractPayload(body, currentContractId = null) {
  const room = body.room;
  const tenant = body.tenant;
  const startDate = parseOptionalDate(body.startDate);
  const endDate = parseOptionalDate(body.endDate);
  const monthlyPrice = Number(body.monthlyPrice);
  const deposit = body.deposit === undefined ? 0 : Number(body.deposit);

  if (!startDate) {
    throw createHttpError(400, 'Ngày bắt đầu không hợp lệ', {
      startDate: 'Ngày bắt đầu phải là ngày hợp lệ',
    });
  }

  if (body.endDate && !endDate) {
    throw createHttpError(400, 'Ngày kết thúc không hợp lệ', {
      endDate: 'Ngày kết thúc phải là ngày hợp lệ',
    });
  }

  if (endDate && endDate <= startDate) {
    throw createHttpError(400, 'Ngày kết thúc phải sau ngày bắt đầu', {
      endDate: 'Ngày kết thúc phải sau ngày bắt đầu',
    });
  }

  const [existingRoom, existingTenant] = await Promise.all([
    Room.findOne({ _id: room, deletedAt: null }),
    Tenant.findOne({ _id: tenant, deletedAt: null }),
  ]);

  if (!existingRoom) {
    throw createHttpError(400, 'Phòng không tồn tại', {
      room: 'Phòng không tồn tại',
    });
  }

  if (!existingTenant) {
    throw createHttpError(400, 'Khách thuê không tồn tại', {
      tenant: 'Khách thuê không tồn tại',
    });
  }

  if ((body.status || 'active') === 'active') {
    const activeContractFilters = {
      room,
      status: 'active',
    };

    if (currentContractId) {
      activeContractFilters._id = { $ne: currentContractId };
    }

    const activeContract = await Contract.findOne(activeContractFilters);

    if (activeContract) {
      throw createHttpError(400, 'Phòng đã có hợp đồng đang hiệu lực', {
        room: 'Phòng đã có hợp đồng đang hiệu lực',
      });
    }
  }

  return {
    room,
    tenant,
    startDate,
    endDate,
    monthlyPrice,
    deposit,
    status: body.status || 'active',
  };
}

export async function listContracts(req, res, next) {
  try {
    const { room, tenant, status, page = 1, limit = 20 } = req.query;
    const filters = {};
    const safePage = Math.max(Number(page) || 1, 1);
    const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);

    if (room) filters.room = room;
    if (tenant) filters.tenant = tenant;
    if (status) filters.status = status;

    const [contracts, total] = await Promise.all([
      Contract.find(filters)
        .populate(contractPopulate)
        .sort({ startDate: -1, createdAt: -1 })
        .skip((safePage - 1) * safeLimit)
        .limit(safeLimit),
      Contract.countDocuments(filters),
    ]);

    res.json({
      data: contracts,
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

export async function getContract(req, res, next) {
  try {
    const contract = await Contract.findById(req.params.id).populate(
      contractPopulate,
    );

    if (!contract) {
      throw createHttpError(404, 'Không tìm thấy hợp đồng');
    }

    res.json({ data: contract });
  } catch (error) {
    next(error);
  }
}

export async function downloadContractPdf(req, res, next) {
  try {
    const contract = await Contract.findById(req.params.id).populate(
      contractPopulate,
    );

    if (!contract) {
      throw createHttpError(404, 'Không tìm thấy hợp đồng');
    }

    const roomName = contract.room?.name || 'contract';
    const filename = `hop-dong-${roomName}-${contract._id}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    buildContractPdf(contract, res);
  } catch (error) {
    next(error);
  }
}

export async function createContract(req, res, next) {
  try {
    const payload = await normalizeContractPayload(req.body);
    const contract = await Contract.create(payload);
    const temporaryAccount =
      payload.status === 'active'
        ? await ensureTenantAccount(payload.tenant)
        : null;
    const populatedContract = await contract.populate(contractPopulate);

    res.status(201).json({
      data: {
        ...populatedContract.toObject(),
        temporaryAccount,
      },
      message: 'Tạo hợp đồng thành công',
    });
  } catch (error) {
    next(error);
  }
}

export async function updateContract(req, res, next) {
  try {
    const contract = await Contract.findByIdAndUpdate(
      req.params.id,
      await normalizeContractPayload(req.body, req.params.id),
      {
        new: true,
        runValidators: true,
      },
    ).populate(contractPopulate);

    if (!contract) {
      throw createHttpError(404, 'Không tìm thấy hợp đồng');
    }

    res.json({
      data: contract,
      message: 'Cập nhật hợp đồng thành công',
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteContract(req, res, next) {
  try {
    const contract = await Contract.findByIdAndUpdate(
      req.params.id,
      { status: 'ended' },
      {
        new: true,
        runValidators: true,
      },
    ).populate(contractPopulate);

    if (!contract) {
      throw createHttpError(404, 'Không tìm thấy hợp đồng');
    }

    res.json({
      data: contract,
      message: 'Kết thúc hợp đồng thành công',
    });
  } catch (error) {
    next(error);
  }
}
