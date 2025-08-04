import Stripe from 'stripe';
import { IPayment } from '../app/modules/payment/payment.interface';
import { savePaymentInfo } from '../app/modules/payment/payment.service';
import stripe from '../config/stripe';
import config from '../config';
import { IOrder } from '../app/modules/order/order.interface';
import { generateOrderId } from '../helpers/generateOrderId';
import { Order } from '../app/modules/order/order.model';
import { Delivery } from '../app/modules/delivery/delivery.model';
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
    transfer_group: `order_${orderId}`,
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

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;

    const payload: IOrder = JSON.parse(paymentIntent.metadata.jsonOrder);
    const userId = paymentIntent.metadata.userId;
    const distance = parseFloat(paymentIntent.metadata.distance);
    const deliveryCharge = parseFloat(paymentIntent.metadata.deliveryCharge);
    const commissionAmount = parseFloat(
      paymentIntent.metadata.commissionAmount,
    );
    const riderAmount = parseFloat(paymentIntent.metadata.riderAmount);

    const orderId = await generateOrderId();

    const order = await Order.create({
      ...payload,
      orderId,
      user: userId,
      distance,
      deliveryCharge,
      commissionAmount,
      riderAmount,
    });

    const delivery = await Delivery.create({
      order: order._id,
      orderId,
      status: 'REQUESTED',
    });

    const paymentData: IPayment = {
      transactionId: paymentIntent.id,
      paymentIntentId: paymentIntent.id,
      refunded: false,
      refundId: '',
      amountPaid: paymentIntent.amount / 100,
      paidAt: new Date(paymentIntent.created * 1000),
      deliveryId: delivery._id as any,
      userId: userId,
      status: paymentIntent.status,
      commissionAmount,
      riderAmount,
      isTransferred: false,
    };

    await savePaymentInfo(paymentData);

    return { orderCreated: order._id };
  }

  // Ignore other event types
  return { ignored: true };
}
