import mongoose from 'mongoose';

const serviceSettingSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
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
    bankName: {
      type: String,
      trim: true,
      maxlength: 120,
      default: '',
    },
    bankAccountNumber: {
      type: String,
      trim: true,
      maxlength: 40,
      default: '',
    },
    bankAccountName: {
      type: String,
      trim: true,
      maxlength: 120,
      default: '',
    },
    transferContentTemplate: {
      type: String,
      trim: true,
      maxlength: 160,
      default: 'Thanh toan phong {room} thang {month}-{year}',
    },
    paymentNote: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
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
