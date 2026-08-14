import { existsSync } from 'node:fs';
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
    select: 'room tenant startDate endDate monthlyPrice status',
  },
  { path: 'utilityReading' },
];

const vietnameseFontPaths = [
  'C:/Windows/Fonts/arial.ttf',
  '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
  '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf',
];

function getVietnameseFontPath() {
  return vietnameseFontPaths.find((fontPath) => existsSync(fontPath));
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

function buildInvoiceCostRows(invoice) {
  const electricityAmount =
    invoice.utilityReading?.electricityAmount ||
    getInvoiceItemAmount(invoice, ['dien', 'điện']);
  const waterAmount =
    invoice.utilityReading?.waterAmount ||
    getInvoiceItemAmount(invoice, ['nuoc', 'nước']);
  const otherAmount = Math.max(
    Number(invoice.serviceAmount || 0) -
      Number(electricityAmount || 0) -
      Number(waterAmount || 0),
    0,
  );

  const rows = [
    {
      amount: invoice.rentAmount,
      label: 'Tien tro co ban',
      note: `Phong ${invoice.room?.name || 'N/A'}`,
    },
  ];

  if (invoice.utilityReading) {
    rows.push(
      {
        amount: electricityAmount,
        label: 'Tien dien',
        note: `${invoice.utilityReading.electricityPrevious || 0} -> ${invoice.utilityReading.electricityCurrent || 0} (${invoice.utilityReading.electricityUsage || 0} kWh)`,
      },
      {
        amount: waterAmount,
        label: 'Tien nuoc',
        note: `${invoice.utilityReading.waterPrevious || 0} -> ${invoice.utilityReading.waterCurrent || 0} (${invoice.utilityReading.waterUsage || 0} m3)`,
      },
    );
  } else {
    if (electricityAmount > 0) {
      rows.push({ amount: electricityAmount, label: 'Tien dien', note: '-' });
    }
    if (waterAmount > 0) {
      rows.push({ amount: waterAmount, label: 'Tien nuoc', note: '-' });
    }
  }

  if (otherAmount > 0) {
    rows.push({ amount: otherAmount, label: 'Chi phi khac', note: '-' });
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
    margin: 48,
    size: 'A4',
    info: {
      Title: `Hoa don ${formatInvoiceCode(invoice)}`,
      Author: 'Smart Rental',
    },
  });
  const vietnameseFontPath = getVietnameseFontPath();

  document.pipe(res);

  if (vietnameseFontPath) {
    document.registerFont('Vietnamese', vietnameseFontPath);
    document.font('Vietnamese');
  }

  document.fillColor('#111827').fontSize(18).text('PHIEU THU TIEN THUE NHA', {
    align: 'center',
  });
  document.moveDown(0.7);
  document
    .fontSize(12)
    .text(`Thoi gian: ${invoice.month}/${invoice.year}`, { align: 'center' });
  document.moveDown(1.2);

  const address =
    setting?.rentalAddress ||
    setting?.bankAccountName ||
    '........................................................';
  document.fontSize(11.5);
  document.text(`Dia chi nha cho thue: ${address}`);
  document.moveDown(0.6);
  document.text(`So phong: ${invoice.room?.name || 'N/A'}`);
  document.moveDown(0.6);
  document.text(`Ho va ten nguoi thue: ${invoice.tenant?.fullName || 'N/A'}`);
  document.moveDown(0.6);
  document.text(
    `Noi dung: Thanh toan tien thue nha thang ${invoice.month} nam ${invoice.year}`,
  );
  document.moveDown(0.8);

  const rows = buildInvoiceCostRows(invoice);
  const tableTop = document.y;
  document.rect(48, tableTop, 499, 26).stroke('#111827');
  document.text('Khoan thu', 58, tableTop + 8, { width: 190 });
  document.text('Thong tin', 250, tableTop + 8, { width: 150 });
  document.text('Thanh tien', 410, tableTop + 8, {
    align: 'right',
    width: 120,
  });

  let rowY = tableTop + 26;
  for (const row of rows) {
    document.rect(48, rowY, 499, 28).stroke('#d1d5db');
    document.text(row.label, 58, rowY + 8, { width: 180 });
    document.text(row.note, 250, rowY + 8, { width: 150 });
    document.text(formatMoney(row.amount), 410, rowY + 8, {
      align: 'right',
      width: 120,
    });
    rowY += 28;
  }

  rowY += 12;
  document.fontSize(12).text(`So tien: ${formatMoney(invoice.totalAmount)}`, {
    continued: false,
  });
  document.moveDown(0.5);
  document
    .fontSize(11.5)
    .text(`Bang chu: ${formatMoneyInWords(invoice.totalAmount)}`);
  document.moveDown(0.5);
  document.text(`Ma hoa don: ${formatInvoiceCode(invoice)}`);
  document.text(`Han thanh toan: ${formatDate(invoice.dueDate)}`);
  if (invoice.paymentOrderId) {
    document.text(`Noi dung chuyen khoan: ${invoice.paymentOrderId}`);
  } else if (setting) {
    document.text(
      `Noi dung chuyen khoan: ${buildTransferContent(setting, invoice)}`,
    );
  }

  document.moveDown(3);
  const signatureY = document.y;
  document.fontSize(12);
  document.text('DAI DIEN BEN THUE', 70, signatureY, {
    align: 'center',
    width: 180,
  });
  document.fontSize(10).text('(ki, ghi ro ho va ten)', 70, signatureY + 20, {
    align: 'center',
    width: 180,
  });
  document.fontSize(12).text('DAI DIEN BEN CHO THUE', 345, signatureY, {
    align: 'center',
    width: 180,
  });
  document.fontSize(10).text('(ki, ghi ro ho va ten)', 345, signatureY + 20, {
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
