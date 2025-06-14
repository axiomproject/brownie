import express, { Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import orderRoutes from './routes/orderRoutes';
import userRoutes from './routes/userRoutes';
import adminRoutes from './routes/adminRoutes';
import productRoutes from './routes/productRoutes';
import couponRoutes from './routes/couponRoutes';
import feedbackRoutes from './routes/feedbackRoutes';
import contactRoutes from './routes/contactRoutes';
import contentRoutes from './routes/contentRoutes';
import { createServer } from 'http';
import { initializeSocket } from './services/socketService';

dotenv.config();

const app: Application = express();
const httpServer = createServer(app);

// Move PORT declaration before usage
const PORT = process.env.PORT || 5000;

// Updated CORS configuration
app.use(cors({
  origin: '*', // Allow all origins in development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept'],
}));

// Add headers middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE');
  res.header('Access-Control-Expose-Headers', 'Content-Length');
  res.header('Access-Control-Allow-Headers', 'Accept, Authorization, Content-Type, X-Requested-With, Range');
  next();
});

// Add error handling middleware
app.use((err: any, req: any, res: any, next: any) => {
  console.error('Global error:', err);
  res.status(500).json({ 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Debugging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

app.use(express.json());

// Routes
app.use('/api/products', productRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/contact', contactRoutes);

// Initialize Socket.IO
initializeSocket(httpServer);

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI!)
  .then(() => {
    console.log('Connected to MongoDB');
    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => console.error('MongoDB connection error:', err));
