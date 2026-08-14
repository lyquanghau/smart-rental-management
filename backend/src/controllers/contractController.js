import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';
import PDFDocument from 'pdfkit';
import { Contract } from '../models/Contract.js';
import { Room } from '../models/Room.js';
import { Tenant } from '../models/Tenant.js';
import { User } from '../models/User.js';
import { createHttpError } from '../utils/httpError.js';
import { getTenantIdForUser, ownerFilter } from '../utils/ownership.js';
import {
  isMailConfigured,
  sendTenantCredentialsEmail,
} from '../utils/mailService.js';
import { generateTemporaryPassword } from '../utils/password.js';
import { buildTenantRoomUsername } from '../utils/tenantAccount.js';

const contractPopulate = [
  { path: 'owner', select: 'fullName email phone' },
  { path: 'room', select: 'name floor price maxOccupants status' },
  {
    path: 'tenant',
    select:
      'fullName phone email identityNumber dateOfBirth permanentAddress room user',
  },
];

const landlordContractProfile = {
  fullName: 'Lý Quang Hậu',
  email: 'ly.quang.hau8402@gmail.com',
  phone: '0706581564',
  identityNumber: '093204008182',
  dateOfBirth: '2004-04-08',
  rentalAddress:
    '158/25 Phạm Văn Chiêu, phường Thông Tây Hội, thành phố Hồ Chí Minh',
};

const bundledFontPaths = {
  bold: fileURLToPath(
    new URL('../assets/fonts/NotoSans-Bold.ttf', import.meta.url),
  ),
  regular: fileURLToPath(
    new URL('../assets/fonts/NotoSans-Regular.ttf', import.meta.url),
  ),
};

const vietnameseFontPaths = {
  regular: [
    bundledFontPaths.regular,
    'C:/Windows/Fonts/times.ttf',
    'C:/Windows/Fonts/arial.ttf',
    '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
    '/usr/share/fonts/truetype/liberation2/LiberationSerif-Regular.ttf',
    '/usr/share/fonts/truetype/liberation/LiberationSerif-Regular.ttf',
    '/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf',
  ],
  bold: [
    bundledFontPaths.bold,
    'C:/Windows/Fonts/timesbd.ttf',
    'C:/Windows/Fonts/arialbd.ttf',
    '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
    '/usr/share/fonts/truetype/liberation2/LiberationSerif-Bold.ttf',
    '/usr/share/fonts/truetype/liberation/LiberationSerif-Bold.ttf',
    '/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf',
  ],
};

function getVietnameseFontPaths() {
  return {
    bold: vietnameseFontPaths.bold.find((fontPath) => existsSync(fontPath)),
    regular: vietnameseFontPaths.regular.find((fontPath) =>
      existsSync(fontPath),
    ),
  };
}

function getContractFont(document, weight = 'regular') {
  return (
    document._contractFonts?.[weight] ||
    (weight === 'bold' ? 'Times-Bold' : 'Times-Roman')
  );
}

function parseOptionalDate(value) {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return date;
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

function normalizeOccupants(value = []) {
  if (!Array.isArray(value)) return [];

  return value
    .map((occupant) => ({
      fullName: occupant.fullName?.trim(),
      phone: occupant.phone?.trim() || '',
      identityNumber: occupant.identityNumber?.trim() || '',
      note: occupant.note?.trim() || '',
    }))
    .filter((occupant) => occupant.fullName);
}

async function findOrCreateTenantForContract(body, ownerId, roomId) {
  if (body.tenant) {
    const tenant = await Tenant.findOne({
      _id: body.tenant,
      owner: ownerId,
      deletedAt: null,
    });

    if (!tenant) {
      throw createHttpError(400, 'Khách thuê không tồn tại', {
        tenant: 'Khách thuê không tồn tại',
      });
    }

    if (String(tenant.room || '') !== String(roomId)) {
      tenant.room = roomId;
      await tenant.save();
    }

    await Room.updateOne(
      {
        _id: roomId,
        owner: ownerId,
        deletedAt: null,
        status: { $ne: 'maintenance' },
      },
      { status: 'occupied' },
    );

    return tenant;
  }

  const tenantInfo = body.tenantInfo || {};
  const dateOfBirth = parseOptionalDate(tenantInfo.dateOfBirth);
  const payload = {
    owner: ownerId,
    fullName: tenantInfo.fullName?.trim(),
    phone: tenantInfo.phone?.trim(),
    email: tenantInfo.email?.trim()?.toLowerCase() || null,
    identityNumber: tenantInfo.identityNumber?.trim() || null,
    dateOfBirth,
    permanentAddress: tenantInfo.permanentAddress?.trim() || null,
    room: roomId,
  };

  if (tenantInfo.dateOfBirth && !dateOfBirth) {
    throw createHttpError(400, 'Ngay sinh khach thue khong hop le', {
      tenantInfo: 'Ngay sinh khach thue phai la ngay hop le',
    });
  }

  if (!payload.fullName) {
    throw createHttpError(400, 'Họ tên khách thuê là bắt buộc', {
      tenantInfo: 'Họ tên khách thuê là bắt buộc',
    });
  }

  if (!payload.phone) {
    throw createHttpError(400, 'Số điện thoại khách thuê là bắt buộc', {
      tenantInfo: 'Số điện thoại khách thuê là bắt buộc',
    });
  }

  if (!payload.email) {
    throw createHttpError(
      400,
      'Email khách thuê là bắt buộc để tạo tài khoản',
      {
        tenantInfo: 'Email khách thuê là bắt buộc để tạo tài khoản',
      },
    );
  }

  if (!isMailConfigured()) {
    throw createHttpError(
      503,
      'Chua cau hinh SMTP de gui tai khoan khach thue',
      {
        tenantInfo:
          'He thong chi tao tai khoan khi gui duoc thong tin dang nhap qua email',
      },
    );
  }

  const existingTenant = await Tenant.findOne({
    owner: ownerId,
    deletedAt: null,
    $or: [{ phone: payload.phone }, { email: payload.email }],
  });

  if (existingTenant) {
    if (payload.identityNumber)
      existingTenant.identityNumber = payload.identityNumber;
    if (payload.dateOfBirth) existingTenant.dateOfBirth = payload.dateOfBirth;
    if (payload.permanentAddress) {
      existingTenant.permanentAddress = payload.permanentAddress;
    }

    if (String(existingTenant.room || '') !== String(roomId)) {
      existingTenant.room = roomId;
    }

    await existingTenant.save();

    await Room.updateOne(
      {
        _id: roomId,
        owner: ownerId,
        deletedAt: null,
        status: { $ne: 'maintenance' },
      },
      { status: 'occupied' },
    );

    return existingTenant;
  }

  const tenant = await Tenant.create(payload);

  await Room.updateOne(
    {
      _id: roomId,
      owner: ownerId,
      deletedAt: null,
      status: { $ne: 'maintenance' },
    },
    { status: 'occupied' },
  );

  return tenant;
}

function addCenteredContractLine(document, text, options = {}) {
  document
    .font(
      getContractFont(document, options.bold === false ? 'regular' : 'bold'),
    )
    .fillColor('#111827')
    .fontSize(options.fontSize || 12)
    .text(text, {
      align: 'center',
      lineGap: options.lineGap ?? 1,
      underline: options.underline || false,
    });
}

function addPlainContractParagraph(document, text, options = {}) {
  document
    .font(getContractFont(document, options.bold ? 'bold' : 'regular'))
    .fillColor('#111827')
    .fontSize(options.fontSize || 11.5)
    .text(text, {
      align: options.align || 'justify',
      lineGap: options.lineGap ?? 2,
    });
  document.moveDown(options.after ?? 0.35);
}

function addPlainContractHeading(document, text) {
  document.moveDown(0.45);
  document
    .font(getContractFont(document, 'bold'))
    .fillColor('#111827')
    .fontSize(12)
    .text(text, { align: 'center', lineGap: 1 });
  document.moveDown(0.35);
}

function addPlainBulletClause(document, text) {
  document
    .font(getContractFont(document))
    .fillColor('#111827')
    .fontSize(11.5)
    .text(`- ${text}`, {
      align: 'justify',
      indent: 12,
      lineGap: 2,
    });
  document.moveDown(0.2);
}

function addPlainPartyLine(document, label, value, options = {}) {
  const finalValue =
    value || '................................................';

  document
    .font(getContractFont(document))
    .fillColor('#111827')
    .fontSize(11.5)
    .text(`${label}: `, { continued: true, lineGap: 2 });
  document
    .font(getContractFont(document, options.boldValue ? 'bold' : 'regular'))
    .text(finalValue, { lineGap: 2 });
  document.moveDown(0.2);
}

function formatDayMonthYear(value) {
  const date = value ? new Date(value) : new Date();

  return {
    day: String(date.getDate()).padStart(2, '0'),
    month: String(date.getMonth() + 1).padStart(2, '0'),
    year: String(date.getFullYear()),
  };
}

async function ensureTenantAccount(tenantId, ownerId, roomId) {
  const tenant = await Tenant.findOne({
    _id: tenantId,
    owner: ownerId,
    deletedAt: null,
  });
  const room = await Room.findOne({
    _id: roomId,
    owner: ownerId,
    deletedAt: null,
  });

  if (!tenant) {
    throw createHttpError(400, 'Khách thuê không tồn tại', {
      tenant: 'Khách thuê không tồn tại',
    });
  }

  if (!room) {
    throw createHttpError(400, 'Phong khong ton tai', {
      room: 'Phong khong ton tai',
    });
  }

  if (!tenant.email) {
    throw createHttpError(
      400,
      'Can email khach thue de tao tai khoan dang nhap',
      {
        email: 'Email la bat buoc khi gan khach vao phong',
      },
    );
  }

  if (tenant.user) {
    return null;
  }

  const username = buildTenantRoomUsername(tenant, room);
  const email = tenant.email.trim().toLowerCase();

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

  const existingUser = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (existingUser) {
    throw createHttpError(409, 'Email hoac ten dang nhap da ton tai', {
      email: 'Email hoac ten dang nhap da duoc dung cho tai khoan khac',
      username,
    });
  }

  const password = generateTemporaryPassword();
  const user = await User.create({
    fullName: tenant.fullName,
    email,
    username,
    passwordHash: await bcrypt.hash(password, 10),
    role: 'tenant',
    isActive: true,
    mustChangePassword: false,
    temporaryPasswordExpiresAt: null,
  });

  const emailDelivery = await sendTenantCredentialsEmail({
    password,
    tenantEmail: email,
    tenantName: tenant.fullName,
    username,
  });

  if (!emailDelivery.sent) {
    await User.deleteOne({ _id: user._id });
    throw createHttpError(503, 'Khong gui duoc email tai khoan khach thue', {
      email:
        emailDelivery.error || 'Kiem tra cau hinh SMTP va email khach thue',
    });
  }

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
    emailDelivery,
  };
}

function buildPlainRoomContractPdf(contract, res) {
  const room = contract.room || {};
  const tenant = contract.tenant || {};
  const owner = contract.owner || {};
  const landlord = {
    ...landlordContractProfile,
    fullName: landlordContractProfile.fullName || owner.fullName,
    email: landlordContractProfile.email || owner.email,
    phone: landlordContractProfile.phone || owner.phone,
  };
  const createdDate = formatDayMonthYear(new Date());
  const startDate = formatDayMonthYear(contract.startDate);
  const endDate = contract.endDate
    ? formatDayMonthYear(contract.endDate)
    : null;
  const landlordBirthDate = formatDayMonthYear(landlord.dateOfBirth);
  const tenantBirthDate = tenant.dateOfBirth
    ? formatDayMonthYear(tenant.dateOfBirth)
    : null;
  const roomAddress = `Phòng ${room.name || '........'}${room.floor ? `, tầng ${room.floor}` : ''}, ${landlord.rentalAddress}`;
  const document = new PDFDocument({
    margin: 50,
    size: 'A4',
    info: {
      Author: 'Smart Rental',
      Title: `Hop dong thue phong ${formatContractCode(contract)}`,
    },
  });
  const vietnameseFontPath = getVietnameseFontPaths();

  document.pipe(res);

  document._contractFonts = {
    bold: 'Times-Bold',
    regular: 'Times-Roman',
  };

  if (vietnameseFontPath.regular) {
    document.registerFont('ContractRegular', vietnameseFontPath.regular);
    document._contractFonts.regular = 'ContractRegular';
  }

  if (vietnameseFontPath.bold) {
    document.registerFont('ContractBold', vietnameseFontPath.bold);
    document._contractFonts.bold = 'ContractBold';
  }

  addCenteredContractLine(document, 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM', {
    fontSize: 13,
  });
  addCenteredContractLine(document, 'Độc lập - Tự do - Hạnh phúc', {
    fontSize: 12,
    underline: true,
  });
  document.moveDown(1.1);
  addCenteredContractLine(document, 'HỢP ĐỒNG THUÊ PHÒNG TRỌ', {
    fontSize: 17,
  });
  addCenteredContractLine(document, `Số: ${formatContractCode(contract)}`, {
    bold: false,
    fontSize: 11,
  });
  document.moveDown(0.9);

  addPlainContractParagraph(
    document,
    `Hôm nay ngày ${createdDate.day} tháng ${createdDate.month} năm ${createdDate.year}; chúng tôi gồm:`,
  );

  addPlainContractHeading(
    document,
    '1. Đại diện bên cho thuê phòng trọ (Bên A)',
  );
  addPlainPartyLine(document, 'Ông/bà', landlord.fullName, {
    boldValue: true,
  });
  addPlainPartyLine(
    document,
    'Sinh ngày',
    `${landlordBirthDate.day}/${landlordBirthDate.month}/${landlordBirthDate.year}`,
  );
  addPlainPartyLine(document, 'Số CMND/CCCD', landlord.identityNumber);
  addPlainPartyLine(document, 'Email', landlord.email);
  addPlainPartyLine(document, 'Số điện thoại', landlord.phone);
  addPlainPartyLine(document, 'Địa chỉ nhà trọ', landlord.rentalAddress);

  addPlainContractHeading(document, '2. Bên thuê phòng trọ (Bên B)');
  addPlainPartyLine(document, 'Ông/bà', tenant.fullName, { boldValue: true });
  addPlainPartyLine(
    document,
    'Sinh ngày',
    tenantBirthDate
      ? `${tenantBirthDate.day}/${tenantBirthDate.month}/${tenantBirthDate.year}`
      : null,
  );
  addPlainPartyLine(document, 'HK thường trú', tenant.permanentAddress);
  addPlainPartyLine(document, 'Số CMND/CCCD', tenant.identityNumber);
  addPlainPartyLine(document, 'Email', tenant.email);
  addPlainPartyLine(document, 'Số điện thoại', tenant.phone);

  if (contract.occupants?.length > 0) {
    addPlainContractParagraph(
      document,
      `Người ở cùng: ${contract.occupants.map((item) => item.fullName).join(', ')}.`,
    );
  }

  addPlainContractParagraph(
    document,
    'Sau khi bàn bạc trên tinh thần dân chủ, hai bên cùng có lợi, cùng thống nhất như sau:',
  );
  addPlainContractParagraph(
    document,
    `Bên A đồng ý cho Bên B thuê 01 phòng ở tại địa chỉ: ${roomAddress}.`,
  );
  addPlainContractParagraph(
    document,
    `Giá thuê: ${formatMoney(contract.monthlyPrice)}/tháng.`,
  );
  addPlainContractParagraph(
    document,
    'Hình thức thanh toán: Thanh toán theo tháng theo thỏa thuận giữa hai bên hoặc theo hướng dẫn thanh toán của hệ thống Smart Rental.',
  );
  addPlainContractParagraph(
    document,
    'Tiền điện, tiền nước và các khoản dịch vụ khác được tính theo chỉ số sử dụng thực tế hoặc đơn giá dịch vụ do Bên A thông báo.',
  );
  addPlainContractParagraph(
    document,
    `Tiền đặt cọc: ${formatMoney(contract.deposit)}.`,
  );
  addPlainContractParagraph(
    document,
    `Hợp đồng có giá trị kể từ ngày ${startDate.day} tháng ${startDate.month} năm ${startDate.year}${
      endDate
        ? ` đến ngày ${endDate.day} tháng ${endDate.month} năm ${endDate.year}`
        : ''
    }.`,
  );
  addPlainContractParagraph(
    document,
    `Trạng thái hợp đồng trên hệ thống: ${formatStatus(contract.status)}.`,
  );

  addPlainContractHeading(document, 'TRÁCH NHIỆM CỦA CÁC BÊN');
  addPlainContractParagraph(document, '* Trách nhiệm của Bên A:', {
    align: 'left',
  });
  addPlainBulletClause(
    document,
    'Tạo mọi điều kiện thuận lợi để Bên B thực hiện theo hợp đồng.',
  );
  addPlainBulletClause(
    document,
    'Cung cấp nguồn điện, nước, wifi và các dịch vụ đã thỏa thuận cho Bên B sử dụng.',
  );

  addPlainContractParagraph(document, '* Trách nhiệm của Bên B:', {
    align: 'left',
  });
  addPlainBulletClause(
    document,
    'Thanh toán đầy đủ các khoản tiền theo đúng thỏa thuận.',
  );
  addPlainBulletClause(
    document,
    'Bảo quản trang thiết bị và cơ sở vật chất do Bên A trang bị ban đầu; làm hỏng phải sửa, mất phải đền.',
  );
  addPlainBulletClause(
    document,
    'Không được tự ý sửa chữa, cải tạo cơ sở vật chất khi chưa được sự đồng ý của Bên A.',
  );
  addPlainBulletClause(
    document,
    'Giữ gìn vệ sinh trong và ngoài khuôn viên phòng trọ.',
  );
  addPlainBulletClause(
    document,
    'Chấp hành mọi quy định của pháp luật Nhà nước và quy định của địa phương.',
  );
  addPlainBulletClause(
    document,
    'Nếu cho khách ở qua đêm thì phải báo và được sự đồng ý của chủ nhà, đồng thời chịu trách nhiệm về hành vi vi phạm pháp luật của khách trong thời gian ở lại.',
  );

  addPlainContractHeading(document, 'TRÁCH NHIỆM CHUNG');
  addPlainBulletClause(
    document,
    'Hai bên phải tạo điều kiện cho nhau thực hiện hợp đồng.',
  );
  addPlainBulletClause(
    document,
    'Trong thời gian hợp đồng còn hiệu lực, nếu bên nào vi phạm các điều khoản đã thỏa thuận thì bên còn lại có quyền đơn phương chấm dứt hợp đồng và yêu cầu bồi thường thiệt hại nếu có.',
  );
  addPlainBulletClause(
    document,
    'Một trong hai bên muốn chấm dứt hợp đồng trước thời hạn thì phải báo trước cho bên kia ít nhất 30 ngày và hai bên phải có sự thống nhất.',
  );
  addPlainBulletClause(
    document,
    'Khi kết thúc hợp đồng, Bên A hoàn trả tiền đặt cọc cho Bên B sau khi đối soát các khoản còn nợ hoặc hư hỏng nếu có.',
  );
  addPlainBulletClause(
    document,
    'Hợp đồng được lập thành 02 bản có giá trị pháp lý như nhau, mỗi bên giữ một bản.',
  );

  if (document.y > 640) {
    document.addPage();
  }

  const signatureY = Math.max(document.y + 24, 650);
  document.fontSize(10.5).fillColor('#111827');
  document.text('ĐẠI DIỆN BÊN B', 70, signatureY, {
    align: 'center',
    width: 180,
  });
  document.text('ĐẠI DIỆN BÊN A', 345, signatureY, {
    align: 'center',
    width: 160,
  });
  document.fontSize(9).text('(Ký và ghi rõ họ tên)', 70, signatureY + 18, {
    align: 'center',
    width: 180,
  });
  document.text('(Ký và ghi rõ họ tên)', 335, signatureY + 18, {
    align: 'center',
    width: 180,
  });
  document
    .moveTo(78, signatureY + 92)
    .lineTo(242, signatureY + 92)
    .moveTo(342, signatureY + 92)
    .lineTo(508, signatureY + 92)
    .strokeColor('#9ca3af')
    .lineWidth(0.8)
    .stroke();

  document.end();
}

function buildContractPdf(contract, res) {
  return buildPlainRoomContractPdf(contract, res);
}

async function normalizeContractPayload(
  body,
  ownerId,
  currentContractId = null,
) {
  const room = body.room;
  const startDate = parseOptionalDate(body.startDate);
  const endDate = parseOptionalDate(body.endDate);
  const monthlyPrice = Number(body.monthlyPrice);
  const deposit = body.deposit === undefined ? 0 : Number(body.deposit);
  const occupants = normalizeOccupants(body.occupants);

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

  const existingRoom = await Room.findOne({
    _id: room,
    owner: ownerId,
    deletedAt: null,
  });

  if (!existingRoom) {
    throw createHttpError(400, 'Phòng không tồn tại', {
      room: 'Phòng không tồn tại',
    });
  }

  if (occupants.length + 1 > (existingRoom.maxOccupants || 1)) {
    throw createHttpError(400, 'So nguoi o vuot qua suc chua phong', {
      occupants: 'So nguoi o vuot qua suc chua phong',
    });
  }

  if ((body.status || 'active') === 'active') {
    const activeContractFilters = {
      deletedAt: null,
      owner: ownerId,
      room,
      status: 'active',
    };

    if (currentContractId) {
      activeContractFilters._id = { $ne: currentContractId };
    }

    const activeContract = await Contract.findOne(activeContractFilters);

    if (activeContract) {
      throw createHttpError(400, 'Phong da co hop dong dang hieu luc', {
        room: 'Phong da co hop dong dang hieu luc',
      });
    }
  }

  const existingTenant = await findOrCreateTenantForContract(
    body,
    ownerId,
    room,
  );

  if (!existingTenant) {
    throw createHttpError(400, 'Khách thuê không tồn tại', {
      tenant: 'Khách thuê không tồn tại',
    });
  }

  if ((body.status || 'active') === 'active') {
    const activeContractFilters = {
      deletedAt: null,
      owner: ownerId,
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
    tenant: existingTenant._id,
    owner: ownerId,
    startDate,
    endDate,
    monthlyPrice,
    deposit,
    status: body.status || 'active',
    occupants,
  };
}

export async function listContracts(req, res, next) {
  try {
    const {
      includeDeleted,
      room,
      tenant,
      status,
      page = 1,
      limit = 20,
    } = req.query;
    const shouldIncludeDeleted =
      req.user.role === 'landlord' && includeDeleted === 'true';
    const filters =
      req.user.role === 'landlord'
        ? ownerFilter(req, shouldIncludeDeleted ? {} : { deletedAt: null })
        : { deletedAt: null };
    const safePage = Math.max(Number(page) || 1, 1);
    const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);

    if (room) filters.room = room;
    if (tenant) filters.tenant = tenant;
    if (status === 'deleted') filters.deletedAt = { $ne: null };
    else if (status) filters.status = status;

    if (req.user.role === 'tenant') {
      filters.tenant = await getTenantIdForUser(req.user._id);
    }

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
    const filters =
      req.user.role === 'landlord'
        ? ownerFilter(req, { _id: req.params.id })
        : { _id: req.params.id, deletedAt: null };

    if (req.user.role === 'tenant') {
      filters.tenant = await getTenantIdForUser(req.user._id);
    }

    const contract = await Contract.findOne(filters).populate(contractPopulate);

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
    const filters =
      req.user.role === 'landlord'
        ? ownerFilter(req, { _id: req.params.id })
        : { _id: req.params.id, deletedAt: null };

    if (req.user.role === 'tenant') {
      filters.tenant = await getTenantIdForUser(req.user._id);
    }

    const contract = await Contract.findOne(filters).populate(contractPopulate);

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
    const payload = await normalizeContractPayload(req.body, req.user._id);
    const temporaryAccount =
      payload.status === 'active'
        ? await ensureTenantAccount(payload.tenant, req.user._id, payload.room)
        : null;
    const contract = await Contract.create(payload);
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
    const currentContract = await Contract.findOne(
      ownerFilter(req, { _id: req.params.id, deletedAt: null }),
    );

    if (!currentContract) {
      throw createHttpError(404, 'KhÃ´ng tÃ¬m tháº¥y há»£p Ä‘á»“ng');
    }

    if (
      req.body.room &&
      String(req.body.room) !== String(currentContract.room)
    ) {
      throw createHttpError(
        400,
        'KhÃ´ng thá»ƒ Ä‘á»•i phÃ²ng trá»±c tiáº¿p trong há»£p Ä‘á»“ng Ä‘Ã£ cÃ³. HÃ£y táº¡o há»£p Ä‘á»“ng má»›i.',
        {
          room: 'KhÃ´ng thá»ƒ Ä‘á»•i phÃ²ng trá»±c tiáº¿p trong há»£p Ä‘á»“ng Ä‘Ã£ cÃ³',
        },
      );
    }

    const contract = await Contract.findOneAndUpdate(
      ownerFilter(req, { _id: req.params.id, deletedAt: null }),
      await normalizeContractPayload(req.body, req.user._id, req.params.id),
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
    const contract = await Contract.findOneAndUpdate(
      ownerFilter(req, { _id: req.params.id, deletedAt: null }),
      { deletedAt: new Date() },
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
      message: 'Xóa hợp đồng thành công',
    });
  } catch (error) {
    next(error);
  }
}

export async function endContract(req, res, next) {
  try {
    const contract = await Contract.findOneAndUpdate(
      ownerFilter(req, { _id: req.params.id, deletedAt: null }),
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

export async function restoreContract(req, res, next) {
  try {
    const currentContract = await Contract.findOne(
      ownerFilter(req, { _id: req.params.id, deletedAt: { $ne: null } }),
    );

    if (!currentContract) {
      throw createHttpError(404, 'Không tìm thấy hợp đồng đã xóa');
    }

    if (currentContract.status === 'active') {
      const activeContract = await Contract.findOne({
        owner: req.user._id,
        room: currentContract.room,
        status: 'active',
        deletedAt: null,
        _id: { $ne: currentContract._id },
      });

      if (activeContract) {
        throw createHttpError(400, 'Phòng đã có hợp đồng đang hiệu lực', {
          room: 'Phòng đã có hợp đồng đang hiệu lực',
        });
      }
    }

    currentContract.deletedAt = null;
    await currentContract.save();

    const contract = await Contract.findById(currentContract._id).populate(
      contractPopulate,
    );

    res.json({
      data: contract,
      message: 'Khôi phục hợp đồng thành công',
    });
  } catch (error) {
    next(error);
  }
}
