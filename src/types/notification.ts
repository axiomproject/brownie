export interface Notification {
  _id: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: Date;
  data?: any;
}
