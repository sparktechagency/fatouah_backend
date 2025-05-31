import Stripe from 'stripe';
import { IPayment } from '../app/modules/payment/payment.interface';
import { savePaymentInfo } from '../app/modules/payment/payment.service';
import stripe from '../config/stripe';


const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!;

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
      amountPaid: paymentIntent.amount / 100, // Stripe amount is in cents
      paidAt: new Date(paymentIntent.created * 1000), // Unix timestamp to Date
      orderId: paymentIntent.metadata.orderId || 'unknown',
      deliveryId: paymentIntent.metadata.deliveryId || "unknown",
      userId: paymentIntent.metadata.userId || 'unknown',
      status: paymentIntent.status,
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

  // Ignore other event types
  return { ignored: true };
}

