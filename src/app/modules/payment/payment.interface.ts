export type IPayment = {
  transactionId: string;
  orderId: string;
  deliveryId: string;
  userId: string;
  amountPaid: number;
  paidAt: Date;
  status: string;
};
