import { Contract } from '../models/Contract.js';
import { Invoice } from '../models/Invoice.js';
import { Payment } from '../models/Payment.js';
import { Tenant } from '../models/Tenant.js';
import { createHttpError } from '../utils/httpError.js';

const paymentPopulate = {
  path: 'contract',
  select: 'room tenant startDate endDate monthlyPrice deposit status',
  populate: [
    { path: 'room', select: 'name floor price maxOccupants status' },
    { path: 'tenant', select: 'fullName phone email identityNumber room' },
  ],
};

const populateOptions = [
  paymentPopulate,
  {
    path: 'invoice',
    select:
      'month year dueDate rentAmount serviceAmount totalAmount status items utilityReading',
    populate: { path: 'utilityReading' },
  },
];

function parseOptionalDate(value) {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return date;
}

function monthDateRange(month, year) {
  const safeMonth = Number(month);
  const safeYear = Number(year);

  if (!safeMonth || !safeYear || safeMonth < 1 || safeMonth > 12) {
    return null;
  }

  return {
    $gte: new Date(safeYear, safeMonth - 1, 1),
    $lt: new Date(safeYear, safeMonth, 1),
  };
}

function assertValidAmount(amount) {
  if (!Number.isFinite(amount) || amount < 0) {
    throw createHttpError(400, 'Số tiền không hợp lệ', {
      amount: 'Số tiền phải là số lớn hơn hoặc bằng 0',
    });
  }
}

async function getTenantContractIdsForUser(userId) {
  const tenant = await Tenant.findOne({ user: userId, deletedAt: null }).select(
    '_id',
  );

  if (!tenant) {
    throw createHttpError(
      404,
      'Khong tim thay ho so khach thue lien ket voi tai khoan nay',
    );
  }

  const contracts = await Contract.find({ tenant: tenant._id }).select('_id');
  return contracts.map((item) => item._id);
}

async function normalizePaymentPayload(body) {
  const dueDate = parseOptionalDate(body.dueDate);
  const paidAt = parseOptionalDate(body.paidAt);
  const amount = Number(body.amount);

  assertValidAmount(amount);

  if (!dueDate) {
    throw createHttpError(400, 'Hạn thanh toán không hợp lệ', {
      dueDate: 'Hạn thanh toán phải là ngày hợp lệ',
    });
  }

  if (body.paidAt && !paidAt) {
    throw createHttpError(400, 'Ngày thu không hợp lệ', {
      paidAt: 'Ngày thu phải là ngày hợp lệ',
    });
  }

  const contract = await Contract.findById(body.contract);

  if (!contract) {
    throw createHttpError(400, 'Hợp đồng không tồn tại', {
      contract: 'Hợp đồng không tồn tại',
    });
  }

  if (contract.status !== 'active') {
    throw createHttpError(400, 'Hợp đồng không còn hiệu lực', {
      contract: 'Chỉ được tạo khoản thu cho hợp đồng đang hiệu lực',
    });
  }

  return {
    contract: body.contract,
    invoice: body.invoice || undefined,
    amount,
    dueDate,
    paidAt: paidAt || undefined,
    method: body.method || 'cash',
    status: body.status || 'pending',
    note: body.note || '',
  };
}

export async function listPayments(req, res, next) {
  try {
    const {
      contract,
      method,
      month,
      page = 1,
      limit = 20,
      status,
      year,
    } = req.query;
    const filters = {};
    const safePage = Math.max(Number(page) || 1, 1);
    const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);

    if (contract) filters.contract = contract;
    if (method) filters.method = method;
    if (status) filters.status = status;

    if (req.user.role === 'tenant') {
      filters.contract = {
        $in: await getTenantContractIdsForUser(req.user._id),
      };
    }

    const dueDateRange = monthDateRange(month, year);
    if (dueDateRange) filters.dueDate = dueDateRange;

    const [payments, total] = await Promise.all([
      Payment.find(filters)
        .populate(populateOptions)
        .sort({ dueDate: -1, createdAt: -1 })
        .skip((safePage - 1) * safeLimit)
        .limit(safeLimit),
      Payment.countDocuments(filters),
    ]);

    res.json({
      data: payments,
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

export async function getPayment(req, res, next) {
  try {
    const filters = { _id: req.params.id };

    if (req.user.role === 'tenant') {
      filters.contract = {
        $in: await getTenantContractIdsForUser(req.user._id),
      };
    }

    const payment = await Payment.findOne(filters).populate(populateOptions);

    if (!payment) {
      throw createHttpError(404, 'Không tìm thấy khoản thu');
    }

    res.json({ data: payment });
  } catch (error) {
    next(error);
  }
}

export async function createPayment(req, res, next) {
  try {
    const payment = await Payment.create(
      await normalizePaymentPayload(req.body),
    );
    const populatedPayment = await payment.populate(populateOptions);

    res.status(201).json({
      data: populatedPayment,
      message: 'Tạo khoản thu thành công',
    });
  } catch (error) {
    next(error);
  }
}

export async function updatePayment(req, res, next) {
  try {
    const payment = await Payment.findByIdAndUpdate(
      req.params.id,
      await normalizePaymentPayload(req.body),
      {
        new: true,
        runValidators: true,
      },
    ).populate(populateOptions);

    if (!payment) {
      throw createHttpError(404, 'Không tìm thấy khoản thu');
    }

    res.json({
      data: payment,
      message: 'Cập nhật khoản thu thành công',
    });
  } catch (error) {
    next(error);
  }
}

export async function markPaymentPaid(req, res, next) {
  try {
    const paidAt = parseOptionalDate(req.body.paidAt) || new Date();

    if (req.body.paidAt && !parseOptionalDate(req.body.paidAt)) {
      throw createHttpError(400, 'Ngày thu không hợp lệ', {
        paidAt: 'Ngày thu phải là ngày hợp lệ',
      });
    }

    const update = {
      paidAt,
      status: 'paid',
    };

    if (req.body.method) update.method = req.body.method;
    if (req.body.note !== undefined) update.note = req.body.note;

    const payment = await Payment.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    }).populate(populateOptions);

    if (!payment) {
      throw createHttpError(404, 'Không tìm thấy khoản thu');
    }

    if (payment.invoice) {
      await Invoice.findByIdAndUpdate(payment.invoice, {
        paidAt,
        status: 'paid',
      });
    }

    res.json({
      data: payment,
      message: 'Đánh dấu đã thu thành công',
    });
  } catch (error) {
    next(error);
  }
}

export async function cancelPayment(req, res, next) {
  try {
    const update = { status: 'cancelled' };

    if (req.body.note !== undefined) update.note = req.body.note;

    const payment = await Payment.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    }).populate(populateOptions);

    if (!payment) {
      throw createHttpError(404, 'Không tìm thấy khoản thu');
    }

    if (payment.invoice) {
      await Invoice.findByIdAndUpdate(payment.invoice, {
        note: update.note,
        status: 'cancelled',
      });
    }

    res.json({
      data: payment,
      message: 'Hủy khoản thu thành công',
    });
  } catch (error) {
    next(error);
  }
}
