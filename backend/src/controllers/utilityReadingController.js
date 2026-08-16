import { Contract } from '../models/Contract.js';
import { ServiceSetting } from '../models/ServiceSetting.js';
import { UtilityReading } from '../models/UtilityReading.js';
import { createHttpError } from '../utils/httpError.js';
import { ownerFilter } from '../utils/ownership.js';

const LEGACY_WATER_UNIT_PRICE = 15000;
const DEFAULT_WATER_FEE_PER_PERSON = 100000;

const readingPopulate = [
  { path: 'room', select: 'name floor price maxOccupants status' },
  {
    path: 'contract',
    select:
      'room tenant startDate endDate monthlyPrice status occupants vehicleCount',
    populate: [
      { path: 'room', select: 'name floor price maxOccupants status' },
      { path: 'tenant', select: 'fullName phone email identityNumber' },
    ],
  },
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

async function getServiceSettingSnapshot(ownerId) {
  const setting =
    (await ServiceSetting.findOne({ owner: ownerId }).sort({ createdAt: 1 })) ||
    (await ServiceSetting.create({ owner: ownerId }));

  if (Number(setting.waterUnitPrice) === LEGACY_WATER_UNIT_PRICE) {
    setting.waterUnitPrice = DEFAULT_WATER_FEE_PER_PERSON;
    return setting.save();
  }

  return setting;
}

function getContractOccupantCount(contract) {
  return 1 + (contract.occupants?.length || 0);
}

async function getPreviousElectricityCurrent({ month, ownerId, roomId, year }) {
  const previousReading = await UtilityReading.findOne({
    owner: ownerId,
    room: roomId,
    $or: [{ year: { $lt: year } }, { year, month: { $lt: month } }],
  }).sort({ year: -1, month: -1 });

  return Number(previousReading?.electricityCurrent || 0);
}

async function normalizeReadingPayload(body, ownerId) {
  const { month, year } = normalizeMonthYear(body.month, body.year);
  const contract = await Contract.findOne({
    _id: body.contract,
    deletedAt: null,
    owner: ownerId,
  }).select('room tenant monthlyPrice status occupants vehicleCount');

  if (!contract || contract.status !== 'active') {
    throw createHttpError(400, 'Hợp đồng không hợp lệ', {
      contract: 'Chỉ được nhập chỉ số cho hợp đồng đang hiệu lực',
    });
  }

  const setting = await getServiceSettingSnapshot(ownerId);
  const occupantCount = getContractOccupantCount(contract);
  const electricityPrevious = await getPreviousElectricityCurrent({
    month,
    ownerId,
    roomId: contract.room,
    year,
  });
  const electricityCurrent = Number(body.electricityCurrent || 0);
  const waterPrevious = 0;
  const waterCurrent = occupantCount;
  const parkingVehicleCount = Number(contract.vehicleCount || 0);

  if (
    body.electricityCurrent === undefined ||
    body.electricityCurrent === null ||
    body.electricityCurrent === ''
  ) {
    throw createHttpError(400, 'Can nhap chi so dien moi', {
      electricityCurrent: 'Chi so dien moi la bat buoc',
    });
  }

  if (electricityCurrent < electricityPrevious) {
    throw createHttpError(400, 'Chỉ số điện không hợp lệ', {
      electricityCurrent: 'Chỉ số điện mới không được nhỏ hơn chỉ số cũ',
    });
  }

  const electricityUsage = electricityCurrent - electricityPrevious;
  const waterUsage = occupantCount;
  const electricityAmount = electricityUsage * setting.electricityUnitPrice;
  const waterAmount = waterUsage * setting.waterUnitPrice;
  const internetAmount = Number(setting.internetFee || 0);
  const trashAmount = Number(setting.trashFee || 0);
  const parkingAmount = parkingVehicleCount * setting.parkingFeePerVehicle;

  return {
    owner: ownerId,
    room: contract.room,
    contract: contract._id,
    month,
    year,
    electricityPrevious,
    electricityCurrent,
    electricityUsage,
    electricityAmount,
    waterPrevious,
    waterCurrent,
    waterUsage,
    waterAmount,
    internetAmount,
    trashAmount,
    parkingVehicleCount,
    parkingAmount,
    serviceTotal:
      electricityAmount +
      waterAmount +
      internetAmount +
      trashAmount +
      parkingAmount,
    note: body.note || '',
  };
}

export async function listUtilityReadings(req, res, next) {
  try {
    const filters = ownerFilter(req);

    if (req.query.month || req.query.year) {
      const { month, year } = normalizeMonthYear(
        req.query.month,
        req.query.year,
      );
      filters.month = month;
      filters.year = year;
    }

    const readings = await UtilityReading.find(filters)
      .populate(readingPopulate)
      .sort({ year: -1, month: -1, createdAt: -1 });

    res.json({ data: readings });
  } catch (error) {
    next(error);
  }
}

export async function getUtilityReading(req, res, next) {
  try {
    const reading = await UtilityReading.findOne(
      ownerFilter(req, { _id: req.params.id }),
    ).populate(readingPopulate);

    if (!reading) {
      throw createHttpError(404, 'Không tìm thấy chỉ số dịch vụ');
    }

    res.json({ data: reading });
  } catch (error) {
    next(error);
  }
}

export async function upsertUtilityReading(req, res, next) {
  try {
    const payload = await normalizeReadingPayload(req.body, req.user._id);
    const reading = await UtilityReading.findOneAndUpdate(
      ownerFilter(req, {
        room: payload.room,
        month: payload.month,
        year: payload.year,
      }),
      { $set: payload },
      { new: true, runValidators: true, upsert: true },
    ).populate(readingPopulate);

    res.status(201).json({
      data: reading,
      message: 'Lưu chỉ số dịch vụ thành công',
    });
  } catch (error) {
    next(error);
  }
}

export async function updateUtilityReading(req, res, next) {
  try {
    const payload = await normalizeReadingPayload(req.body, req.user._id);
    const reading = await UtilityReading.findOneAndUpdate(
      ownerFilter(req, { _id: req.params.id }),
      payload,
      { new: true, runValidators: true },
    ).populate(readingPopulate);

    if (!reading) {
      throw createHttpError(404, 'Không tìm thấy chỉ số dịch vụ');
    }

    res.json({
      data: reading,
      message: 'Cập nhật chỉ số dịch vụ thành công',
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteUtilityReading(req, res, next) {
  try {
    const reading = await UtilityReading.findOneAndDelete(
      ownerFilter(req, { _id: req.params.id }),
    );

    if (!reading) {
      throw createHttpError(404, 'Không tìm thấy chỉ số dịch vụ');
    }

    res.json({ message: 'Xóa chỉ số dịch vụ thành công' });
  } catch (error) {
    next(error);
  }
}
