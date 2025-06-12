import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IVariant {
  name: string;
  price: number;
  inStock: boolean;
  stockQuantity: number; 
}

export interface IProduct extends Document {
  _id: Types.ObjectId;
  name: string;
  description: string;
  image: string;
  category: string;
  variants: IVariant[];
  isPopular: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const variantSchema = new Schema<IVariant>({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  inStock: { type: Boolean, default: true },
  stockQuantity: { type: Number, default: 0 } // Add this line
});

const productSchema = new Schema<IProduct>({
  name: { type: String, required: true },
  description: { type: String, required: true },
  image: { type: String, required: true },
  category: { 
    type: String, 
    required: true,
    enum: ['classic', 'nuts', 'chocolate', 'special']
  },
  variants: [variantSchema],
  isPopular: { type: Boolean, default: false }
}, {
  timestamps: true
});

export const Product = mongoose.model<IProduct>('Product', productSchema);
