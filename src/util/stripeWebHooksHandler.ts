import Stripe from 'stripe';
import { savePaymentInfo } from '../app/modules/payment/payment.service';
import stripe from '../config/stripe';
import config from '../config';
import { generateOrderId } from '../helpers/generateOrderId';
import { Order } from '../app/modules/order/order.model';
import { Delivery } from '../app/modules/delivery/delivery.model';
import { Payment } from '../app/modules/payment/payment.model';
import { User } from '../app/modules/user/user.model';
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

// export async function handleStripeWebhook(rawBody: Buffer, signature: string) {
//   let event: Stripe.Event;

//   try {
//     // construct event with Stripe signature
//     event = stripe.webhooks.constructEvent(rawBody, signature, WEBHOOK_SECRET);
//   } catch (err: any) {
//     // signature verification failed
//     throw new Error(`Webhook signature verification failed: ${err.message}`);
//   }

//   if (event.type === 'payment_intent.succeeded') {
//     const paymentIntent = event.data.object as Stripe.PaymentIntent;

//     const payload: IOrder = JSON.parse(paymentIntent.metadata.jsonOrder);
//     const userId = paymentIntent.metadata.userId;
//     const distance = parseFloat(paymentIntent.metadata.distance);
//     const deliveryCharge = parseFloat(paymentIntent.metadata.deliveryCharge);
//     const commissionAmount = parseFloat(
//       paymentIntent.metadata.commissionAmount,
//     );
//     const riderAmount = parseFloat(paymentIntent.metadata.riderAmount);

//     const orderId = await generateOrderId();
//     console.log(payload,"Payload")

//     const order = await Order.create({
//       ...payload,
//       orderId,
//       user: userId,
//       distance,
//       deliveryCharge,
//       commissionAmount,
//       riderAmount,
//     });

//     console.log(order,"Order")

//     const delivery = await Delivery.create({
//       order: order._id,
//       orderId,
//       status: 'REQUESTED',
//     });

//     const paymentData: IPayment = {
//       transactionId: paymentIntent.id,
//       paymentIntentId: paymentIntent.id,
//       refunded: false,
//       refundId: '',
//       amountPaid: paymentIntent.amount / 100,
//       paidAt: new Date(paymentIntent.created * 1000),
//       deliveryId: delivery._id as any,
//       userId: userId,
//       status: paymentIntent.status,
//       commissionAmount,
//       riderAmount,
//       isTransferred: false,
//     };

//     await savePaymentInfo(paymentData);

//     return { orderCreated: order._id };
//   }

//   // ignore other event types
//   return { ignored: true };
// }

export async function handleStripeWebhook(rawBody: Buffer, signature: string) {
  let event: Stripe.Event;

  try {
    console.log("🔹 Stripe webhook received, verifying signature...");
    event = stripe.webhooks.constructEvent(rawBody, signature, WEBHOOK_SECRET);
    console.log("✅ Signature verified, event type:", event.type);
  } catch (err: any) {
    console.error("❌ Webhook signature failed:", err.message);
    throw new Error(`Webhook signature verification failed: ${err.message}`);
  }

  try {
    let paymentIntent: Stripe.PaymentIntent | null = null;

    if (event.type === 'account.updated') {
      const account = event.data.object as Stripe.Account;

      // Update DB only when account is fully validated
      if (account.details_submitted && account.payouts_enabled) {
        await User.findOneAndUpdate(
          { stripeAccountId: account.id },
          { stripeValidated: true }
        );
      }
    }

    // --- Checkout session completed ---
    if (event.type === 'checkout.session.completed') {
      console.log("🔹 Handling checkout.session.completed");
      const session = event.data.object as Stripe.Checkout.Session;
      const paymentIntentId = session.payment_intent as string;
      console.log("PaymentIntent ID from session:", paymentIntentId);

      paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      console.log("✅ Retrieved PaymentIntent:", paymentIntent.id);
    }

    // --- Backup: PaymentIntent succeeded ---
    if (event.type === 'payment_intent.succeeded') {
      console.log("🔹 Handling payment_intent.succeeded");
      paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log("PaymentIntent ID:", paymentIntent.id);
    }

    if (!paymentIntent) {
      console.log("⚠️ No paymentIntent found, ignoring event.");
      return { ignored: true };
    }

    // Check if this paymentIntent is already processed
    const existingPayment = await Payment.findOne({ paymentIntentId: paymentIntent.id });
    if (existingPayment) {
      console.log(`⚠️ PaymentIntent ${paymentIntent.id} already processed. Skipping order creation.`);
      return { ignored: true };
    }

    if (!paymentIntent.metadata.jsonOrder) {
      console.log("⚠️ jsonOrder metadata not found, ignoring event.");
      return { ignored: true };
    }

    // Parse metadata
    let payload: any;
    try {
      payload = JSON.parse(paymentIntent.metadata.jsonOrder);
      console.log("✅ Metadata parsed successfully");
    } catch (err) {
      console.error("❌ Failed to parse jsonOrder metadata:", err);
      return { error: "Invalid jsonOrder" };
    }

    const userId = paymentIntent.metadata.userId;
    const distance = parseFloat(paymentIntent.metadata.distance || '0');
    const deliveryCharge = parseFloat(paymentIntent.metadata.deliveryCharge || '0');
    const commissionAmount = parseFloat(paymentIntent.metadata.commissionAmount || '0');
    const riderAmount = parseFloat(paymentIntent.metadata.riderAmount || '0');

    console.log("🔹 Creating Order...");
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
    console.log("✅ Order created with ID:", order._id);

    console.log("🔹 Creating Delivery...");
    const delivery = await Delivery.create({
      order: order._id,
      orderId,
      status: 'REQUESTED',
    });
    console.log("✅ Delivery created with ID:", delivery._id);

    console.log("🔹 Saving Payment info...");
    await savePaymentInfo({
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
    });
    console.log("✅ Payment info saved.");

    console.log("🎉 All done, returning orderCreated:", order._id);
    return { orderCreated: order._id };

  } catch (err: any) {
    console.error("❌ Webhook processing failed:", err);
    return { error: err.message };
  }
}

