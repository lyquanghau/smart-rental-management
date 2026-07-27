import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    floor: {
      type: Number,
      required: true,
      min: 1,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    maxOccupants: {
      type: Number,
      required: true,
      default: 2,
      min: 1,
    },
    status: {
      type: String,
      enum: ['available', 'occupied', 'maintenance'],
      default: 'available',
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

roomSchema.index({ owner: 1, deletedAt: 1, status: 1 });
roomSchema.index({ owner: 1, deletedAt: 1, floor: 1 });

export const Room = mongoose.model('Room', roomSchema);
