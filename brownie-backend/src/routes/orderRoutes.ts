import { Router } from 'express';
import type { Request, Response } from 'express';
import { Order } from '../models/Order';
import { Product } from '../models/Product';
import { authenticateToken } from '../middleware/auth';
import type { AuthRequest } from '../middleware/auth';

const router = Router();

// Add new guest order route
router.post('/guest', async (req: Request, res: Response) => {
  try {
    const { items, totalAmount, paymentMethod, paymentStatus } = req.body;

    // Create the order without user reference
    const order = new Order({
      items,
      totalAmount,
      paymentMethod,
      paymentStatus,
      status: 'received'
    });

    // Update product stock levels
    await Promise.all(items.map(async (item: any) => {
      const product = await Product.findById(item.productId);
      if (product) {
        const variant = product.variants.find(v => v.name === item.variantName);
        if (variant) {
          variant.stockQuantity -= item.quantity;
          variant.inStock = variant.stockQuantity > 0;
          await product.save();
        }
      }
    }));

    const savedOrder = await order.save();
    res.status(201).json(savedOrder);
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(400).json({ message: 'Error creating order' });
  }
});

router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { items, totalAmount, paymentMethod, paymentStatus } = req.body;

    // Create the order
    const order = new Order({
      user: req.user?._id,
      items,
      totalAmount,
      paymentMethod,
      paymentStatus,
      status: 'received'
    });

    // Update product stock levels
    await Promise.all(items.map(async (item: any) => {
      const product = await Product.findById(item.productId);
      if (product) {
        const variant = product.variants.find(v => v.name === item.variantName);
        if (variant) {
          variant.stockQuantity -= item.quantity;
          variant.inStock = variant.stockQuantity > 0;
          await product.save();
        }
      }
    }));

    const savedOrder = await order.save();
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

export default router;
