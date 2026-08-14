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

  document.rect(0, 0, 595.28, 122).fill('#e0f2fe');
  document.rect(0, 0, 595.28, 12).fill('#0284c7');
  document.fillColor('#075985').fontSize(18).text('SMART RENTAL', 48, 54);
  document
    .fillColor('#0f172a')
    .fontSize(18)
    .text('HOA DON TIEN PHONG', 290, 54, { align: 'right', width: 257 });
  document
    .fillColor('#475569')
    .fontSize(10)
    .text(`Ma hoa don: ${formatInvoiceCode(invoice)}`, 290, 80, {
      align: 'right',
      width: 257,
    });

  document.y = 148;
  document.fillColor('#0f172a').fontSize(11);
  document.text(`Phong: ${invoice.room?.name || 'N/A'}`, 48, document.y, {
    width: 170,
  });
  document.text(`Khach thue: ${invoice.tenant?.fullName || 'N/A'}`, 230, 148, {
    width: 180,
  });
  document.text(`Ky: ${invoice.month}/${invoice.year}`, 430, 148, {
    align: 'right',
    width: 117,
  });
  document.moveDown(0.8);
  document
    .fillColor('#475569')
    .fontSize(10)
    .text(`Han thanh toan: ${formatDate(invoice.dueDate)}`)
    .text(`Trang thai: ${invoice.status}`);

  const tableTop = document.y + 22;
  document
    .roundedRect(48, tableTop, 499, 28, 6)
    .fillAndStroke('#f8fafc', '#dbeafe');
  document.fillColor('#0f172a').fontSize(10);
  document.text('Khoan muc', 60, tableTop + 9, { width: 190 });
  document.text('So luong', 260, tableTop + 9, { align: 'right', width: 70 });
  document.text('Don gia', 348, tableTop + 9, { align: 'right', width: 80 });
  document.text('Thanh tien', 438, tableTop + 9, {
    align: 'right',
    width: 92,
  });

  let rowY = tableTop + 34;
  for (const item of invoice.items || []) {
    document
      .roundedRect(48, rowY, 499, 30, 5)
      .fillAndStroke('#ffffff', '#e0ecff');
    document.fillColor('#0f172a').fontSize(9.5);
    document.text(item.name, 60, rowY + 10, { width: 190 });
    document.text(String(item.quantity), 260, rowY + 10, {
      align: 'right',
      width: 70,
    });
    document.text(formatMoney(item.unitPrice), 348, rowY + 10, {
      align: 'right',
      width: 80,
    });
    document.text(formatMoney(item.amount), 438, rowY + 10, {
      align: 'right',
      width: 92,
    });
    rowY += 34;
  }

  rowY += 8;
  document
    .roundedRect(330, rowY, 217, 40, 7)
    .fillAndStroke('#e0f2fe', '#bae6fd');
  document
    .fillColor('#075985')
    .fontSize(10)
    .text('Tong thanh toan', 346, rowY + 9, { width: 90 });
  document.fontSize(12).text(formatMoney(invoice.totalAmount), 438, rowY + 8, {
    align: 'right',
    width: 92,
  });

  rowY += 64;
  document
    .fillColor('#075985')
    .fontSize(12)
    .text('Thong tin chuyen khoan', 48, rowY);
  rowY += 22;
  if (
    setting?.bankName &&
    setting?.bankAccountNumber &&
    setting?.bankAccountName
  ) {
    document.fillColor('#0f172a').fontSize(10);
    document.text(`Ngan hang: ${setting.bankName}`, 48, rowY);
    document.text(`So tai khoan: ${setting.bankAccountNumber}`, 48, rowY + 18);
    document.text(`Chu tai khoan: ${setting.bankAccountName}`, 48, rowY + 36);
    document.text(
      `Noi dung: ${buildTransferContent(setting, invoice)}`,
      48,
      rowY + 54,
      {
        width: 499,
      },
    );
    if (setting.paymentNote) {
      document.fillColor('#475569').text(setting.paymentNote, 48, rowY + 78, {
        lineGap: 2,
        width: 499,
      });
    }
  } else {
    document
      .fillColor('#475569')
      .fontSize(10)
      .text('Chu tro chua cau hinh thong tin chuyen khoan.', 48, rowY);
  }

  document
    .fillColor('#94a3b8')
    .fontSize(8)
    .text(`Smart Rental - ${formatDate(new Date())}`, 48, 804, {
      align: 'center',
      width: 499,
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
