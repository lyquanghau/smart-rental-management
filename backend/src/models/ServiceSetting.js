import mongoose from 'mongoose';

const serviceSettingSchema = new mongoose.Schema(
  {
    electricityUnitPrice: {
      type: Number,
      default: 3500,
      min: 0,
    },
    waterUnitPrice: {
      type: Number,
      default: 15000,
      min: 0,
    },
    internetFee: {
      type: Number,
      default: 100000,
      min: 0,
    },
    trashFee: {
      type: Number,
      default: 30000,
      min: 0,
    },
    parkingFeePerVehicle: {
      type: Number,
      default: 100000,
      min: 0,
    },
  },
  {
    timestamps: true,
  },
);

export const ServiceSetting = mongoose.model(
  'ServiceSetting',
  serviceSettingSchema,
);
