import mongoose from 'mongoose';

const supportRequestSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    category: {
      type: String,
      enum: ['billing', 'contract', 'room', 'account', 'other'],
      default: 'other',
      index: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
      maxlength: 160,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 2000,
    },
    priority: {
      type: String,
      enum: ['normal', 'urgent'],
      default: 'normal',
      index: true,
    },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'resolved', 'closed'],
      default: 'open',
      index: true,
    },
    landlordReply: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    resolvedAt: {
      type: Date,
    },
    closedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

supportRequestSchema.index({ owner: 1, status: 1, priority: 1, createdAt: -1 });
supportRequestSchema.index({ tenant: 1, requester: 1, createdAt: -1 });

export const SupportRequest = mongoose.model(
  'SupportRequest',
  supportRequestSchema,
);
