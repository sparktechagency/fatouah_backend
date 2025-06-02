import Stripe from 'stripe';
import { IPayment } from '../app/modules/payment/payment.interface';
import { savePaymentInfo } from '../app/modules/payment/payment.service';
import stripe from '../config/stripe';
import config from '../config';
import { Delivery } from '../app/modules/delivery/delivery.model';
import { User } from '../app/modules/user/user.model';
import { IOrder } from '../app/modules/order/order.interface';
import ApiError from '../errors/ApiError';
import { StatusCodes } from 'http-status-codes';

const WEBHOOK_SECRET = config.stripe_webhook_secret!;

export async function transferToRider({
  stripeAccountId,
  amount,
  orderId,
}: {
  stripeAccountId: string;
  amount: number; // in dollars
  orderId: string;
}) {
  const transfer = await stripe.transfers.create({
    amount: Math.round(amount * 100), // in cents
    currency: 'usd',
    destination: stripeAccountId,
    metadata: {
      orderId,
    },
  });

  return transfer;
}

export async function handleStripeWebhook(rawBody: Buffer, signature: string) {
  let event: Stripe.Event;

  try {
    // Construct event with Stripe signature
    event = stripe.webhooks.constructEvent(rawBody, signature, WEBHOOK_SECRET);
  } catch (err: any) {
    // Signature verification failed
    throw new Error(`Webhook signature verification failed: ${err.message}`);
  }

  // Handle only payment success event
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;

    const paymentData: IPayment = {
      transactionId: paymentIntent.id,
      paymentIntentId: paymentIntent.id,
      refunded: false,
      refundId: '',
      amountPaid: paymentIntent.amount / 100, // Stripe amount is in cents
      paidAt: new Date(paymentIntent.created * 1000), // Unix timestamp to Date
      deliveryId: paymentIntent.metadata.deliveryId || 'unknown',
      userId: paymentIntent.metadata.userId || 'unknown',
      status: paymentIntent.status,
      commissionAmount:
        parseFloat(paymentIntent.metadata.commissionAmount) || 0,
      riderAmount: parseFloat(paymentIntent.metadata.riderAmount) || 0,
    };

    try {
      const savedPayment = await savePaymentInfo(paymentData);
      return { saved: savedPayment };
    } catch (error: any) {
      if (error.message.includes('Already exists')) {
        return { alreadyExists: true };
      }
      throw error;
    }
  }

  // if (event.type === 'payment_intent.requires_capture' as Stripe.Event['type']) {
  //   const paymentIntent = event.data.object as Stripe.PaymentIntent;

  //   // Save Payment
  //   const paymentData: IPayment = {
  //     transactionId: paymentIntent.id,
  //     amountPaid: paymentIntent.amount / 100,
  //     paidAt: new Date(paymentIntent.created * 1000),
  //     deliveryId: paymentIntent.metadata.deliveryId,
  //     userId: paymentIntent.metadata.userId,
  //     status: paymentIntent.status,
  //   };

  //   const savedPayment = await savePaymentInfo(paymentData);

  //   // // Now, get Delivery & Order info
  //   // const delivery = await Delivery.findById(paymentIntent.metadata.deliveryId)
  //   //   .populate<{ order: IOrder }>('order');

  //   // if (!delivery) {
  //   //   throw new ApiError(StatusCodes.BAD_REQUEST, "No delivery data found")
  //   // }

  //   // // Step 2: Get rider
  //   // const riderId = delivery?.rider;
  //   // const order = delivery?.order;

  //   // if (!riderId) {
  //   //   console.warn('No rider assigned yet');
  //   //   return { saved: savedPayment, riderTransferSkipped: true };
  //   // }

  //   // const rider = await User.findById(riderId);
  //   // if (!rider?.stripeAccountId) {
  //   //   console.warn('Rider has no Stripe account');
  //   //   return { saved: savedPayment, riderTransferSkipped: true };
  //   // }
  //   // console.log(rider.stripeAccountId, "Stripe Account ID")
  //   // // Log financial breakdown
  //   // console.log('Delivery Charge:', order.deliveryCharge);
  //   // console.log('Commission (Platform):', order.commissionAmount);
  //   // console.log('Rider Amount:', order.riderAmount);

  //   // // Transfer to rider
  //   // const transfer = await transferToRider({
  //   //   stripeAccountId: rider.stripeAccountId,
  //   //   amount: order.riderAmount,
  //   //   orderId: order._id.toString(),
  //   // });

  //   return { saved: savedPayment };
  // }

  // Ignore other event types
  return { ignored: true };
}
