import { Router, RequestHandler } from 'express';
import { Product } from '../models/Product';
import { Feedback } from '../models/Feedback';
import mongoose from 'mongoose';

const router = Router();

const getProducts: RequestHandler = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching products' });
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

router.get('/:productId/feedbacks', async (req, res) => {
  try {
    const { productId } = req.params;
    
    const feedbacks = await Feedback.aggregate([
      { $unwind: '$productFeedback' },
      {
        $match: {
          'productFeedback.productId': new mongoose.Types.ObjectId(productId),
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
          as: 'user'
        }
      },
      {
        $project: {
          rating: '$productFeedback.rating',
          comment: '$productFeedback.comment',
          productName: '$productFeedback.productName',
          variantName: '$productFeedback.variantName',
          createdAt: 1,
          user: {
            $cond: {
              if: { $gt: [{ $size: '$user' }, 0] },
              then: { name: { $arrayElemAt: ['$user.name', 0] } },
              else: null
            }
          }
        }
      },
      { $limit: 3 }
    ]);

    res.json(feedbacks);
  } catch (error) {
    console.error('Error fetching product feedbacks:', error);
    res.status(500).json({ message: 'Error fetching product feedbacks' });
  }
});

router.get('/', getProducts);
router.get('/:id', getProduct);

export default router;
