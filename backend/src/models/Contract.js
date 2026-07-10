import mongoose from 'mongoose';

const contractSchema = new mongoose.Schema(
  {
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: true,
    },
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
    },
    monthlyPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    deposit: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ['active', 'ended', 'cancelled'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  },
);

contractSchema.index({ room: 1, status: 1 });
contractSchema.index({ tenant: 1, status: 1 });
contractSchema.index({ status: 1, endDate: 1 });

export const Contract = mongoose.model('Contract', contractSchema);
