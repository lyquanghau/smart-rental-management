import PDFDocument from 'pdfkit';
import { Contract } from '../models/Contract.js';
import { Room } from '../models/Room.js';
import { Tenant } from '../models/Tenant.js';
import { createHttpError } from '../utils/httpError.js';

const contractPopulate = [
  { path: 'room', select: 'name floor price maxOccupants status' },
  { path: 'tenant', select: 'fullName phone email identityNumber room' },
];

function parseOptionalDate(value) {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return date;
}

function formatDate(value) {
  if (!value) return 'Not set';

  return new Intl.DateTimeFormat('vi-VN').format(new Date(value));
}

function formatMoney(value) {
  return `${Number(value || 0).toLocaleString('vi-VN')} VND`;
}

function formatStatus(status) {
  const statusLabels = {
    active: 'Active',
    ended: 'Ended',
    cancelled: 'Cancelled',
  };

  return statusLabels[status] || 'Unknown';
}

function buildContractPdf(contract, res) {
  const room = contract.room || {};
  const tenant = contract.tenant || {};
  const document = new PDFDocument({ margin: 48, size: 'A4' });

  document.pipe(res);

  document.fontSize(20).text('SMART RENTAL', { align: 'center' });
  document.moveDown(0.4);
  document.fontSize(16).text('RENTAL CONTRACT', { align: 'center' });
  document.moveDown(1.2);

  document.fontSize(11).text(`Contract ID: ${contract._id}`);
  document.text(`Generated at: ${formatDate(new Date())}`);
  document.moveDown();

  document.fontSize(13).text('1. Room information', { underline: true });
  document.moveDown(0.3);
  document.fontSize(11);
  document.text(`Room: ${room.name || 'Not set'}`);
  document.text(`Floor: ${room.floor ?? 'Not set'}`);
  document.text(`Listed price: ${formatMoney(room.price)}`);
  document.text(`Max occupants: ${room.maxOccupants || 2}`);
  document.moveDown();

  document.fontSize(13).text('2. Tenant information', { underline: true });
  document.moveDown(0.3);
  document.fontSize(11);
  document.text(`Full name: ${tenant.fullName || 'Not set'}`);
  document.text(`Phone: ${tenant.phone || 'Not set'}`);
  document.text(`Email: ${tenant.email || 'Not set'}`);
  document.text(`Identity number: ${tenant.identityNumber || 'Not set'}`);
  document.moveDown();

  document.fontSize(13).text('3. Contract terms', { underline: true });
  document.moveDown(0.3);
  document.fontSize(11);
  document.text(`Start date: ${formatDate(contract.startDate)}`);
  document.text(`End date: ${formatDate(contract.endDate)}`);
  document.text(`Monthly rent: ${formatMoney(contract.monthlyPrice)}`);
  document.text(`Deposit: ${formatMoney(contract.deposit)}`);
  document.text(`Status: ${formatStatus(contract.status)}`);
  document.moveDown(1.4);

  document
    .fontSize(10)
    .text(
      'This PDF is generated from Smart Rental data for graduation project demo purposes.',
    );
  document.moveDown(2);

  const signatureY = document.y;
  document.text('Landlord signature', 80, signatureY, { width: 180 });
  document.text('Tenant signature', 340, signatureY, { width: 180 });

  document.end();
}

async function normalizeContractPayload(body) {
  const room = body.room;
  const tenant = body.tenant;
  const startDate = parseOptionalDate(body.startDate);
  const endDate = parseOptionalDate(body.endDate);
  const monthlyPrice = Number(body.monthlyPrice);
  const deposit = body.deposit === undefined ? 0 : Number(body.deposit);

  if (!startDate) {
    throw createHttpError(400, 'Start date is invalid', {
      startDate: 'Start date must be a valid date',
    });
  }

  if (body.endDate && !endDate) {
    throw createHttpError(400, 'End date is invalid', {
      endDate: 'End date must be a valid date',
    });
  }

  if (endDate && endDate <= startDate) {
    throw createHttpError(400, 'End date must be after start date', {
      endDate: 'End date must be after start date',
    });
  }

  const [existingRoom, existingTenant] = await Promise.all([
    Room.findOne({ _id: room, deletedAt: null }),
    Tenant.findOne({ _id: tenant, deletedAt: null }),
  ]);

  if (!existingRoom) {
    throw createHttpError(400, 'Room does not exist', {
      room: 'Room does not exist',
    });
  }

  if (!existingTenant) {
    throw createHttpError(400, 'Tenant does not exist', {
      tenant: 'Tenant does not exist',
    });
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
      throw createHttpError(404, 'Contract not found');
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
      throw createHttpError(404, 'Contract not found');
    }

    const roomName = contract.room?.name || 'contract';
    const filename = `contract-${roomName}-${contract._id}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    buildContractPdf(contract, res);
  } catch (error) {
    next(error);
  }
}

export async function createContract(req, res, next) {
  try {
    const contract = await Contract.create(
      await normalizeContractPayload(req.body),
    );
    const populatedContract = await contract.populate(contractPopulate);

    res.status(201).json({
      data: populatedContract,
      message: 'Contract created successfully',
    });
  } catch (error) {
    next(error);
  }
}

export async function updateContract(req, res, next) {
  try {
    const contract = await Contract.findByIdAndUpdate(
      req.params.id,
      await normalizeContractPayload(req.body),
      {
        new: true,
        runValidators: true,
      },
    ).populate(contractPopulate);

    if (!contract) {
      throw createHttpError(404, 'Contract not found');
    }

    res.json({
      data: contract,
      message: 'Contract updated successfully',
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
      throw createHttpError(404, 'Contract not found');
    }

    res.json({
      data: contract,
      message: 'Contract ended successfully',
    });
  } catch (error) {
    next(error);
  }
}
