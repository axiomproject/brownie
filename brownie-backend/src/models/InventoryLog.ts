import mongoose, { Schema, Document } from 'mongoose';

interface IInventoryLog extends Document {
  productId: mongoose.Types.ObjectId;
  variantName: string;
  previousQuantity: number;
  newQuantity: number;
  changeType: 'increment' | 'decrement' | 'manual' | 'order';
  reason: string;
  updatedBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

const inventoryLogSchema = new Schema({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  variantName: { type: String, required: true },
  previousQuantity: { type: Number, required: true },
  newQuantity: { type: Number, required: true },
  changeType: { type: String, enum: ['increment', 'decrement', 'manual', 'order'], required: true },
  reason: { type: String, required: true },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
});

export const InventoryLog = mongoose.model<IInventoryLog>('InventoryLog', inventoryLogSchema);
