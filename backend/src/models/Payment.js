import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    contract: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contract',
      required: true,
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
      enum: ['cash', 'bank_transfer', 'momo', 'vnpay'],
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
  },
  {
    timestamps: true,
  },
);

paymentSchema.index({ contract: 1, status: 1 });
paymentSchema.index({ status: 1, dueDate: 1 });
paymentSchema.index({ dueDate: 1, method: 1 });

export const Payment = mongoose.model('Payment', paymentSchema);
