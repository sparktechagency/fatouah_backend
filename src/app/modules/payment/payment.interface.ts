export type IPayment = {
  transactionId: string;
  deliveryId: string;
  userId: string;
  amountPaid: number;
  paidAt: Date;
  status: string;
};
