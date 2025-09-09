import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import { IPayment } from './payment.interface';
import { Payment } from './payment.model';
import { User } from '../user/user.model';
import stripe from '../../../config/stripe';
import { JwtPayload } from 'jsonwebtoken';

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

// create or get Stripe account
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

// export const createOrGetStripeAccountValidated = async (userId: string) => {
//   const rider = await User.findById(userId);
//   if (!rider) throw new Error('Rider not found');
//   if (!rider.email) throw new Error('Rider email missing');

//   let accountId = rider.stripeAccountId;

//   if (!accountId) {
//     // Start session to prevent double creation
//     const session = await User.startSession();
//     session.startTransaction();
//     try {
//       const freshRider = await User.findById(userId).session(session);
//       if (!freshRider) throw new Error('Rider not found in transaction');

//       if (!freshRider.stripeAccountId) {
//         const account = await stripe.accounts.create({
//           type: 'express',
//           email: rider.email,
//         });

//         freshRider.stripeAccountId = account.id;
//         await freshRider.save({ session });
//         accountId = account.id;
//       } else {
//         accountId = freshRider.stripeAccountId;
//       }

//       await session.commitTransaction();
//     } catch (err: any) {
//       await session.abortTransaction();
//       console.error("Stripe account creation failed:", err);
//       return { valid: false, message: "Stripe connect account creation failed", error: err.message };
//     } finally {
//       session.endSession();
//     }
//   }

//   // Validation may be pending at first
//   return { accountId, valid: rider.stripeValidated ?? null, message: "Validation pending" };
// };


// generate Stripe onboarding link
export async function createStripeOnboardingLink(
  stripeAccountId: string,
): Promise<string> {
  const accountLink = await stripe.accountLinks.create({
    account: stripeAccountId,
    refresh_url: 'https://yourapp.com/reauth',
    return_url: 'http://10.10.7.111:5000/stripe/success',
    type: 'account_onboarding',
  });

  return accountLink.url;
}

export const getStripeLoginLinkForRider = async (user: JwtPayload) => {
  const rider = await User.findById(user.id);

  if (!rider || !rider.stripeAccountId) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'Rider or Stripe account not found',
    );
  }

  const loginLink = await stripe.accounts.createLoginLink(
    rider.stripeAccountId,
  );
  return loginLink.url;
};

export const refundIfNeeded = async (deliveryId: string) => {
  const payment = await Payment.findOne({ deliveryId });

  if (payment && payment.paymentIntentId && !payment.refunded) {
    try {
      const refund = await stripe.refunds.create({
        payment_intent: payment.paymentIntentId,
      });

      payment.refunded = true;
      payment.refundId = refund.id;

      await payment.save();

      console.log('✅ Auto-refund successful:', refund.id);
    } catch (err: any) {
      console.error('❌ Auto-refund failed:', err.message);
    }
  } else {
    console.warn('⚠️ No refundable payment found or already refunded');
  }
};
