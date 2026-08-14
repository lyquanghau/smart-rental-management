import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import PDFDocument from 'pdfkit';
import { Contract } from '../models/Contract.js';
import { Invoice } from '../models/Invoice.js';
import { Payment } from '../models/Payment.js';
import { ServiceSetting } from '../models/ServiceSetting.js';
import { UtilityReading } from '../models/UtilityReading.js';
import { syncOverdueBillingStatuses } from '../utils/billingStatus.js';
import { createHttpError } from '../utils/httpError.js';
import { getTenantIdForUser, ownerFilter } from '../utils/ownership.js';

const invoicePopulate = [
  { path: 'room', select: 'name floor price maxOccupants status' },
  { path: 'tenant', select: 'fullName phone email identityNumber' },
  {
    path: 'contract',
    select: 'room tenant startDate endDate monthlyPrice status occupants',
  },
  { path: 'utilityReading' },
];

const bundledFontPaths = {
  bold: fileURLToPath(
    new URL('../assets/fonts/NotoSans-Bold.ttf', import.meta.url),
  ),
  regular: fileURLToPath(
    new URL('../assets/fonts/NotoSans-Regular.ttf', import.meta.url),
  ),
};

const vietnameseFontPaths = {
  bold: [
    bundledFontPaths.bold,
    'C:/Windows/Fonts/arialbd.ttf',
    '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
    '/usr/share/fonts/truetype/liberation2/LiberationSans-Bold.ttf',
    '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf',
  ],
  regular: [
    bundledFontPaths.regular,
    'C:/Windows/Fonts/arial.ttf',
    '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
    '/usr/share/fonts/truetype/liberation2/LiberationSans-Regular.ttf',
    '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf',
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

function registerPdfFonts(document) {
  const fontPaths = getVietnameseFontPaths();
  const fonts = {
    bold: 'Helvetica-Bold',
    regular: 'Helvetica',
  };

  if (fontPaths.regular) {
    document.registerFont('VietnameseRegular', fontPaths.regular);
    fonts.regular = 'VietnameseRegular';
  }

  if (fontPaths.bold) {
    document.registerFont('VietnameseBold', fontPaths.bold);
    fonts.bold = 'VietnameseBold';
  }

  return fonts;
}

function normalizeMonthYear(month, year) {
  const safeMonth = Number(month);
  const safeYear = Number(year);

  if (!safeMonth || !safeYear || safeMonth < 1 || safeMonth > 12) {
    throw createHttpError(400, 'Tháng/năm không hợp lệ', {
      month: 'Tháng phải từ 1 đến 12',
      year: 'Năm là bắt buộc',
    });
  }

  return { month: safeMonth, year: safeYear };
}

function parseDueDate(value) {
  const dueDate = value ? new Date(value) : null;

  if (!dueDate || Number.isNaN(dueDate.getTime())) {
    throw createHttpError(400, 'Hạn thanh toán không hợp lệ', {
      dueDate: 'Hạn thanh toán phải là ngày hợp lệ',
    });
  }

  return dueDate;
}

function buildInvoiceItems(contract, reading) {
  const items = [
    {
      name: 'Tiền phòng',
      quantity: 1,
      unitPrice: contract.monthlyPrice,
      amount: contract.monthlyPrice,
    },
  ];

  if (!reading) return items;

  items.push(
    {
      name: 'Điện',
      quantity: reading.electricityUsage,
      unitPrice:
        reading.electricityUsage > 0
          ? reading.electricityAmount / reading.electricityUsage
          : 0,
      amount: reading.electricityAmount,
    },
    {
      name: 'Nước',
      quantity: reading.waterUsage,
      unitPrice:
        reading.waterUsage > 0 ? reading.waterAmount / reading.waterUsage : 0,
      amount: reading.waterAmount,
    },
    {
      name: 'Internet',
      quantity: 1,
      unitPrice: reading.internetAmount,
      amount: reading.internetAmount,
    },
    {
      name: 'Rác',
      quantity: 1,
      unitPrice: reading.trashAmount,
      amount: reading.trashAmount,
    },
    {
      name: 'Gửi xe',
      quantity: reading.parkingVehicleCount,
      unitPrice:
        reading.parkingVehicleCount > 0
          ? reading.parkingAmount / reading.parkingVehicleCount
          : 0,
      amount: reading.parkingAmount,
    },
  );

  return items;
}

function formatDate(value) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('vi-VN').format(new Date(value));
}

function formatMoney(value) {
  return `${Number(value || 0).toLocaleString('vi-VN')} VND`;
}

function formatInvoiceStatus(status) {
  const labels = {
    cancelled: 'Đã hủy',
    draft: 'Bản nháp',
    issued: 'Đã phát hành',
    overdue: 'Quá hạn',
    paid: 'Đã thanh toán',
  };

  return labels[status] || 'Chờ thanh toán';
}

function formatInvoiceCode(invoice) {
  return `INV-${invoice.year}-${String(invoice.month).padStart(2, '0')}-${String(
    invoice._id,
  )
    .slice(-6)
    .toUpperCase()}`;
}

function buildTransferContent(setting, invoice) {
  const template =
    setting?.transferContentTemplate ||
    'Thanh toan phong {room} thang {month}-{year}';

  return template
    .replaceAll('{room}', invoice.room?.name || 'N/A')
    .replaceAll('{month}', String(invoice.month || ''))
    .replaceAll('{year}', String(invoice.year || ''));
}

const vietnameseNumberWords = [
  'khong',
  'mot',
  'hai',
  'ba',
  'bon',
  'nam',
  'sau',
  'bay',
  'tam',
  'chin',
];

function readThreeDigits(value, hasHigherGroup = false) {
  const hundred = Math.floor(value / 100);
  const ten = Math.floor((value % 100) / 10);
  const unit = value % 10;
  const parts = [];

  if (hundred > 0) {
    parts.push(`${vietnameseNumberWords[hundred]} tram`);
  } else if (hasHigherGroup && (ten > 0 || unit > 0)) {
    parts.push('khong tram');
  }

  if (ten > 1) {
    parts.push(`${vietnameseNumberWords[ten]} muoi`);
    if (unit === 1) parts.push('mot');
    else if (unit === 5) parts.push('lam');
    else if (unit > 0) parts.push(vietnameseNumberWords[unit]);
  } else if (ten === 1) {
    parts.push('muoi');
    if (unit === 5) parts.push('lam');
    else if (unit > 0) parts.push(vietnameseNumberWords[unit]);
  } else if (unit > 0) {
    if (hasHigherGroup && hundred > 0) parts.push('le');
    parts.push(vietnameseNumberWords[unit]);
  }

  return parts.join(' ');
}

function formatMoneyInWords(value) {
  const amount = Math.round(Number(value || 0));
  if (amount === 0) return 'Khong dong';

  const units = ['', 'nghin', 'trieu', 'ty'];
  const groups = [];
  let remaining = amount;

  while (remaining > 0) {
    groups.push(remaining % 1000);
    remaining = Math.floor(remaining / 1000);
  }

  const words = [];
  for (let index = groups.length - 1; index >= 0; index -= 1) {
    const group = groups[index];
    if (group === 0) continue;
    const text = readThreeDigits(group, index < groups.length - 1);
    words.push(`${text}${units[index] ? ` ${units[index]}` : ''}`);
  }

  const result = words.join(' ').trim();
  return `${result.charAt(0).toUpperCase()}${result.slice(1)} dong`;
}

function getInvoiceItemAmount(invoice, keywords) {
  const normalizedKeywords = keywords.map((keyword) => keyword.toLowerCase());
  const item = (invoice.items || []).find((current) =>
    normalizedKeywords.some((keyword) =>
      String(current.name || '')
        .toLowerCase()
        .includes(keyword),
    ),
  );

  return Number(item?.amount || 0);
}

function getOccupantCount(invoice) {
  return 1 + (invoice.contract?.occupants?.length || 0);
}

function buildMonthlyInvoiceRows(invoice, setting) {
  const reading = invoice.utilityReading;
  const electricityUsage = Number(reading?.electricityUsage || 0);
  const waterUsage = Number(reading?.waterUsage || 0);
  const parkingVehicleCount = Number(reading?.parkingVehicleCount || 0);
  const internetAmount =
    reading?.internetAmount || getInvoiceItemAmount(invoice, ['internet']);
  const trashAmount =
    reading?.trashAmount || getInvoiceItemAmount(invoice, ['rac', 'rác']);
  const parkingAmount =
    reading?.parkingAmount ||
    getInvoiceItemAmount(invoice, ['gui xe', 'gửi xe']);
  const electricityAmount =
    reading?.electricityAmount ||
    getInvoiceItemAmount(invoice, ['dien', 'điện']);
  const waterAmount =
    reading?.waterAmount || getInvoiceItemAmount(invoice, ['nuoc', 'nước']);
  const knownServiceAmount =
    Number(electricityAmount || 0) +
    Number(waterAmount || 0) +
    Number(internetAmount || 0) +
    Number(trashAmount || 0) +
    Number(parkingAmount || 0);
  const otherAmount = Math.max(
    Number(invoice.serviceAmount || 0) - knownServiceAmount,
    0,
  );

  const rows = [
    {
      amount: invoice.rentAmount,
      label: 'Tiền phòng',
      quantity: '1 tháng',
      unitPrice: invoice.rentAmount,
    },
  ];

  rows.push({
    amount: electricityAmount,
    label: 'Điện',
    quantity: reading
      ? `${reading.electricityPrevious || 0} -> ${reading.electricityCurrent || 0} (${electricityUsage} kWh)`
      : `${electricityUsage} kWh`,
    unitPrice:
      setting?.electricityUnitPrice ||
      (electricityUsage > 0 ? electricityAmount / electricityUsage : 0),
  });

  rows.push({
    amount: waterAmount,
    label: 'Nước',
    quantity: reading
      ? `${reading.waterPrevious || 0} -> ${reading.waterCurrent || 0} (${waterUsage} m3)`
      : `${waterUsage} m3`,
    unitPrice:
      setting?.waterUnitPrice ||
      (waterUsage > 0 ? waterAmount / waterUsage : 0),
  });

  rows.push({
    amount: internetAmount,
    label: 'Internet',
    quantity: '1 tháng',
    unitPrice: setting?.internetFee || internetAmount,
  });

  rows.push({
    amount: trashAmount,
    label: 'Rác',
    quantity: '1 tháng',
    unitPrice: setting?.trashFee || trashAmount,
  });

  rows.push({
    amount: parkingAmount,
    label: 'Gửi xe',
    quantity: `${parkingVehicleCount} xe`,
    unitPrice:
      setting?.parkingFeePerVehicle ||
      (parkingVehicleCount > 0 ? parkingAmount / parkingVehicleCount : 0),
  });

  if (otherAmount > 0) {
    rows.push({
      amount: otherAmount,
      label: 'Chi phí khác',
      quantity: '-',
      unitPrice: otherAmount,
    });
  }

  return rows;
}

async function getInvoiceForUser(req) {
  const filters =
    req.user.role === 'landlord'
      ? ownerFilter(req, { _id: req.params.id })
      : { _id: req.params.id };

  if (req.user.role === 'tenant') {
    filters.tenant = await getTenantIdForUser(req.user._id);
  }

  const invoice = await Invoice.findOne(filters).populate(invoicePopulate);

  if (!invoice) {
    throw createHttpError(404, 'Khong tim thay hoa don');
  }

  return invoice;
}

function buildInvoicePdf(invoice, setting, res) {
  const document = new PDFDocument({
    margin: 44,
    size: 'A4',
    info: {
      Title: `Hoa don ${formatInvoiceCode(invoice)}`,
      Author: 'Smart Rental',
    },
  });

  document.pipe(res);
  const fonts = registerPdfFonts(document);
  const pageWidth =
    document.page.width -
    document.page.margins.left -
    document.page.margins.right;
  const left = document.page.margins.left;
  const right = document.page.width - document.page.margins.right;
  const roomName = invoice.room?.name || 'N/A';
  const occupantCount = getOccupantCount(invoice);

  document
    .font(fonts.bold)
    .fillColor('#111827')
    .fontSize(17)
    .text('HÓA ĐƠN TIỀN PHÒNG HÀNG THÁNG', { align: 'center' });
  document
    .font(fonts.regular)
    .fontSize(10.5)
    .fillColor('#4b5563')
    .text(`Kỳ hóa đơn: tháng ${invoice.month}/${invoice.year}`, {
      align: 'center',
    });
  document.moveDown(1);

  const summaryTop = document.y;
  document
    .roundedRect(left, summaryTop, pageWidth, 96, 8)
    .fillAndStroke('#f8fafc', '#dbeafe');

  const summaryRows = [
    ['Mã hóa đơn', formatInvoiceCode(invoice), 'Mã phòng', roomName],
    [
      'Khách thuê',
      invoice.tenant?.fullName || 'N/A',
      'Số người ở',
      occupantCount,
    ],
    [
      'Hạn thanh toán',
      formatDate(invoice.dueDate),
      'Trạng thái',
      formatInvoiceStatus(invoice.status),
    ],
  ];

  let summaryY = summaryTop + 15;
  for (const [leftLabel, leftValue, rightLabel, rightValue] of summaryRows) {
    document.font(fonts.regular).fontSize(9.5).fillColor('#64748b');
    document.text(leftLabel, left + 16, summaryY, { width: 92 });
    document.text(rightLabel, left + 302, summaryY, { width: 92 });
    document.font(fonts.bold).fontSize(10.5).fillColor('#111827');
    document.text(String(leftValue || '-'), left + 108, summaryY, {
      width: 180,
    });
    document.text(String(rightValue || '-'), left + 394, summaryY, {
      width: 120,
    });
    summaryY += 25;
  }

  document.y = summaryTop + 118;
  document.font(fonts.bold).fontSize(12).fillColor('#111827');
  document.text('Chi tiết tiền phòng và dịch vụ');
  document.moveDown(0.5);

  const rows = buildMonthlyInvoiceRows(invoice, setting);
  const columns = [
    { key: 'label', label: 'Khoản thu', width: 130, x: left },
    { key: 'unitPrice', label: 'Đơn giá', width: 110, x: left + 130 },
    { key: 'quantity', label: 'SL / Chỉ số', width: 180, x: left + 240 },
    { key: 'amount', label: 'Thành tiền', width: 87, x: left + 420 },
  ];
  const tableTop = document.y;
  const rowHeight = 31;

  document
    .rect(left, tableTop, pageWidth, 28)
    .fillAndStroke('#e0f2fe', '#93c5fd');
  document.font(fonts.bold).fontSize(9.5).fillColor('#0f172a');
  for (const column of columns) {
    document.text(column.label, column.x + 8, tableTop + 9, {
      align: column.key === 'amount' ? 'right' : 'left',
      width: column.width - 14,
    });
  }

  let rowY = tableTop + 28;
  for (const [index, row] of rows.entries()) {
    const background = index % 2 === 0 ? '#ffffff' : '#f8fafc';
    document
      .rect(left, rowY, pageWidth, rowHeight)
      .fillAndStroke(background, '#e5e7eb');
    document.font(fonts.regular).fontSize(9.5).fillColor('#111827');
    document.text(row.label, columns[0].x + 8, rowY + 10, {
      width: columns[0].width - 14,
    });
    document.text(formatMoney(row.unitPrice), columns[1].x + 8, rowY + 10, {
      align: 'right',
      width: columns[1].width - 14,
    });
    document.text(row.quantity, columns[2].x + 8, rowY + 10, {
      width: columns[2].width - 14,
    });
    document
      .font(fonts.bold)
      .text(formatMoney(row.amount), columns[3].x + 8, rowY + 10, {
        align: 'right',
        width: columns[3].width - 14,
      });
    rowY += rowHeight;
  }

  document
    .rect(left + 300, rowY + 8, pageWidth - 300, 44)
    .fillAndStroke('#ecfdf5', '#86efac');
  document.font(fonts.regular).fontSize(10).fillColor('#065f46');
  document.text('Tổng tiền cần thanh toán', left + 314, rowY + 17, {
    width: 120,
  });
  document.font(fonts.bold).fontSize(13).fillColor('#064e3b');
  document.text(formatMoney(invoice.totalAmount), left + 430, rowY + 15, {
    align: 'right',
    width: 105,
  });

  document.y = rowY + 70;
  document.font(fonts.regular).fontSize(10.5).fillColor('#111827');
  document.text(`Bằng chữ: ${formatMoneyInWords(invoice.totalAmount)}`);
  document.moveDown(0.4);
  document.text(
    `Nội dung chuyển khoản: ${
      invoice.paymentOrderId || buildTransferContent(setting, invoice)
    }`,
  );

  document.moveDown(2.4);
  const signatureY = Math.max(document.y, 670);
  document.font(fonts.bold).fontSize(10.5).fillColor('#111827');
  document.text('ĐẠI DIỆN BÊN THUÊ', left + 28, signatureY, {
    align: 'center',
    width: 180,
  });
  document.text('ĐẠI DIỆN BÊN CHO THUÊ', right - 208, signatureY, {
    align: 'center',
    width: 180,
  });
  document.font(fonts.regular).fontSize(9).fillColor('#4b5563');
  document.text('(Ký và ghi rõ họ tên)', left + 28, signatureY + 18, {
    align: 'center',
    width: 180,
  });
  document.text('(Ký và ghi rõ họ tên)', right - 208, signatureY + 18, {
    align: 'center',
    width: 180,
  });

  document.end();
}

async function syncPaymentForInvoice(invoice) {
  const existingPayment = await Payment.findOne({
    owner: invoice.owner,
    invoice: invoice._id,
  });
  const contractId = invoice.contract?._id || invoice.contract;

  if (existingPayment?.status === 'paid') return existingPayment;

  return Payment.findOneAndUpdate(
    { owner: invoice.owner, invoice: invoice._id },
    {
      $set: {
        owner: invoice.owner,
        invoice: invoice._id,
        contract: contractId,
        amount: invoice.totalAmount,
        dueDate: invoice.dueDate,
        method: 'cash',
        status: invoice.status === 'cancelled' ? 'cancelled' : 'pending',
        note: `Hoa don thang ${invoice.month}/${invoice.year}`,
      },
    },
    { new: true, runValidators: true, upsert: true },
  );
}

export async function listInvoices(req, res, next) {
  try {
    const { contract, month, status, year } = req.query;
    const filters = req.user.role === 'landlord' ? ownerFilter(req) : {};

    if (contract) filters.contract = contract;
    if (status) filters.status = status;

    if (req.user.role === 'tenant') {
      const tenantId = await getTenantIdForUser(req.user._id);
      await syncOverdueBillingStatuses({ tenant: tenantId });
      filters.tenant = tenantId;
    } else {
      await syncOverdueBillingStatuses({ owner: req.user._id });
    }

    if (month || year) {
      const normalized = normalizeMonthYear(month, year);
      filters.month = normalized.month;
      filters.year = normalized.year;
    }

    const invoices = await Invoice.find(filters)
      .populate(invoicePopulate)
      .sort({ year: -1, month: -1, dueDate: -1 });

    res.json({ data: invoices });
  } catch (error) {
    next(error);
  }
}

export async function getInvoice(req, res, next) {
  try {
    const filters =
      req.user.role === 'landlord'
        ? ownerFilter(req, { _id: req.params.id })
        : { _id: req.params.id };

    if (req.user.role === 'tenant') {
      const tenantId = await getTenantIdForUser(req.user._id);
      await syncOverdueBillingStatuses({ tenant: tenantId });
      filters.tenant = tenantId;
    } else {
      await syncOverdueBillingStatuses({ owner: req.user._id });
    }

    const invoice = await Invoice.findOne(filters).populate(invoicePopulate);

    if (!invoice) {
      throw createHttpError(404, 'Không tìm thấy hóa đơn');
    }

    res.json({ data: invoice });
  } catch (error) {
    next(error);
  }
}

export async function downloadInvoicePdf(req, res, next) {
  try {
    const invoice = await getInvoiceForUser(req);
    const setting = await ServiceSetting.findOne({ owner: invoice.owner }).sort(
      {
        createdAt: 1,
      },
    );
    const filename = `hoa-don-${invoice.room?.name || 'phong'}-${invoice.month}-${invoice.year}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    buildInvoicePdf(invoice, setting, res);
  } catch (error) {
    next(error);
  }
}

export async function generateMonthlyInvoices(req, res, next) {
  try {
    const { month, year } = normalizeMonthYear(req.body.month, req.body.year);
    const dueDate = parseDueDate(req.body.dueDate);
    const activeContracts = await Contract.find(
      ownerFilter(req, { deletedAt: null, status: 'active' }),
    );
    const results = [];

    for (const contract of activeContracts) {
      const existingInvoice = await Invoice.findOne({
        owner: req.user._id,
        contract: contract._id,
        month,
        year,
      });

      if (existingInvoice) {
        results.push({
          contract: contract._id,
          status: 'skipped',
          reason: 'Hóa đơn tháng đã tồn tại',
        });
        continue;
      }

      const reading = await UtilityReading.findOne({
        owner: req.user._id,
        contract: contract._id,
        month,
        year,
      });
      const serviceAmount = reading?.serviceTotal || 0;
      const totalAmount = contract.monthlyPrice + serviceAmount;
      const invoice = await Invoice.create({
        owner: req.user._id,
        contract: contract._id,
        room: contract.room,
        tenant: contract.tenant,
        utilityReading: reading?._id,
        month,
        year,
        dueDate,
        rentAmount: contract.monthlyPrice,
        serviceAmount,
        totalAmount,
        status: 'issued',
        items: buildInvoiceItems(contract, reading),
        note: req.body.note || '',
      });

      await syncPaymentForInvoice(invoice);
      results.push({ invoice: invoice._id, status: 'created' });
    }

    const invoices = await Invoice.find(ownerFilter(req, { month, year }))
      .populate(invoicePopulate)
      .sort({ year: -1, month: -1, dueDate: -1 });

    res.status(201).json({
      data: {
        results,
        invoices,
      },
      message: 'Tạo hóa đơn tháng hoàn tất',
    });
  } catch (error) {
    next(error);
  }
}

export async function markInvoicePaid(req, res, next) {
  try {
    const paidAt = req.body.paidAt ? new Date(req.body.paidAt) : new Date();

    if (Number.isNaN(paidAt.getTime())) {
      throw createHttpError(400, 'Ngày thu không hợp lệ', {
        paidAt: 'Ngày thu phải là ngày hợp lệ',
      });
    }

    const invoice = await Invoice.findOneAndUpdate(
      ownerFilter(req, { _id: req.params.id }),
      { status: 'paid', paidAt },
      { new: true, runValidators: true },
    ).populate(invoicePopulate);

    if (!invoice) {
      throw createHttpError(404, 'Không tìm thấy hóa đơn');
    }

    await Payment.findOneAndUpdate(
      { owner: req.user._id, invoice: invoice._id },
      {
        $set: {
          owner: req.user._id,
          invoice: invoice._id,
          contract: invoice.contract?._id || invoice.contract,
          amount: invoice.totalAmount,
          dueDate: invoice.dueDate,
          paidAt,
          method: req.body.method || 'cash',
          status: 'paid',
          note:
            req.body.note || `Hoa don thang ${invoice.month}/${invoice.year}`,
        },
      },
      { new: true, runValidators: true, upsert: true },
    );

    res.json({ data: invoice, message: 'Đánh dấu hóa đơn đã thu thành công' });
  } catch (error) {
    next(error);
  }
}

export async function cancelInvoice(req, res, next) {
  try {
    const invoice = await Invoice.findOneAndUpdate(
      ownerFilter(req, { _id: req.params.id }),
      { status: 'cancelled', note: req.body.note || '' },
      { new: true, runValidators: true },
    ).populate(invoicePopulate);

    if (!invoice) {
      throw createHttpError(404, 'Không tìm thấy hóa đơn');
    }

    await Payment.findOneAndUpdate(
      { owner: req.user._id, invoice: invoice._id },
      { $set: { status: 'cancelled', note: invoice.note } },
      { new: true, runValidators: true },
    );

    res.json({ data: invoice, message: 'Hủy hóa đơn thành công' });
  } catch (error) {
    next(error);
  }
}
