import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema(
  {
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

roomSchema.index({ deletedAt: 1, status: 1 });
roomSchema.index({ deletedAt: 1, floor: 1 });

export const Room = mongoose.model('Room', roomSchema);
