import { Router } from 'express';
import type { Request, Response, RequestHandler } from 'express';
import { Order } from '../models/Order';
import { Product } from '../models/Product';
import { authenticateToken } from '../middleware/auth';
import type { AuthRequest } from '../middleware/auth';
import { sendOrderConfirmationEmail } from '../utils/email';
import { Coupon } from '../models/Coupon';
import { CouponUsage } from '../models/CouponUsage';
import { sendOrderRefundEmail } from '../utils/email';
import { Notification } from '../models/Notification';
import { emitNotification } from '../services/socketService';

// Add this type definition at the top
type AsyncRequestHandler = RequestHandler<
  any,
  any,
  any,
  any,
  Record<string, any>
>;

// Add these interfaces
interface User {
  _id: string;
  email: string;
  name: string;
}

interface PopulatedOrder {
  _id: string;
  user?: User;
  email?: string;
  items: any[];
  totalAmount: number;
  status: string;
  createdAt: string;
  // ...other order fields
}

const router = Router();

const createOrderHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { items, totalAmount, paymentMethod, paymentStatus, email, coupon } = req.body;

    // Handle guest orders with coupon (if needed)
    if (coupon) {
      const couponDoc = await Coupon.findOne({ code: coupon.code });
      if (!couponDoc) {
        res.status(400).json({ message: 'Invalid coupon' });
        return;
      }

      // Check if coupon has reached max uses
      if (couponDoc.maxUses && couponDoc.usedCount >= couponDoc.maxUses) {
        res.status(400).json({ message: 'Coupon has reached maximum usage' });
        return;
      }

      // For guest orders, just increment the usage count
      await Coupon.findByIdAndUpdate(couponDoc._id, {
        $inc: { usedCount: 1 }
      });
    }

    const order = new Order({
      items,
      totalAmount,
      paymentMethod,
      paymentStatus,
      status: 'received',
      email, // Store guest email
      coupon: coupon ? {
        code: coupon.code,
        type: coupon.type,
        value: coupon.value
      } : null
    });

    // Update product stock levels
    await Promise.all(items.map(async (item: any) => {
      const product = await Product.findById(item.productId);
      if (product) {
        const variant = product.variants.find(v => v.name === item.variantName);
        if (variant) {
          variant.stockQuantity -= item.quantity;
          variant.inStock = variant.stockQuantity > 0;

          // Check for low stock after order
          if (variant.stockQuantity <= 20) {
            const notification = await Notification.create({
              type: 'INVENTORY',
              message: `Low stock alert: ${product.name} (${variant.name})`,
              data: {
                productId: product._id,
                productName: product.name,
                variantName: variant.name,
                stockQuantity: variant.stockQuantity,
                threshold: 20
              }
            });

            emitNotification({
              type: 'INVENTORY',
              message: `Low stock alert: ${product.name} (${variant.name})`,
              timestamp: new Date(),
              data: {
                productId: product._id,
                productName: product.name,
                variantName: variant.name,
                stockQuantity: variant.stockQuantity,
                threshold: 20
              }
            });
          }

          await product.save();
        }
      }
    }));

    const savedOrder = await order.save();

    // Send confirmation email for guest orders
    if (email) {
      try {
        await sendOrderConfirmationEmail(email, savedOrder);
      } catch (emailError) {
        console.error('Failed to send order confirmation email:', emailError);
      }
    }

    res.status(201).json(savedOrder);
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(400).json({ message: 'Error creating order' });
  }
};

router.post('/guest', createOrderHandler);

router.post('/', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { items, totalAmount, paymentMethod, paymentStatus, coupon } = req.body;
    const user = req.user!;

    // If coupon is used, verify and update usage
    if (coupon) {
      const couponDoc = await Coupon.findOne({ code: coupon.code });
      if (!couponDoc) {
        res.status(400).json({ message: 'Invalid coupon' });
        return;
      }

      // Check if coupon has reached max uses
      if (couponDoc.maxUses && couponDoc.usedCount >= couponDoc.maxUses) {
        res.status(400).json({ message: 'Coupon has reached maximum usage' });
        return;
      }

      // Check if user has already used this coupon
      const hasUsed = await CouponUsage.findOne({
        couponId: couponDoc._id,
        userId: user._id
      });

      if (hasUsed) {
        res.status(400).json({ message: 'You have already used this coupon' });
        return;
      }

      // Create coupon usage record
      await CouponUsage.create({
        couponId: couponDoc._id,
        userId: user._id
      });

      // Increment coupon usage count
      await Coupon.findByIdAndUpdate(couponDoc._id, {
        $inc: { usedCount: 1 }
      });
    }

    const order = new Order({
      user: user._id,
      items,
      totalAmount,
      paymentMethod,
      paymentStatus,
      status: 'received',
      coupon: coupon ? {
        code: coupon.code,
        type: coupon.type,
        value: coupon.value
      } : null
    });

    // Update product stock levels
    await Promise.all(items.map(async (item: any) => {
      const product = await Product.findById(item.productId);
      if (product) {
        const variant = product.variants.find(v => v.name === item.variantName);
        if (variant) {
          variant.stockQuantity -= item.quantity;
          variant.inStock = variant.stockQuantity > 0;

          // Check for low stock after order
          if (variant.stockQuantity <= 20) {
            const notification = await Notification.create({
              type: 'INVENTORY',
              message: `Low stock alert: ${product.name} (${variant.name})`,
              data: {
                productId: product._id,
                productName: product.name,
                variantName: variant.name,
                stockQuantity: variant.stockQuantity,
                threshold: 20
              }
            });

            emitNotification({
              type: 'INVENTORY',
              message: `Low stock alert: ${product.name} (${variant.name})`,
              timestamp: new Date(),
              data: {
                productId: product._id,
                productName: product.name,
                variantName: variant.name,
                stockQuantity: variant.stockQuantity,
                threshold: 20
              }
            });
          }

          await product.save();
        }
      }
    }));

    const savedOrder = await order.save();

    // Send confirmation email for registered users
    try {
      await sendOrderConfirmationEmail(user.email, savedOrder);
    } catch (emailError) {
      console.error('Failed to send order confirmation email:', emailError);
    }

    res.status(201).json(savedOrder);
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(400).json({ message: 'Error creating order' });
  }
});

router.get('/my-orders', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const orders = await Order.find({ user: req.user?._id });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching orders' });
  }
});

// Add this new route handler
router.get('/track/:orderId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId);

    if (!order) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }

    // Fetch all product details for the order items
    const itemsWithImages = await Promise.all(
      order.items.map(async (item: any) => {
        const product = await Product.findById(item.productId);
        return {
          ...item.toObject(),
          productId: item.productId,
          image: product?.image || null
        };
      })
    );

    const orderWithImages = {
      ...order.toObject(),
      items: itemsWithImages
    };

    res.json(orderWithImages);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ message: 'Error fetching order details' });
  }
});

// Add this new route before 'export default router'
router.post('/:orderId/refund-email', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId).populate<{ user?: User }>('user');
    
    if (!order) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }

    const customerEmail = order.user?.email || order.email;
    if (!customerEmail) {
      res.status(400).json({ message: 'No email address found for this order' });
      return;
    }

    await sendOrderRefundEmail(customerEmail, order);
    res.json({ message: 'Refund email sent successfully' });
  } catch (error) {
    console.error('Error sending refund email:', error);
    res.status(500).json({ message: 'Error sending refund email' });
  }
});

export default router;
