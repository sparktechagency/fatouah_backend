import { Types } from 'mongoose';

export type INotification = {
  title?: string;
  receiver?: Types.ObjectId;
  read: boolean;
  riderId: string;
  orderId: string;
  sender: Types.ObjectId;
  delivery?: any;
};
