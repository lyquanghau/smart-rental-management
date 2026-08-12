import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['payment_success', 'payment_failed', 'system'],
      default: 'system',
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    entityType: {
      type: String,
      enum: ['invoice', 'payment', 'contract', 'room', 'tenant', 'system'],
      default: 'system',
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    sourceEventKey: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
    },
    readAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

notificationSchema.index({ owner: 1, readAt: 1, createdAt: -1 });

export const Notification = mongoose.model('Notification', notificationSchema);
