import { Router, RequestHandler } from 'express';
import { authenticateToken } from '../middleware/auth';
import { Coupon } from '../models/Coupon';
import { Order } from '../models/Order';
import { CouponUsage } from '../models/CouponUsage';

const router = Router();

const validateCoupon: RequestHandler = async (req, res) => {
  try {
    const { code, userId } = req.body;

    const coupon = await Coupon.findOne({ code: code.toUpperCase() });

    if (!coupon) {
      res.status(404).json({ message: 'Coupon not found' });
      return;
    }

    // Check if user has already used this coupon
    const hasUsed = await CouponUsage.findOne({
      couponId: coupon._id,
      userId
    });

    if (hasUsed) {
      res.status(400).json({ message: 'You have already used this coupon' });
      return;
    }

    if (!coupon.isActive) {
      res.status(400).json({ message: 'This coupon is no longer active' });
      return;
    }

    if (coupon.expiryDate && new Date(coupon.expiryDate) < new Date()) {
      res.status(400).json({ message: 'This coupon has expired' });
      return;
    }

    // Check total usage count
    const totalUsage = await CouponUsage.countDocuments({ couponId: coupon._id });
    if (coupon.maxUses && totalUsage >= coupon.maxUses) {
      res.status(400).json({ message: 'This coupon has reached its usage limit' });
      return;
    }

    // Check if coupon is for new users only
    if (coupon.newUsersOnly) {
      const orderCount = await Order.countDocuments({ user: userId });
      if (orderCount > 0) {
        res.status(400).json({ message: 'This coupon is for new customers only' });
        return;
      }
    }

    // If all validations pass, return the coupon
    res.json({
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      isActive: coupon.isActive,
      maxUses: coupon.maxUses,
      usedCount: totalUsage // Include the current usage count
    });
  } catch (error) {
    console.error('Coupon validation error:', error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : 'Failed to validate coupon'
    });
  }
};

router.post('/validate', authenticateToken, validateCoupon);

export default router;
