import { ServiceSetting } from '../models/ServiceSetting.js';

function normalizeSettingPayload(body) {
  return {
    electricityUnitPrice: Number(body.electricityUnitPrice || 0),
    waterUnitPrice: Number(body.waterUnitPrice || 0),
    internetFee: Number(body.internetFee || 0),
    trashFee: Number(body.trashFee || 0),
    parkingFeePerVehicle: Number(body.parkingFeePerVehicle || 0),
  };
}

export async function getServiceSetting(_req, res, next) {
  try {
    const setting =
      (await ServiceSetting.findOne().sort({ createdAt: 1 })) ||
      (await ServiceSetting.create({}));

    res.json({ data: setting });
  } catch (error) {
    next(error);
  }
}

export async function updateServiceSetting(req, res, next) {
  try {
    const existing = await ServiceSetting.findOne().sort({ createdAt: 1 });
    const payload = normalizeSettingPayload(req.body);
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
