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

function formatContractCode(contract) {
  return `SR-${String(contract._id).slice(-8).toUpperCase()}`;
}

function addSectionTitle(document, title, y = document.y) {
  document.fillColor('#075985').fontSize(12).text(title, 48, y, { width: 500 });
  document
    .moveTo(48, document.y + 5)
    .lineTo(547, document.y + 5)
    .strokeColor('#bae6fd')
    .lineWidth(1)
    .stroke();
  document.moveDown(0.9);
  document.fillColor('#0f172a');
}

function addInfoRow(document, label, value, x, y, width = 225) {
  document.fillColor('#64748b').fontSize(9).text(label, x, y, { width });
  document
    .fillColor('#0f172a')
    .fontSize(10.5)
    .text(value || 'Chưa có', x, y + 14, { width });
}

function addCard(document, x, y, width, height, title) {
  document
    .roundedRect(x, y, width, height, 10)
    .fillAndStroke('#f8fafc', '#dbeafe');
  document
    .fillColor('#075985')
    .fontSize(11)
    .text(title, x + 16, y + 14, {
      width: width - 32,
    });
}

function addFinanceRow(document, label, value, y, highlight = false) {
  document
    .roundedRect(58, y, 479, 34, 7)
    .fillAndStroke(highlight ? '#e0f2fe' : '#ffffff', '#dbeafe');
  document
    .fillColor('#475569')
    .fontSize(10)
    .text(label, 72, y + 11, {
      width: 240,
    });
  document
    .fillColor(highlight ? '#075985' : '#0f172a')
    .fontSize(10.5)
    .text(value, 330, y + 11, { width: 190, align: 'right' });
}

function addClause(document, index, text) {
  document.fillColor('#0f172a').fontSize(10).text(`${index}. ${text}`, {
    align: 'justify',
    lineGap: 2,
  });
  document.moveDown(0.45);
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
  const document = new PDFDocument({
    margin: 48,
    size: 'A4',
    info: {
      Title: `Hop dong thue phong ${formatContractCode(contract)}`,
      Author: 'Smart Rental',
    },
  });
  const vietnameseFontPath = getVietnameseFontPath();

  document.pipe(res);

  if (vietnameseFontPath) {
    document.registerFont('Vietnamese', vietnameseFontPath);
    document.font('Vietnamese');
  }

  document.rect(0, 0, 595.28, 154).fill('#e0f2fe');
  document.rect(0, 0, 595.28, 14).fill('#0284c7');
  document
    .fillColor('#075985')
    .fontSize(18)
    .text('SMART RENTAL', 48, 72, { width: 220 });
  document
    .fillColor('#475569')
    .fontSize(9)
    .text('He thong quan ly phong tro thong minh', 48, 96, {
      width: 220,
    });
  document
    .fillColor('#0f172a')
    .fontSize(18)
    .text('HỢP ĐỒNG THUÊ PHÒNG', 292, 72, {
      align: 'right',
      width: 255,
    });
  document
    .fillColor('#475569')
    .fontSize(10)
    .text(`Số: ${formatContractCode(contract)}`, 292, 98, {
      align: 'right',
      width: 255,
    });
  document.fontSize(9).text(`Ngày lập: ${formatDate(new Date())}`, 292, 114, {
    align: 'right',
    width: 255,
  });

  document.y = 174;
  document
    .fillColor('#0f172a')
    .fontSize(10)
    .text(
      'Căn cứ nhu cầu thuê phòng và thỏa thuận giữa các bên, hợp đồng này ghi nhận các thông tin thuê phòng như sau:',
      48,
      document.y,
      { align: 'justify', lineGap: 2, width: 499 },
    );
  document.moveDown(1.1);

  const partyY = document.y;
  addCard(document, 48, partyY, 238, 112, 'BÊN CHO THUÊ');
  addInfoRow(
    document,
    'Đơn vị',
    'Smart Rental / Chủ trọ',
    64,
    partyY + 40,
    190,
  );
  addInfoRow(
    document,
    'Vai trò',
    'Bên quản lý và cho thuê phòng',
    64,
    partyY + 74,
    190,
  );

  addCard(document, 309, partyY, 238, 112, 'BÊN THUÊ');
  addInfoRow(document, 'Họ tên', tenant.fullName, 325, partyY + 40, 190);
  addInfoRow(document, 'Số điện thoại', tenant.phone, 325, partyY + 74, 95);
  addInfoRow(
    document,
    'CCCD/CMND',
    tenant.identityNumber,
    430,
    partyY + 74,
    95,
  );

  document.y = partyY + 136;
  addSectionTitle(document, '1. THÔNG TIN PHÒNG THUÊ');
  const roomY = document.y;
  addInfoRow(document, 'Phòng', room.name, 58, roomY, 110);
  addInfoRow(document, 'Tầng', String(room.floor ?? 'Chưa có'), 182, roomY, 90);
  addInfoRow(
    document,
    'Số người tối đa',
    String(room.maxOccupants || 2),
    292,
    roomY,
    110,
  );
  addInfoRow(
    document,
    'Giá niêm yết',
    formatMoney(room.price),
    420,
    roomY,
    110,
  );

  document.y = roomY + 54;
  addSectionTitle(document, '2. THỜI HẠN VÀ GIÁ TRỊ HỢP ĐỒNG');
  const financeY = document.y;
  addFinanceRow(
    document,
    'Ngày bắt đầu',
    formatDate(contract.startDate),
    financeY,
  );
  addFinanceRow(
    document,
    'Ngày kết thúc',
    formatDate(contract.endDate),
    financeY + 40,
  );
  addFinanceRow(
    document,
    'Tiền thuê hằng tháng',
    formatMoney(contract.monthlyPrice),
    financeY + 80,
    true,
  );
  addFinanceRow(
    document,
    'Tiền cọc',
    formatMoney(contract.deposit),
    financeY + 120,
  );
  addFinanceRow(
    document,
    'Trạng thái hợp đồng',
    formatStatus(contract.status),
    financeY + 160,
  );

  document.y = financeY + 214;
  addSectionTitle(document, '3. ĐIỀU KHOẢN CHÍNH');
  addClause(
    document,
    1,
    'Bên thuê sử dụng phòng đúng mục đích để ở, giữ gìn tài sản, vệ sinh chung và tuân thủ nội quy khu trọ.',
  );
  addClause(
    document,
    2,
    'Tiền thuê được thanh toán theo tháng. Các khoản điện, nước, internet, rác, gửi xe và phụ phí khác được tính theo chỉ số hoặc đơn giá dịch vụ tại thời điểm phát sinh.',
  );
  addClause(
    document,
    3,
    'Bên thuê có trách nhiệm thanh toán đúng hạn. Nếu chậm thanh toán, hai bên xử lý theo thỏa thuận và nội quy đã thông báo.',
  );
  addClause(
    document,
    4,
    'Khi kết thúc hợp đồng, bên thuê bàn giao phòng và tài sản trong tình trạng hợp lý. Tiền cọc được đối soát sau khi trừ các khoản còn nợ hoặc hư hỏng nếu có.',
  );

  document.moveDown(0.5);
  document
    .fillColor('#64748b')
    .fontSize(9)
    .text(
      'Tài liệu được sinh tự động từ Smart Rental. Các bên cần kiểm tra thông tin thực tế trước khi ký và lưu trữ bản chính theo quy định của đơn vị quản lý.',
      { align: 'justify', lineGap: 2 },
    );

  const signatureY = Math.max(document.y + 30, 690);
  document.fillColor('#0f172a').fontSize(10);
  document.text('ĐẠI DIỆN BÊN CHO THUÊ', 70, signatureY, {
    align: 'center',
    width: 180,
  });
  document.text('BÊN THUÊ', 345, signatureY, {
    align: 'center',
    width: 140,
  });
  document
    .fillColor('#64748b')
    .fontSize(9)
    .text('(Ký và ghi rõ họ tên)', 70, signatureY + 18, {
      align: 'center',
      width: 180,
    });
  document.text('(Ký và ghi rõ họ tên)', 330, signatureY + 18, {
    align: 'center',
    width: 170,
  });
  document
    .moveTo(76, signatureY + 92)
    .lineTo(244, signatureY + 92)
    .moveTo(330, signatureY + 92)
    .lineTo(500, signatureY + 92)
    .strokeColor('#94a3b8')
    .lineWidth(0.8)
    .stroke();

  document
    .fillColor('#94a3b8')
    .fontSize(8)
    .text(`Smart Rental · ${formatContractCode(contract)}`, 48, 804, {
      align: 'center',
      width: 499,
    });

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
