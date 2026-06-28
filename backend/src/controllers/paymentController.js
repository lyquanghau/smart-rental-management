import { Contract } from '../models/Contract.js';
import { Payment } from '../models/Payment.js';
import { createHttpError } from '../utils/httpError.js';

const paymentPopulate = {
  path: 'contract',
  select: 'room tenant startDate endDate monthlyPrice deposit status',
  populate: [
    { path: 'room', select: 'name floor price maxOccupants status' },
    { path: 'tenant', select: 'fullName phone email identityNumber room' },
  ],
};

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

async function normalizePaymentPayload(body) {
  const dueDate = parseOptionalDate(body.dueDate);
  const paidAt = parseOptionalDate(body.paidAt);
  const amount = Number(body.amount);

  if (!dueDate) {
    throw createHttpError(400, 'Due date is invalid', {
      dueDate: 'Due date must be a valid date',
    });
  }

  if (body.paidAt && !paidAt) {
    throw createHttpError(400, 'Paid date is invalid', {
      paidAt: 'Paid date must be a valid date',
    });
  }

  const contract = await Contract.findById(body.contract);

  if (!contract) {
    throw createHttpError(400, 'Contract does not exist', {
      contract: 'Contract does not exist',
    });
  }

  return {
    contract: body.contract,
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

    const dueDateRange = monthDateRange(month, year);
    if (dueDateRange) filters.dueDate = dueDateRange;

    const [payments, total] = await Promise.all([
      Payment.find(filters)
        .populate(paymentPopulate)
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
    const payment = await Payment.findById(req.params.id).populate(
      paymentPopulate,
    );

    if (!payment) {
      throw createHttpError(404, 'Payment not found');
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
    const populatedPayment = await payment.populate(paymentPopulate);

    res.status(201).json({
      data: populatedPayment,
      message: 'Payment created successfully',
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
    ).populate(paymentPopulate);

    if (!payment) {
      throw createHttpError(404, 'Payment not found');
    }

    res.json({
      data: payment,
      message: 'Payment updated successfully',
    });
  } catch (error) {
    next(error);
  }
}

export async function markPaymentPaid(req, res, next) {
  try {
    const paidAt = parseOptionalDate(req.body.paidAt) || new Date();
    const update = {
      paidAt,
      status: 'paid',
    };

    if (req.body.method) update.method = req.body.method;
    if (req.body.note !== undefined) update.note = req.body.note;

    const payment = await Payment.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    }).populate(paymentPopulate);

    if (!payment) {
      throw createHttpError(404, 'Payment not found');
    }

    res.json({
      data: payment,
      message: 'Payment marked as paid successfully',
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
    }).populate(paymentPopulate);

    if (!payment) {
      throw createHttpError(404, 'Payment not found');
    }

    res.json({
      data: payment,
      message: 'Payment cancelled successfully',
    });
  } catch (error) {
    next(error);
  }
}
