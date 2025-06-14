import { Router, RequestHandler } from 'express';
import { Contact } from '../models/Contact';

const router = Router();

const submitContact: RequestHandler = async (req, res) => {
  try {
    const contact = new Contact(req.body);
    await contact.save();
    res.status(201).json({ message: 'Message sent successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error submitting message' });
  }
};

router.post('/', submitContact);

export default router;
