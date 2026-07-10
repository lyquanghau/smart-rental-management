import mongoose from 'mongoose';

const tenantSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    identityNumber: {
      type: String,
      trim: true,
    },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

tenantSchema.index({ deletedAt: 1, room: 1 });
tenantSchema.index({ deletedAt: 1, fullName: 1 });

export const Tenant = mongoose.model('Tenant', tenantSchema);
