import express, { Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import orderRoutes from './routes/orderRoutes';
import userRoutes from './routes/userRoutes';
import adminRoutes from './routes/adminRoutes';
import productRoutes from './routes/productRoutes'; // Add this line
import couponRoutes from './routes/couponRoutes';
import feedbackRoutes from './routes/feedbackRoutes';
import contactRoutes from './routes/contactRoutes';
import contentRoutes from './routes/contentRoutes';
import { createServer } from 'http';
import { initializeSocket } from './services/socketService';

dotenv.config();

const app: Application = express();
const httpServer = createServer(app);

app.use(cors({
  origin: 'http://localhost:5173', // Update this to match your frontend URL
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/products', productRoutes); // Add this line
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
    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 5000;
