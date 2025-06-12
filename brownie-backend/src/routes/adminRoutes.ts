import { Router, RequestHandler } from 'express';
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth';
import { User } from '../models/User';
import { Product } from '../models/Product';
import { Order } from '../models/Order';
import { InventoryLog } from '../models/InventoryLog';
import { Coupon } from '../models/Coupon';
import bcrypt from 'bcryptjs';

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

    res.json({
      totalUsers: users,
      totalOrders: allOrders.length,
      totalRevenue,
      totalProducts,
      lowStockProducts,
      ordersByStatus,
      revenueData: completeRevenueData,
      recentOrders: allOrders.slice(0, 5)
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: 'Error fetching stats' });
  }
};

const getUsers: RequestHandler = async (req, res) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    console.log('Retrieved users:', users); // Debug log
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
    if (!['received', 'baking', 'out for delivery', 'delivered'].includes(status)) {
      res.status(400).json({ message: 'Invalid status' });
      return;
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('user', 'name email');

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Error updating order status' });
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

// Route definitions
router.get('/stats', getStats);
router.get('/users', getUsers);
router.post('/users', createUser);
router.delete('/users/:id', deleteUser);
router.patch('/users/:id/role', updateUserRole);
router.patch('/users/:id', updateUser);
router.get('/orders', getOrders);
router.patch('/orders/:id/status', updateOrderStatus);
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

export default router;
