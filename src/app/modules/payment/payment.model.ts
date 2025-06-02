import { model, Schema } from 'mongoose';
import { IPayment } from './payment.interface';

const paymentSchema = new Schema<IPayment>({
  transactionId: { type: String, required: true, unique: true },
  deliveryId: { type: String, required: true, ref: "Delivery" },
  userId: { type: String, required: true },
  amountPaid: { type: Number, required: true },
  paidAt: { type: Date, required: true },
  status: { type: String, required: true },
});

export const Payment = model<IPayment>('Payment', paymentSchema);
