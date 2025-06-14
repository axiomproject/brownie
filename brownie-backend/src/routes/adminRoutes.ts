import { Router, RequestHandler, Response } from 'express';
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth';
import { User } from '../models/User';
import { Product } from '../models/Product';
import { Order } from '../models/Order';
import { Contact } from '../models/Contact';
import { InventoryLog } from '../models/InventoryLog';
import { Coupon } from '../models/Coupon';
import { Feedback } from '../models/Feedback';
import bcrypt from 'bcryptjs';
import { sendOrderRefundEmail, sendDeliveryConfirmationEmail } from '../utils/email';
import { emitNotification } from '../services/socketService';
import { Notification } from '../models/Notification';

const router = Router();

// Apply middlewares correctly
router.use(authenticateToken);
router.use(requireAdmin);

// All handlers should be typed as RequestHandler
const getStats: RequestHandler = async (req, res) => {
  try {
    const [users, allOrders, products] = await Promise.all([
      User.countDocuments({ role: 'customer' }),
      Order.find().populate('user', 'name').sort({ createdAt: -1 }),
      Product.find()
    ]);

    // Calculate total revenue from delivered orders
    const totalRevenue = allOrders
      .filter(order => order.status === 'delivered')
      .reduce((sum, order) => sum + order.totalAmount, 0);

    // Calculate total products including variants
    const totalProducts = products.reduce((sum, product) => 
      sum + product.variants.length, 0
    );

    // Calculate low stock items (less than 20% of max stock or below 50 units)
    const lowStockProducts = products.reduce((count, product) => {
      const lowStockVariants = product.variants.filter(variant => {
        // Consider it low stock if below 50 units OR below 20% of initial stock (assuming 500 is max)
        const threshold = Math.min(50, 500 * 0.2); // 20% of max stock or 50, whichever is lower
        return variant.stockQuantity < threshold;
      });
      return count + lowStockVariants.length;
    }, 0);

    // Calculate orders by status for the chart
    const ordersByStatus = {
      received: allOrders.filter(order => order.status === 'received').length,
      baking: allOrders.filter(order => order.status === 'baking').length,
      'out for delivery': allOrders.filter(order => order.status === 'out for delivery').length,
      delivered: allOrders.filter(order => order.status === 'delivered').length,
    };

    // Get start date for 12 months ago
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 11);
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);

    // Generate 12 month periods
    const months = Array.from({ length: 12 }, (_, i) => {
      const date = new Date(startDate);
      date.setMonth(startDate.getMonth() + i);
      return {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        monthYear: date.toLocaleString('default', { month: 'long', year: 'numeric' }),
        total: 0
      };
    });

    // Get revenue data
    const revenueData = await Order.aggregate([
      {
        $match: {
          status: 'delivered',
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          total: { $sum: "$totalAmount" }
        }
      }
    ]);

    // Map revenue data to months array
    const completeRevenueData = months.map(month => {
      const revenue = revenueData.find(r => 
        r._id.year === month.year && 
        r._id.month === month.month
      );

      return {
        name: month.monthYear,
        total: revenue ? revenue.total : 0
      };
    });

    // Updated aggregation for most ordered items
    const mostOrderedItems = await Order.aggregate([
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.productId',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $group: {
          _id: {
            productId: '$items.productId',
            variantName: '$items.variantName'
          },
          name: {
            $first: {
              $concat: [
                '$product.name',  // Use the actual product name from products collection
                ' - ',
                '$items.variantName'  // Use the variant name from the order
              ]
            }
          },
          quantity: { $sum: '$items.quantity' }
        }
      },
      { $sort: { quantity: -1 } },
      { $limit: 5 },
      {
        $project: {
          _id: 0,
          name: 1,
          quantity: 1
        }
      }
    ]);

    res.json({
      totalUsers: users,
      totalOrders: allOrders.length,
      totalRevenue,
      totalProducts,
      lowStockProducts,
      ordersByStatus,
      revenueData: completeRevenueData,
      recentOrders: allOrders.slice(0, 5),
      mostOrderedItems: mostOrderedItems // Now directly use the aggregated result
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: 'Error fetching stats' });
  }
};

const getUsers: RequestHandler = async (req, res) => {
  try {
    // Only fetch customer users
    const users = await User.find({ role: 'customer' }).select('-password').sort({ createdAt: -1 });
    console.log('Retrieved users:', users);
    res.json(users);
  } catch (error) {
    console.error('Error in getUsers:', error);
    res.status(500).json({ 
      message: 'Error fetching users',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

const createUser: RequestHandler = async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    const userWithoutPassword = await User.findById(user._id).select('-password');
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ message: 'Error creating user' });
  }
};

const deleteUser: RequestHandler = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Error deleting user' });
  }
};

const updateUserRole: RequestHandler = async (req, res) => {
  try {
    const { role } = req.body;
    if (!['admin', 'customer'].includes(role)) {
      res.status(400).json({ message: 'Invalid role' });
      return;
    }
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-password');
    res.json(user);
    return;
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error updating user role' });
  }
};

const updateUser: RequestHandler = async (req, res) => {
  try {
    const updates = req.body;
    
    // Handle password update with hashing
    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    } else {
      delete updates.password;
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    ).select('-password');

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error updating user' });
  }
};

const updateUserVerification: RequestHandler = async (req, res) => {
  try {
    const { isVerified } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isVerified },
      { new: true }
    ).select('-password');

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error updating user verification status' });
  }
};

const getOrders: RequestHandler = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching orders' });
  }
};

const updateOrderStatus: RequestHandler = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['received', 'baking', 'out for delivery', 'delivered', 'refunded'];
    
    if (!validStatuses.includes(status)) {
      res.status(400).json({ message: 'Invalid status' });
      return;
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate<{ user: { email: string } }>('user', 'name email');

    if (!order) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }

    // Send delivery confirmation email if status is changed to delivered
    if (status === 'delivered') {
      const customerEmail = order.user?.email || order.email;
      if (customerEmail) {
        try {
          await sendDeliveryConfirmationEmail(customerEmail, order);
        } catch (emailError) {
          console.error('Failed to send delivery confirmation email:', emailError);
        }
      }
    }

    res.json(order);
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: 'Error updating order status' });
  }
};

const sendRefundEmail: RequestHandler = async (req, res) => {
  try {
    const orderId = req.params.id;
    const order = await Order.findById(orderId)
      .populate<{ user: { email: string } }>('user', 'name email');
    
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
};

const deleteOrder: RequestHandler = async (req, res) => {
  try {
    await Order.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Error deleting order' });
  }
};

const createProduct: RequestHandler = async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: 'Error creating product' });
  }
};

const updateProduct: RequestHandler = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Error updating product' });
  }
};

const deleteProduct: RequestHandler = async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Error deleting product' });
  }
};

const getProducts: RequestHandler = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    console.log('Retrieved products:', products); // Debug log
    res.json(products);
  } catch (error) {
    console.error('Error in getProducts:', error);
    res.status(500).json({ 
      message: 'Error fetching products',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

const getProduct: RequestHandler = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching product' });
  }
};

const getUserDetails: RequestHandler = async (req, res) => {
  try {
    const userId = req.params.id;
    const orders = await Order.find({ user: userId }).sort({ createdAt: -1 });
    
    const customerDetails = {
      orders,
      totalSpent: orders.reduce((sum, order) => sum + order.totalAmount, 0),
      orderCount: orders.length,
      firstOrder: orders.length ? orders[orders.length - 1].createdAt : null
    };

    res.json(customerDetails);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching customer details' });
  }
};

const getInventoryLogs: RequestHandler = async (req, res) => {
  try {
    const logs = await InventoryLog.find()
      .populate('productId', 'name')
      .populate('updatedBy', 'name')
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching inventory logs' });
  }
};

// Update the existing updateInventory function
const updateInventory: RequestHandler = async (req, res) => {
  try {
    const { productId, variantName, stockQuantity, reason } = req.body;
    const user = (req as AuthRequest).user;
    if (!user) {
      throw new Error('User not authenticated');
    }
    const userId = user.id;
    
    const product = await Product.findById(productId);
    if (!product) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }

    const variant = product.variants.find(v => v.name === variantName);
    if (!variant) {
      res.status(404).json({ message: 'Variant not found' });
      return;
    }

    // Create inventory log
    await InventoryLog.create({
      productId: product._id,
      variantName,
      previousQuantity: variant.stockQuantity,
      newQuantity: stockQuantity,
      changeType: 'manual',
      reason: reason || 'Manual stock update',
      updatedBy: userId
    });

    // Update stock
    variant.stockQuantity = stockQuantity;
    variant.inStock = stockQuantity > 0;
    
    // Check for low stock and create notification if needed
    if (stockQuantity <= 20) {  // Threshold for low stock
      const notification = await Notification.create({
        type: 'INVENTORY',
        message: `Low stock alert: ${product.name} (${variant.name})`,
        data: {
          productId: product._id,
          productName: product.name,
          variantName: variant.name,
          stockQuantity: stockQuantity,
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
          stockQuantity: stockQuantity,
          threshold: 20
        }
      });
    }
    
    await product.save();
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Error updating inventory' });
  }
};

// Add these new route handlers
const getCoupons: RequestHandler = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json(coupons);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching coupons' });
  }
};

const createCoupon: RequestHandler = async (req, res) => {
  try {
    const coupon = new Coupon({
      ...req.body,
      usedCount: 0,
      isActive: true
    });
    await coupon.save();
    res.status(201).json(coupon);
  } catch (error) {
    res.status(500).json({ message: 'Error creating coupon' });
  }
};

const updateCoupon: RequestHandler = async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(coupon);
  } catch (error) {
    res.status(500).json({ message: 'Error updating coupon' });
  }
};

// Add this new handler before the route definitions
const deleteCoupon: RequestHandler = async (req, res) => {
  try {
    await Coupon.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Error deleting coupon' });
  }
};

// Add these new route handlers
const getFeedbacks: RequestHandler = async (req, res) => {
  try {
    const feedbacks = await Feedback.find()
      .populate({
        path: 'orderId',
        select: 'user email',
        populate: {
          path: 'user',
          select: 'name email'
        }
      })
      .sort({ createdAt: -1 });

    // Transform the data to include order information
    const transformedFeedbacks = feedbacks.map(feedback => ({
      ...feedback.toObject(),
      order: feedback.orderId
    }));

    res.json(transformedFeedbacks);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching feedbacks' });
  }
};

const toggleFeedbackDisplay: RequestHandler = async (req, res) => {
  try {
    const { feedbackId } = req.params;
    const { productId } = req.body;
    
    const feedback = await Feedback.findById(feedbackId);
    if (!feedback) {
      res.status(404).json({ message: 'Feedback not found' });
      return;
    }

    // Find the product feedback and toggle its display status
    const productFeedback = feedback.productFeedback.find(
      pf => pf.productId.toString() === productId
    );

    if (!productFeedback) {
      res.status(404).json({ message: 'Product feedback not found' });
      return;
    }

    // Get count of displayed feedbacks for this product
    const displayedCount = feedback.productFeedback.filter(
      pf => pf.isDisplayed && pf.productId.toString() !== productId
    ).length;

    // Check if we're trying to display a new feedback
    if (!productFeedback.isDisplayed && displayedCount >= 3) {
      res.status(400).json({ 
        message: 'Maximum of 3 feedbacks can be displayed per product' 
      });
      return;
    }

    productFeedback.isDisplayed = !productFeedback.isDisplayed;
    await feedback.save();

    res.json(feedback);
  } catch (error) {
    res.status(500).json({ message: 'Error updating feedback display status' });
  }
};

// Add this new handler before the route definitions
const deleteFeedback: RequestHandler = async (req, res) => {
  try {
    await Feedback.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Error deleting feedback' });
  }
};

// Add these new handlers for admin profile management
const updateAdminProfile: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email } = req.body;
    
    if (!name || !email) {
      res.status(400).json({ message: 'Name and email are required' });
      return;
    }

    // Check if email is already taken by another user
    const existingUser = await User.findOne({ 
      email, 
      _id: { $ne: id } 
    });
    
    if (existingUser) {
      res.status(409).json({ message: 'Email already in use' });
      return;
    }
    
    const user = await User.findOneAndUpdate(
      { _id: id, role: 'admin' },
      { name, email },
      { new: true }
    ).select('-password');

    if (!user) {
      res.status(404).json({ message: 'Admin not found' });
      return;
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error updating admin profile' });
  }
};

const updateAdminPassword: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;
    
    const admin = await User.findOne({ _id: id, role: 'admin' });
    if (!admin) {
      res.status(404).json({ message: 'Admin not found' });
      return;
    }

    const isValidPassword = await bcrypt.compare(currentPassword, admin.password);
    if (!isValidPassword) {
      res.status(401).json({ message: 'Current password is incorrect' });
      return;
    }

    admin.password = await bcrypt.hash(newPassword, 10);
    await admin.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating password' });
  }
};

// Add these handlers before the route definitions
const getContacts: RequestHandler = async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.json(contacts);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching contacts' });
  }
};

const deleteContact: RequestHandler = async (req, res) => {
  try {
    await Contact.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Error deleting contact' });
  }
};

// Route definitions
router.get('/stats', getStats);
router.get('/users', getUsers);
router.post('/users', createUser);
router.delete('/users/:id', deleteUser);
router.patch('/users/:id/role', updateUserRole);
router.patch('/users/:id', updateUser);
router.patch('/users/:id/verify', updateUserVerification);
router.get('/orders', getOrders);
router.patch('/orders/:id/status', updateOrderStatus);
router.post('/orders/:id/refund-email', sendRefundEmail);
router.delete('/orders/:id', deleteOrder);
router.post('/products', createProduct);
router.patch('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);
router.get('/products', getProducts);
router.get('/products/:id', getProduct);
router.get('/users/:id/orders', getUserDetails);
router.get('/inventory/logs', getInventoryLogs);
router.patch('/inventory/update', updateInventory);
router.get('/coupons', getCoupons);
router.post('/coupons', createCoupon);
router.patch('/coupons/:id', updateCoupon);
router.delete('/coupons/:id', deleteCoupon);
router.get('/feedbacks', getFeedbacks);
router.patch('/feedbacks/:feedbackId/display', toggleFeedbackDisplay);
router.delete('/feedbacks/:id', deleteFeedback);
router.patch('/profile/:id', updateAdminProfile);
router.patch('/profile/:id/password', updateAdminPassword);
router.get('/contacts', getContacts);
router.delete('/contacts/:id', deleteContact);

export default router;
