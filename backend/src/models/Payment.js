import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    contract: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contract',
      required: true,
    },
    invoice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Invoice',
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    paidAt: {
      type: Date,
    },
    method: {
      type: String,
      enum: ['cash', 'bank_transfer', 'momo', 'vnpay', 'sepay'],
      default: 'cash',
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'overdue', 'cancelled'],
      default: 'pending',
    },
    note: {
      type: String,
      trim: true,
    },
    provider: {
      type: String,
      enum: ['manual', 'momo', 'sepay', 'payos', 'casso'],
      default: 'manual',
    },
    providerOrderId: {
      type: String,
      trim: true,
      index: true,
    },
    providerRequestId: {
      type: String,
      trim: true,
    },
    providerTransactionId: {
      type: String,
      trim: true,
    },
    providerReference: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

paymentSchema.index({ owner: 1, contract: 1, status: 1 });
paymentSchema.index({ owner: 1, invoice: 1 }, { sparse: true });
paymentSchema.index({ owner: 1, status: 1, dueDate: 1 });
paymentSchema.index({ owner: 1, dueDate: 1, method: 1 });

export const Payment = mongoose.model('Payment', paymentSchema);
