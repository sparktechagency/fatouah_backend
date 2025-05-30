export type IPayment = {
  transactionId: string;
  orderId: string;
  userId: string;
  amountPaid: number;
  paidAt: Date;
  status: string;
};
