import { Types } from 'mongoose';

export type TNotification = {
  title?: string;
  message: string;
  receiver: Types.ObjectId;
  read: boolean;
  delivery?: any;
  type?: 'ADMIN' | 'SYSTEM' | 'PAYMENT' | 'MESSAGE' | 'ALERT';
};
