import Stripe from 'stripe';
import { IPayment } from '../app/modules/payment/payment.interface';
import { savePaymentInfo } from '../app/modules/payment/payment.service';
import stripe from '../config/stripe';


const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || 'YOUR_WEBHOOK_SECRET';

export async function handleStripeWebhook(rawBody: Buffer, signature: string) {
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, WEBHOOK_SECRET);
  } catch (err: any) {
    throw new Error(`Webhook signature verification failed: ${err.message}`);
  }

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;

    const paymentData: IPayment = {
      transactionId: paymentIntent.id,
      amountPaid: paymentIntent.amount / 100,
      paidAt: new Date(paymentIntent.created * 1000),
      orderId: paymentIntent.metadata.orderId || 'unknown',
      userId: paymentIntent.metadata.userId || 'unknown',
      status: paymentIntent.status,
    };

    return await savePaymentInfo(paymentData);
  }

  return { ignored: true };
}
