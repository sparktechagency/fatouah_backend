import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import { IPayment } from './payment.interface';
import { Payment } from './payment.model';
import { User } from '../user/user.model';
import stripe from '../../../config/stripe';

export async function savePaymentInfo(paymentData: IPayment) {
  const { transactionId } = paymentData;

  const payment = await Payment.findOne({ transactionId });

  if (payment) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Already exists');
  } else {
    const result = await Payment.create(paymentData);
    return result;
  }
}

// Create or get Stripe account
export async function createOrGetStripeAccount(
  userId: string,
): Promise<string> {
  const rider = await User.findById(userId);
  if (!rider) throw new Error('Rider not found');

  if (!rider.email) throw new Error('Rider email missing');

  if (rider.stripeAccountId) return rider.stripeAccountId;

  const account = await stripe.accounts.create({
    type: 'express',
    email: rider.email,
  });

  await User.findByIdAndUpdate(userId, { stripeAccountId: account.id });

  return account.id;
}

// Generate Stripe onboarding link
export async function createStripeOnboardingLink(
  stripeAccountId: string,
): Promise<string> {
  const accountLink = await stripe.accountLinks.create({
    account: stripeAccountId,
    refresh_url: 'https://yourapp.com/reauth',
    return_url: 'https://yourapp.com/success',
    type: 'account_onboarding',
  });

  return accountLink.url;
}
