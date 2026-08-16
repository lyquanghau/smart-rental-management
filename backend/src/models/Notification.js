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
      enum: ['payment_success', 'payment_failed', 'support_request', 'system'],
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
      enum: [
        'invoice',
        'payment',
        'contract',
        'room',
        'tenant',
        'support_request',
        'system',
      ],
      default: 'system',
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    recipientRole: {
      type: String,
      enum: ['landlord', 'tenant'],
    },
    recipientUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
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
notificationSchema.index({ recipientUser: 1, readAt: 1, createdAt: -1 });

export const Notification = mongoose.model('Notification', notificationSchema);
