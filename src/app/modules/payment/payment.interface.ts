import { Schema } from "mongoose";

export type IPayment = {
  transactionId: string;
  paymentIntentId: string;
  deliveryId: Schema.Types.ObjectId;
  userId: string;
  amountPaid: number;
  paidAt: Date;
  status: string;
  refunded?: boolean;
  refundId?: string;
  commissionAmount: number;
  riderAmount: number;
  isTransferred: Boolean;
};
