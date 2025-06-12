import { Router, RequestHandler } from 'express';
import { Product } from '../models/Product';

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

router.get('/', getProducts);
router.get('/:id', getProduct);

export default router;
