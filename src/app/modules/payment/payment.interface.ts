export type IPayment = {
  transactionId: string;
  paymentIntentId: string;
  deliveryId: string;
  userId: string;
  amountPaid: number;
  paidAt: Date;
  status: string;
  refunded?: boolean;
  refundId?: string;
};
