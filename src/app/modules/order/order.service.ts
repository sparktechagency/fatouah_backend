import { JwtPayload } from 'jsonwebtoken';
import { IOrder } from './order.interface';
import { Order } from './order.model';
import { Delivery } from '../delivery/delivery.model';
import stripe from '../../../config/stripe';
import { generateOrderId } from '../../../helpers/generateOrderId';
import { Payment } from '../payment/payment.model';
// import { getDistanceAndDurationFromGoogle } from './distanceCalculation';

const getRatePerKm = (ride: string) => {
  switch (ride) {
    case 'BIKE':
      return 3;
    case 'CAR':
      return 2;
    default:
      return 2; // fallback
  }
};

function getDistanceFromLatLonInKm(
  coord1: [number, number],
  coord2: [number, number],
): number {
  const toRad = (value: number) => (value * Math.PI) / 180;

  const [lon1, lat1] = coord1;
  const [lon2, lat2] = coord2;

  const R = 6371; // Radius of earth in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export const createParcelOrderToDB = async (
  user: JwtPayload,
  payload: IOrder,
) => {
  // calculate distance  using pickupLocation and destinationLocation coordinates
  const distance =
    Math.round(
      getDistanceFromLatLonInKm(
        payload.pickupLocation.coordinates,
        payload.destinationLocation.coordinates,
      ) * 100,
    ) / 100;

  // get rate per km based on ride type
  const ratePerKm = getRatePerKm(payload.ride);

  // calculate delivery charge based on distance and ride type
  const deliveryCharge = Math.round(distance * ratePerKm * 100) / 100;

  // commission system
  const commissionRate = 0.1; // 10%
  const commissionAmount =
    Math.round(deliveryCharge * commissionRate * 100) / 100;
  const riderAmount =
    Math.round((deliveryCharge - commissionAmount) * 100) / 100;

  // generate orderID
  const orderId = await generateOrderId();

  // create order with calculated distance and deliveryCharge
  const order = await Order.create({
    ...payload,
    orderId,
    user: user.id,
    distance,
    deliveryCharge,
    commissionAmount,
    riderAmount,
  });

  const delivery = await Delivery.create({
    order: order._id,
    status: 'REQUESTED',
  });

  // 5. Create Stripe checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `Parcel Delivery to ${payload.destinationLocation.address}`,
            description: `Type: ${payload.parcelType}, Minimum Weight: ${payload.minParcelWeight}kg & Maximum Weight ${payload.maxParcelWeight}`,
            metadata: {
              pickupAddress: payload.pickupLocation.address,
              destinationAddress: payload.destinationLocation.address,
              parcelType: payload.parcelType,
              ride: payload.ride,
            },
          },
          unit_amount: Math.round(deliveryCharge * 100), // in cents
        },
        quantity: 1,
      },
    ],
    success_url: `https://yourdomain.com/payment-success?orderId=${order._id}`,
    cancel_url: `https://yourdomain.com/payment-cancel?orderId=${order._id}`,
    payment_intent_data: {
      // capture_method: 'manual', // capture payment
      metadata: {
        orderId: order._id.toString(),
        userId: user.id,
        deliveryId: delivery.id,
        receiversName: payload.receiversName,
        contact: payload.contact,
        parcelType: payload.parcelType,
        minParcelWeight: payload.minParcelWeight.toString(),
        maxParcelWeight: payload.maxParcelWeight.toString(),
        parcelValue: payload.parcelValue.toString(),
        ride: payload.ride,
        commissionAmount: commissionAmount.toString(),
        riderAmount: riderAmount.toString(),
      },
    },
    customer_email: user.email,
  });

  console.log(session);

  return { order, delivery, redirectUrl: session.url };

  // return { order, delivery };
};

// --------------------
const createStripeSessionOnly = async (user: JwtPayload, payload: IOrder) => {
  const distance =
    Math.round(
      getDistanceFromLatLonInKm(
        payload.pickupLocation.coordinates,
        payload.destinationLocation.coordinates,
      ) * 100,
    ) / 100;

  const ratePerKm = getRatePerKm(payload.ride);
  const deliveryCharge = Math.round(distance * ratePerKm * 100) / 100;
  const commissionRate = 0.1; // 10% commision
  const commissionAmount =
    Math.round(deliveryCharge * commissionRate * 100) / 100;
  const riderAmount =
    Math.round((deliveryCharge - commissionAmount) * 100) / 100;
  const orderId = await generateOrderId();

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `Parcel Delivery to ${payload.destinationLocation.address}`,
            description: `Type: ${payload.parcelType}`,
          },
          unit_amount: Math.round(deliveryCharge * 100),
        },
        quantity: 1,
      },
    ],
    success_url:
      'http://10.0.60.210:5000/api/v1/order/success?session_id={CHECKOUT_SESSION_ID}',
    cancel_url: 'http://10.0.60.210:5000/api/v1/order/cancel',
    payment_intent_data: {
      metadata: {
        orderId: orderId,
        userId: user.id,
        jsonOrder: JSON.stringify(payload), // send full order data as string
        distance: distance.toString(),
        deliveryCharge: deliveryCharge.toString(),
        commissionAmount: commissionAmount.toString(),
        riderAmount: riderAmount.toString(),
      },
      transfer_group: `order_${orderId}`,
    },
    customer_email: user.email,
  });

  return { redirectUrl: session.url };
};

const successMessage = async (id: string) => {
  const session = await stripe.checkout.sessions.retrieve(id);
  return session;
};

const getSuccessOrderDetails = async (sessionId: string) => {
  // 1️⃣ Stripe থেকে session আনা
  const session = await stripe.checkout.sessions.retrieve(sessionId);

  // 2️⃣ Payment Intent ID নেওয়া
  const paymentIntentId = session.payment_intent as string;

  // 3️⃣ Payment DB থেকে আনা
  const payment = await Payment.findOne({ paymentIntentId });
  if (!payment) {
    throw new Error('Payment not found');
  }

  // 4️⃣ Delivery ও তার মধ্যে থাকা Order আনো
  const delivery = await Delivery.findById(payment.deliveryId).populate(
    'order',
  );

  return {
    // order: delivery?.order,
    delivery,
    payment,
  };
};

export const OrderServices = {
  createParcelOrderToDB,
  createStripeSessionOnly,
  successMessage,
  getSuccessOrderDetails,
};
