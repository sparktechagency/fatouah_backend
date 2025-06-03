import { model, Schema } from 'mongoose';
import { IPayment } from './payment.interface';

const paymentSchema = new Schema<IPayment>(
  {
    transactionId: { type: String, required: true, unique: true },
    paymentIntentId: {
      type: String,
      required: true,
    },
    deliveryId: { type: String, required: true, ref: 'Delivery' },
    userId: { type: String, required: true },
    amountPaid: { type: Number, required: true },
    paidAt: { type: Date, required: true },
    status: { type: String, required: true },
    refunded: {
      type: Boolean,
    },
    refundId: {
      type: String,
    },
    commissionAmount: {
      type: Number,
    },
    riderAmount: {
      type: Number,
    },
    isTransferred: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const Payment = model<IPayment>('Payment', paymentSchema);
