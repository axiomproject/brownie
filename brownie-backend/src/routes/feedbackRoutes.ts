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
    const orderObjectId = new mongoose.Types.ObjectId(orderId);

    // Log incoming productIds for debugging
    console.log('Debug: Incoming product IDs:', feedback.map(f => f.productId));

    // Validate each feedback item
    const validatedFeedback = feedback.map(item => {
      try {
        // Important: Use the exact productId from the request without creating a new one
        const productObjectId = new mongoose.Types.ObjectId(item.productId);
        console.log('Debug: Processing feedback for product:', productObjectId.toString());
        console.log('Debug: Feedback comment:', item.comment); // Add debug log

        return {
          productId: productObjectId,
          productName: item.productName,
          variantName: item.variantName,
          rating: item.rating,
          comment: item.comment || '', // Ensure comment is included, default to empty string if undefined
          isDisplayed: true
        };
      } catch (error) {
        console.error('Error processing feedback item:', error);
        throw new Error(`Invalid product ID format: ${item.productId}`);
      }
    });

    // Log the validated feedback
    console.log('Debug: Validated feedback product IDs:', 
      validatedFeedback.map(f => f.productId.toString())
    );

    const newFeedback = new Feedback({
      orderId: orderObjectId,
      productFeedback: validatedFeedback
    });

    const savedFeedback = await newFeedback.save();
    console.log('Debug: Saved feedback product IDs:', 
      savedFeedback.productFeedback.map(f => f.productId.toString())
    );

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

// Add new route to fetch feedback by product ID
router.get('/product/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    console.log('Debug: Starting feedback fetch for productId:', productId);

    // Convert productId to ObjectId
    const productObjectId = new mongoose.Types.ObjectId(productId);

    // Find feedbacks with detailed debug logging
    const feedbacks = await Feedback.aggregate([
      { 
        $unwind: '$productFeedback' 
      },
      {
        $match: {
          'productFeedback.productId': productObjectId,
          'productFeedback.isDisplayed': true
        }
      },
      {
        $lookup: {
          from: 'orders',
          localField: 'orderId',
          foreignField: '_id',
          as: 'order'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'order.user',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      {
        $addFields: {
          debugInfo: {
            queryProductId: { $toString: productObjectId },
            feedbackProductId: { $toString: '$productFeedback.productId' },
            isMatch: { $eq: ['$productFeedback.productId', productObjectId] }
          }
        }
      },
      {
        $project: {
          _id: 1,
          rating: '$productFeedback.rating',
          comment: '$productFeedback.comment',
          productName: '$productFeedback.productName',
          variantName: '$productFeedback.variantName',
          createdAt: 1,
          debugInfo: 1,
          customerName: {
            $cond: {
              if: { $gt: [{ $size: '$userInfo' }, 0] },
              then: { $arrayElemAt: ['$userInfo.name', 0] },
              else: {
                $cond: {
                  if: { $gt: [{ $size: '$order' }, 0] },
                  then: 'Guest Order',
                  else: 'Unknown Customer'
                }
              }
            }
          }
        }
      },
      { $sort: { createdAt: -1 } }
    ]);

    // Add more detailed debug logging
    console.log('Debug: Query productId:', productId);
    console.log('Debug: Query ObjectId:', productObjectId);
    console.log('Debug: First stage matches:', await Feedback.find({
      'productFeedback.productId': productObjectId
    }).lean());
    console.log('Debug: Final aggregation result:', feedbacks);

    // Add verification of data
    const allFeedbacks = await Feedback.find().lean();
    console.log('Debug: All feedbacks in system:', 
      allFeedbacks.map(f => ({
        id: f._id,
        productFeedbacks: f.productFeedback.map(pf => ({
          productId: pf.productId.toString(),
          productName: pf.productName
        }))
      }))
    );

    res.json(feedbacks);
  } catch (error) {
    console.error('Error in feedback route:', error);
    res.status(500).json({ 
      message: 'Error fetching feedback', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Add a helper endpoint to check feedback structure
router.get('/debug/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const rawFeedbacks = await Feedback.find().lean();
    res.json({
      totalFeedbacks: rawFeedbacks.length,
      feedbacksWithProduct: rawFeedbacks.filter(f => 
        f.productFeedback.some(pf => pf.productId.toString() === productId)
      ),
      query: {
        productId,
        condition: { 'productFeedback.productId': productId }
      }
    });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Add this helper route to assist in debugging
router.get('/all', async (req, res) => {
  try {
    const allFeedbacks = await Feedback.find().lean();
    res.json({
      feedbacks: allFeedbacks,
      productIds: allFeedbacks.flatMap(f => 
        f.productFeedback.map(pf => ({
          feedbackId: f._id,
          productId: pf.productId.toString(),
          productName: pf.productName
        }))
      )
    });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching all feedbacks' });
  }
});

export default router;
