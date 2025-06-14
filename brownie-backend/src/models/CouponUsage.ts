import mongoose from 'mongoose';

const couponUsageSchema = new mongoose.Schema({
  couponId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Coupon',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  usedAt: {
    type: Date,
    default: Date.now
  }
});

// Create compound index to ensure user can't use same coupon multiple times
couponUsageSchema.index({ couponId: 1, userId: 1 }, { unique: true });

export const CouponUsage = mongoose.model('CouponUsage', couponUsageSchema);
