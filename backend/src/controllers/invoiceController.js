import { Contract } from '../models/Contract.js';
import { Invoice } from '../models/Invoice.js';
import { Payment } from '../models/Payment.js';
import { Tenant } from '../models/Tenant.js';
import { UtilityReading } from '../models/UtilityReading.js';
import { createHttpError } from '../utils/httpError.js';

const invoicePopulate = [
  { path: 'room', select: 'name floor price maxOccupants status' },
  { path: 'tenant', select: 'fullName phone email identityNumber' },
  {
    path: 'contract',
    select: 'room tenant startDate endDate monthlyPrice status',
  },
  { path: 'utilityReading' },
];

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

async function getTenantIdForUser(userId) {
  const tenant = await Tenant.findOne({ user: userId, deletedAt: null }).select(
    '_id',
  );

  if (!tenant) {
    throw createHttpError(
      404,
      'Khong tim thay ho so khach thue lien ket voi tai khoan nay',
    );
  }

  return tenant._id;
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

async function syncPaymentForInvoice(invoice) {
  const existingPayment = await Payment.findOne({ invoice: invoice._id });
  const contractId = invoice.contract?._id || invoice.contract;

  if (existingPayment?.status === 'paid') return existingPayment;

  return Payment.findOneAndUpdate(
    { invoice: invoice._id },
    {
      $set: {
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
    const filters = {};

    if (contract) filters.contract = contract;
    if (status) filters.status = status;

    if (req.user.role === 'tenant') {
      filters.tenant = await getTenantIdForUser(req.user._id);
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
    const filters = { _id: req.params.id };

    if (req.user.role === 'tenant') {
      filters.tenant = await getTenantIdForUser(req.user._id);
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

export async function generateMonthlyInvoices(req, res, next) {
  try {
    const { month, year } = normalizeMonthYear(req.body.month, req.body.year);
    const dueDate = parseDueDate(req.body.dueDate);
    const activeContracts = await Contract.find({ status: 'active' });
    const results = [];

    for (const contract of activeContracts) {
      const existingInvoice = await Invoice.findOne({
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
        contract: contract._id,
        month,
        year,
      });
      const serviceAmount = reading?.serviceTotal || 0;
      const totalAmount = contract.monthlyPrice + serviceAmount;
      const invoice = await Invoice.create({
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

    const invoices = await Invoice.find({ month, year }).populate(
      invoicePopulate,
    );

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

    const invoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      { status: 'paid', paidAt },
      { new: true, runValidators: true },
    ).populate(invoicePopulate);

    if (!invoice) {
      throw createHttpError(404, 'Không tìm thấy hóa đơn');
    }

    await Payment.findOneAndUpdate(
      { invoice: invoice._id },
      {
        $set: {
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
    const invoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      { status: 'cancelled', note: req.body.note || '' },
      { new: true, runValidators: true },
    ).populate(invoicePopulate);

    if (!invoice) {
      throw createHttpError(404, 'Không tìm thấy hóa đơn');
    }

    await Payment.findOneAndUpdate(
      { invoice: invoice._id },
      { $set: { status: 'cancelled', note: invoice.note } },
      { new: true, runValidators: true },
    );

    res.json({ data: invoice, message: 'Hủy hóa đơn thành công' });
  } catch (error) {
    next(error);
  }
}
