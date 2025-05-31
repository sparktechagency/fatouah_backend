import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import { IPayment } from './payment.interface';
import { Payment } from './payment.model';

export async function savePaymentInfo(paymentData: IPayment) {
  const { transactionId } = paymentData;

  const payment = await Payment.findOne({ transactionId });

  if (payment) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Already exists');
  } else {
    const result = await Payment.create(paymentData)
    return result;
  }

}


