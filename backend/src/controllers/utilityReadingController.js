import { Contract } from '../models/Contract.js';
import { ServiceSetting } from '../models/ServiceSetting.js';
import { UtilityReading } from '../models/UtilityReading.js';
import { createHttpError } from '../utils/httpError.js';

const readingPopulate = [
  { path: 'room', select: 'name floor price maxOccupants status' },
  {
    path: 'contract',
    select: 'room tenant startDate endDate monthlyPrice status',
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

async function getServiceSettingSnapshot() {
  return (
    (await ServiceSetting.findOne().sort({ createdAt: 1 })) ||
    (await ServiceSetting.create({}))
  );
}

async function normalizeReadingPayload(body) {
  const { month, year } = normalizeMonthYear(body.month, body.year);
  const contract = await Contract.findById(body.contract);

  if (!contract || contract.status !== 'active') {
    throw createHttpError(400, 'Hợp đồng không hợp lệ', {
      contract: 'Chỉ được nhập chỉ số cho hợp đồng đang hiệu lực',
    });
  }

  const setting = await getServiceSettingSnapshot();
  const electricityPrevious = Number(body.electricityPrevious || 0);
  const electricityCurrent = Number(body.electricityCurrent || 0);
  const waterPrevious = Number(body.waterPrevious || 0);
  const waterCurrent = Number(body.waterCurrent || 0);
  const parkingVehicleCount = Number(body.parkingVehicleCount || 0);

  if (electricityCurrent < electricityPrevious) {
    throw createHttpError(400, 'Chỉ số điện không hợp lệ', {
      electricityCurrent: 'Chỉ số điện mới không được nhỏ hơn chỉ số cũ',
    });
  }

  if (waterCurrent < waterPrevious) {
    throw createHttpError(400, 'Chỉ số nước không hợp lệ', {
      waterCurrent: 'Chỉ số nước mới không được nhỏ hơn chỉ số cũ',
    });
  }

  const electricityUsage = electricityCurrent - electricityPrevious;
  const waterUsage = waterCurrent - waterPrevious;
  const electricityAmount = electricityUsage * setting.electricityUnitPrice;
  const waterAmount = waterUsage * setting.waterUnitPrice;
  const internetAmount = Number(body.internetAmount ?? setting.internetFee);
  const trashAmount = Number(body.trashAmount ?? setting.trashFee);
  const parkingAmount = parkingVehicleCount * setting.parkingFeePerVehicle;

  return {
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
    const filters = {};

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
    const reading = await UtilityReading.findById(req.params.id).populate(
      readingPopulate,
    );

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
    const payload = await normalizeReadingPayload(req.body);
    const reading = await UtilityReading.findOneAndUpdate(
      { room: payload.room, month: payload.month, year: payload.year },
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
    const payload = await normalizeReadingPayload(req.body);
    const reading = await UtilityReading.findByIdAndUpdate(
      req.params.id,
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
    const reading = await UtilityReading.findByIdAndDelete(req.params.id);

    if (!reading) {
      throw createHttpError(404, 'Không tìm thấy chỉ số dịch vụ');
    }

    res.json({ message: 'Xóa chỉ số dịch vụ thành công' });
  } catch (error) {
    next(error);
  }
}
