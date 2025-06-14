import { Router } from 'express';
import type { Request, Response, RequestHandler } from 'express';
import { Feedback } from '../models/Feedback';
import { emitNotification } from '../services/socketService';
import { Notification } from '../models/Notification';
import mongoose from 'mongoose';

interface ProductFeedbackRequest {
  orderId: string;
  feedback: Array<{
    productId: string;
    productName: string;
    variantName: string;
    rating: number;
    comment?: string;
  }>;
}

// Define custom param interfaces
interface ProductIdParam {
  productId: string;
}

const router = Router();

// Helper function to create typed route handlers
const asyncHandler = <P = any, ResBody = any, ReqBody = any>(
  fn: (req: Request<P, ResBody, ReqBody>, res: Response<ResBody>) => Promise<void>
): RequestHandler<P, ResBody, ReqBody> => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res)).catch(next);
  };
};

router.post('/', async (req: Request<{}, {}, ProductFeedbackRequest>, res: Response) => {
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
router.get('/', async (req: Request, res: Response) => {
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

// Update the route handler with proper types
router.get('/product/:productId', asyncHandler<ProductIdParam>(async (req, res) => {
  try {
    const { productId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      console.error('Invalid product ID format:', productId);
      res.status(400).json({ message: 'Invalid product ID format' });
      return;
    }

    // First, find the product name to match against
    if (!mongoose.connection.db) {
      throw new Error('Database connection not established');
    }
    const product = await mongoose.connection.db.collection('products').findOne({
      _id: new mongoose.Types.ObjectId(productId)
    });

    if (!product) {
      console.log('Debug: Product not found:', productId);
      res.json([]);
      return;
    }

    console.log('Debug: Found product:', {
      id: product._id,
      name: product.name
    });

    // Now find feedbacks by product name
    const feedbacks = await Feedback.aggregate([
      {
        $unwind: '$productFeedback'
      },
      {
        $match: {
          'productFeedback.isDisplayed': true,
          'productFeedback.productName': product.name
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
        $unwind: {
          path: '$order',
          preserveNullAndEmptyArrays: true
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
        $project: {
          _id: 1,
          rating: '$productFeedback.rating',
          comment: '$productFeedback.comment',
          productName: '$productFeedback.productName',
          variantName: '$productFeedback.variantName',
          createdAt: 1,
          customerName: {
            $cond: {
              if: { $gt: [{ $size: '$userInfo' }, 0] },
              then: { $arrayElemAt: ['$userInfo.name', 0] },
              else: { 
                $cond: {
                  if: '$order.email',
                  then: 'Guest User',
                  else: 'Anonymous'
                }
              }
            }
          }
        }
      },
      {
        $sort: {
          createdAt: -1
        }
      }
    ]);

    console.log('Debug: Found feedbacks:', {
      productName: product.name,
      count: feedbacks.length,
      feedbacks: feedbacks.map(f => ({
        rating: f.rating,
        productName: f.productName,
        customerName: f.customerName
      }))
    });

    res.json(feedbacks);
  } catch (error) {
    console.error('Error in feedback route:', error);
    res.status(500).json({ 
      message: 'Error fetching feedback',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

// Add a new helper route to verify data
router.get('/verify/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const feedbacks = await Feedback.find().lean();
    
    const analysis = feedbacks.map(f => ({
      feedbackId: f._id,
      matchingProducts: f.productFeedback.map(pf => ({
        storedId: pf.productId.toString(),
        matches: pf.productId.toString() === productId,
        productName: pf.productName,
        isDisplayed: pf.isDisplayed
      }))
    }));

    res.json({
      lookingFor: productId,
      totalFeedbacks: feedbacks.length,
      analysis
    });
  } catch (error) {
    res.status(500).json({ error: 'Error verifying data' });
  }
});

// Add a helper endpoint to check feedback structure
router.get('/debug/:productId', async (req: Request<{ productId: string }>, res: Response) => {
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
router.get('/all', async (req: Request, res: Response) => {
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

// Add debug route
router.get('/debug-ids/:productId', async (req: Request<{ productId: string }>, res: Response) => {
  try {
    const { productId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      res.status(400).json({ message: 'Invalid product ID format' });
      return;
    }

    const productObjectId = new mongoose.Types.ObjectId(productId);
    const allFeedbacks = await Feedback.find({
      'productFeedback.productId': productObjectId
    }).lean();

    res.json({
      requestedId: productId,
      totalFeedbacks: allFeedbacks.length,
      feedbacks: allFeedbacks.map(f => ({
        feedbackId: f._id,
        productFeedbacks: f.productFeedback
          .filter(pf => pf.productId.toString() === productId)
          .map(pf => ({
            productId: pf.productId.toString(),
            productName: pf.productName,
            isDisplayed: pf.isDisplayed,
            rating: pf.rating
          }))
      }))
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Update debug route with proper types
router.get('/raw-feedbacks/:productId', asyncHandler<ProductIdParam>(async (req, res) => {
  try {
    const { productId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      res.status(400).json({ message: 'Invalid product ID format' });
      return;
    }

    // Get all feedbacks and convert productIds to strings for comparison
    const allFeedbacks = await Feedback.find().lean();
    
    console.log('Debug: Input productId:', productId);
    console.log('Debug: Total feedbacks found:', allFeedbacks.length);
    
    // Log all product IDs in the system for debugging
    const allProductIds = allFeedbacks.flatMap(f => 
      f.productFeedback.map(pf => ({
        feedbackId: f._id,
        productId: pf.productId.toString(),
        productName: pf.productName
      }))
    );
    console.log('Debug: All product IDs in feedbacks:', allProductIds);

    // Find feedbacks that contain the product ID
    const relevantFeedbacks = allFeedbacks.filter(feedback => {
      const matches = feedback.productFeedback.some(pf => {
        const pfIdString = pf.productId.toString();
        const isMatch = pfIdString === productId;
        console.log('Debug: Comparing:', {
          feedbackId: feedback._id,
          feedbackProductId: pfIdString,
          searchProductId: productId,
          isMatch
        });
        return isMatch;
      });
      return matches;
    });

    console.log('Debug: Matching feedbacks found:', relevantFeedbacks.length);

    const response = {
      requestedProductId: productId,
      totalFeedbacks: allFeedbacks.length,
      matchingFeedbacks: relevantFeedbacks.length,
      feedbacks: relevantFeedbacks.map(f => ({
        feedbackId: f._id,
        orderId: f.orderId,
        productFeedbacks: f.productFeedback.map(pf => ({
          productId: pf.productId.toString(),
          productName: pf.productName,
          isDisplayed: pf.isDisplayed,
          matches: pf.productId.toString() === productId
        }))
      }))
    };

    console.log('Debug: Final response:', JSON.stringify(response, null, 2));
    res.json(response);
  } catch (error) {
    console.error('Error in raw-feedbacks route:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

// Add this diagnostic route
router.get('/diagnose/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    
    // Get raw feedback data
    const allFeedbacks = await Feedback.find().lean();
    
    // Map the product IDs for comparison
    const productIdMap = allFeedbacks.flatMap(feedback => 
      feedback.productFeedback.map(pf => ({
        feedbackId: feedback._id,
        orderId: feedback.orderId,
        productId: pf.productId.toString(),
        productName: pf.productName,
        isDisplayed: pf.isDisplayed,
        matches: pf.productId.toString() === productId
      }))
    );

    res.json({
      searchingFor: productId,
      totalFeedbacks: allFeedbacks.length,
      productIdMap,
      exactMatches: productIdMap.filter(item => item.matches)
    });

  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
