import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
  type: string;
  message: string;
  read: boolean;
  createdAt: Date;
  data?: any;
}

const notificationSchema = new Schema({
  type: { type: String, required: true },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  data: { type: Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now }
});

export const Notification = mongoose.model<INotification>('Notification', notificationSchema);
