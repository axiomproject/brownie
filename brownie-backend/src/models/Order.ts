import mongoose from 'mongoose';

export interface IOrder extends mongoose.Document {
  _id: string;
  user?: mongoose.Types.ObjectId;
  items: Array<{
    productId: mongoose.Types.ObjectId;
    name: string;
    price: number;
    quantity: number;
    variantName: string;
  }>;
  totalAmount: number;
  status: string;
  email?: string;
  createdAt: Date;
}

const orderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, required: true }, // Changed to ObjectId
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  variantName: { type: String, required: true } // Made required
});

const deliveryDetailsSchema = new mongoose.Schema({
  riderName: { type: String, required: true },
  riderContact: { type: String, required: true },
  trackingLink: { type: String, default: '' }
});

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false }, // Made user optional
  items: [orderItemSchema],
  totalAmount: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['received', 'baking', 'out for delivery', 'delivered', 'refunded'],
    default: 'received'
  },
  shippingAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String
  },
  paymentMethod: {
    type: String,
    enum: ['gcash', 'grab_pay'],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed'],
    default: 'pending'
  },
  paymentSourceId: String, // Store PayMongo source ID
  email: String, // Add this field for guest orders
  coupon: {
    code: { type: String },
    type: {
      type: String,
      enum: ['fixed', 'product']
    },
    value: { type: Number }
  },
  deliveryDetails: deliveryDetailsSchema
}, {
  timestamps: true
});

export const Order = mongoose.model<IOrder>('Order', orderSchema);
