import { Router } from 'express';
import type { Request, Response, RequestHandler } from 'express';
import { Order } from '../models/Order';
import { Product } from '../models/Product';
import { authenticateToken } from '../middleware/auth';
import type { AuthRequest } from '../middleware/auth';
import { sendOrderConfirmationEmail } from '../utils/email';

// Add this type definition at the top
type AsyncRequestHandler = RequestHandler<
  any,
  any,
  any,
  any,
  Record<string, any>
>;

const router = Router();

router.post('/guest', async (req: Request, res: Response) => {
  try {
    const { items, totalAmount, paymentMethod, paymentStatus, email } = req.body;

    const order = new Order({
      items,
      totalAmount,
      paymentMethod,
      paymentStatus,
      status: 'received',
      email // Store guest email
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
});

router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { items, totalAmount, paymentMethod, paymentStatus } = req.body;
    const user = req.user!;

    const order = new Order({
      user: user._id,
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
router.get('/track/:orderId', (async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId);

    if (!order) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }

    res.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ message: 'Error fetching order details' });
  }
}) as AsyncRequestHandler);

export default router;
