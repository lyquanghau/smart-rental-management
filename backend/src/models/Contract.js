import mongoose from 'mongoose';

const contractSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
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
    occupants: [
      {
        fullName: {
          type: String,
          required: true,
          trim: true,
        },
        phone: {
          type: String,
          trim: true,
        },
        identityNumber: {
          type: String,
          trim: true,
        },
        note: {
          type: String,
          trim: true,
        },
      },
    ],
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

contractSchema.index({ owner: 1, deletedAt: 1, status: 1 });
contractSchema.index({ owner: 1, room: 1, status: 1 });
contractSchema.index({ owner: 1, tenant: 1, status: 1 });
contractSchema.index({ owner: 1, status: 1, endDate: 1 });

export const Contract = mongoose.model('Contract', contractSchema);
