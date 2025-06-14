import { Router } from 'express';
import { Feedback } from '../models/Feedback';
import { emitNotification } from '../services/socketService';
import { Notification } from '../models/Notification';
import mongoose from 'mongoose';

const router = Router();

router.post('/', async (req, res) => {
  try {
    console.log('Received feedback request:', req.body); // Debug log

    const { orderId, feedback } = req.body;

    // More detailed validation
    if (!orderId) {
      res.status(400).json({ message: 'Order ID is required' });
      return;
    }

    if (!feedback || !Array.isArray(feedback)) {
      res.status(400).json({ message: 'Feedback must be an array' });
      return;
    }

    // Ensure orderId is a valid MongoDB ObjectId
    let orderObjectId;
    try {
      orderObjectId = new mongoose.Types.ObjectId(orderId);
    } catch (error) {
      res.status(400).json({ message: 'Invalid order ID format' });
      return;
    }

    // Validate each feedback item
    const validatedFeedback = feedback.map(item => {
      // Convert productId to ObjectId and validate
      let productObjectId;
      try {
        productObjectId = new mongoose.Types.ObjectId(item.productId);
      } catch (error) {
        throw new Error(`Invalid product ID format: ${item.productId}`);
      }

      if (!item.productName || typeof item.productName !== 'string') {
        throw new Error('Product name is required');
      }

      if (!item.variantName || typeof item.variantName !== 'string') {
        throw new Error('Variant name is required');
      }

      if (!item.rating || typeof item.rating !== 'number' || item.rating < 1 || item.rating > 5) {
        throw new Error('Rating must be a number between 1 and 5');
      }

      if (!item.comment || typeof item.comment !== 'string') {
        throw new Error('Comment is required and must be a string');
      }

      return {
        productId: productObjectId,
        productName: item.productName,
        variantName: item.variantName,
        rating: item.rating,
        comment: item.comment
      };
    });

    const newFeedback = new Feedback({
      orderId: orderObjectId,
      productFeedback: validatedFeedback
    });

    const savedFeedback = await newFeedback.save();
    console.log('Saved feedback:', savedFeedback); // Debug log

    // Create notification
    const notification = await Notification.create({
      type: 'FEEDBACK',
      message: `New feedback received for order #${orderId.slice(-6)}`,
      data: {
        orderId: orderObjectId,
        feedbackId: savedFeedback._id,
        itemCount: feedback.length,
        ratings: feedback.map(item => item.rating)
      }
    });

    emitNotification({
      type: 'FEEDBACK',
      message: `New feedback received for order #${orderId.slice(-6)}`,
      timestamp: new Date(),
      data: {
        orderId: orderObjectId,
        feedbackId: savedFeedback._id,
        itemCount: feedback.length,
        ratings: feedback.map(item => item.rating)
      }
    });

    res.status(201).json({
      message: 'Feedback submitted successfully',
      feedback: savedFeedback
    });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(400).json({
      message: 'Error submitting feedback',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Add route to fetch all feedback
router.get('/', async (req, res) => {
  try {
    const feedbacks = await Feedback.find()
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(feedbacks);
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({ message: 'Error fetching feedback' });
  }
});

export default router;
