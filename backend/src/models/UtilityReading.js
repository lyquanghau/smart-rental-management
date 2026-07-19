import mongoose from 'mongoose';

const utilityReadingSchema = new mongoose.Schema(
  {
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: true,
    },
    contract: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contract',
      required: true,
    },
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    year: {
      type: Number,
      required: true,
      min: 2000,
    },
    electricityPrevious: {
      type: Number,
      default: 0,
      min: 0,
    },
    electricityCurrent: {
      type: Number,
      default: 0,
      min: 0,
    },
    electricityUsage: {
      type: Number,
      default: 0,
      min: 0,
    },
    electricityAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    waterPrevious: {
      type: Number,
      default: 0,
      min: 0,
    },
    waterCurrent: {
      type: Number,
      default: 0,
      min: 0,
    },
    waterUsage: {
      type: Number,
      default: 0,
      min: 0,
    },
    waterAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    internetAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    trashAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    parkingVehicleCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    parkingAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    serviceTotal: {
      type: Number,
      default: 0,
      min: 0,
    },
    note: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

utilityReadingSchema.index({ room: 1, month: 1, year: 1 }, { unique: true });
utilityReadingSchema.index({ contract: 1, month: 1, year: 1 });

export const UtilityReading = mongoose.model(
  'UtilityReading',
  utilityReadingSchema,
);
