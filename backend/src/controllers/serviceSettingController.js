import { ServiceSetting } from '../models/ServiceSetting.js';
import { ownerFilter } from '../utils/ownership.js';

function normalizeSettingPayload(body) {
  return {
    electricityUnitPrice: Number(body.electricityUnitPrice || 0),
    waterUnitPrice: Number(body.waterUnitPrice || 0),
    internetFee: Number(body.internetFee || 0),
    trashFee: Number(body.trashFee || 0),
    parkingFeePerVehicle: Number(body.parkingFeePerVehicle || 0),
    bankName: String(body.bankName || '').trim(),
    bankAccountNumber: String(body.bankAccountNumber || '').trim(),
    bankAccountName: String(body.bankAccountName || '').trim(),
    transferContentTemplate: String(
      body.transferContentTemplate ||
        'Thanh toan phong {room} thang {month}-{year}',
    ).trim(),
    paymentNote: String(body.paymentNote || '').trim(),
  };
}

export async function getServiceSetting(req, res, next) {
  try {
    const setting =
      (await ServiceSetting.findOne(ownerFilter(req)).sort({ createdAt: 1 })) ||
      (await ServiceSetting.create({ owner: req.user._id }));

    res.json({ data: setting });
  } catch (error) {
    next(error);
  }
}

export async function updateServiceSetting(req, res, next) {
  try {
    const existing = await ServiceSetting.findOne(ownerFilter(req)).sort({
      createdAt: 1,
    });
    const payload = {
      ...normalizeSettingPayload(req.body),
      owner: req.user._id,
    };
    const setting = existing
      ? await ServiceSetting.findByIdAndUpdate(existing._id, payload, {
          new: true,
          runValidators: true,
        })
      : await ServiceSetting.create(payload);

    res.json({
      data: setting,
      message: 'Cập nhật cấu hình dịch vụ thành công',
    });
  } catch (error) {
    next(error);
  }
}
