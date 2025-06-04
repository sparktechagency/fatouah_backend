import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import { IOrder } from '../order/order.interface';
import { User } from '../user/user.model';
import { Delivery } from './delivery.model';
import { statusTimestampsMap, UpdateStatusOptions } from './delivery.interface';
import { Types } from 'mongoose';
import { errorLogger } from '../../../shared/logger';
import { Payment } from '../payment/payment.model';
import { Order } from '../order/order.model';
import { transferToRider } from '../../../util/stripeWebHooksHandler';
import stripe from '../../../config/stripe';
import { refundIfNeeded } from '../payment/payment.service';

// find nearest riders
const findNearestOnlineRiders = async (location: {
  coordinates: [number, number];
}) => {
  if (
    !location.coordinates ||
    !Array.isArray(location.coordinates) ||
    location.coordinates.length !== 2
  ) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid coordinates');
  }
  const result = await User.find({
    role: 'RIDER',
    isOnline: true,
    'geoLocation.coordinates': { $ne: [0, 0] },
    geoLocation: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: location.coordinates,
        },
        $maxDistance: 5000, // 5 km radius
      },
    },
  });
  return result;
};

const updateRiderLocation = async (
  riderId: string,
  { coordinates }: { coordinates: [number, number] },
) => {
  if (!coordinates || !Array.isArray(coordinates) || coordinates.length !== 2) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid coordinates');
  }

  const result = await User.findByIdAndUpdate(
    riderId,
    {
      geoLocation: {
        type: 'Point',
        coordinates: coordinates,
      },
      isOnline: true,
    },
    { new: true },
  );

  if (result) {
    // @ts-ignore
    const io = global.io;
    if (io) {
      io.emit('rider-location-updated', riderId, {
        coordinates: result.geoLocation?.coordinates,
      });
    }
  }

  return result;
};

const finalStatuses = ['DELIVERED', 'CANCELLED', 'FAILED'];

const updateStatus = async ({
  deliveryId,
  status,
  riderId,
  userId,
  session,
}: UpdateStatusOptions) => {
  const delivery = await Delivery.findById(deliveryId)
    .populate<{ order: IOrder }>('order')
    .session(session || null);

  if (!delivery) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Delivery not found');
  }

  // prevent updates if delivery already in a final state (excluding REJECTED)
  if (finalStatuses.includes(delivery.status)) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      `Cannot change status once delivery is ${delivery.status}`,
    );
  }

  // restrict assigned before requested
  if (status === 'ASSIGNED' && delivery.status !== 'REQUESTED') {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Cannot assign delivery before it is requested',
    );
  }

  // accept only if current status is ASSIGNED
  if (status === 'ACCEPTED' && delivery.status !== 'ASSIGNED') {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Can only accept delivery if status is ASSIGNED',
    );
  }

  // ARRIVED_PICKED_UP only allowed after ACCEPTED
  if (status === 'ARRIVED_PICKED_UP' && delivery.status !== 'ACCEPTED') {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Cannot mark ARRIVED_PICKED_UP before ACCEPTED',
    );
  }

  // started only allowed after ARRIVED_PICKED_UP
  if (status === 'STARTED' && delivery.status !== 'ARRIVED_PICKED_UP') {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Cannot start delivery before ARRIVED_PICKED_UP',
    );
  }

  // ARRIVED_DESTINATION only allowed after STARTED
  if (status === 'ARRIVED_DESTINATION' && delivery.status !== 'STARTED') {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Cannot mark ARRIVED_DESTINATION before STARTED',
    );
  }

  // delivered only allowed after ARRIVED_DESTINATION
  if (status === 'DELIVERED' && delivery.status !== 'ARRIVED_DESTINATION') {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Cannot mark DELIVERED before ARRIVED_DESTINATION',
    );
  }

  // validate permissions based on status
  if (status === 'ACCEPTED') {
    if (!riderId || delivery.rider?.toString() !== riderId) {
      throw new ApiError(StatusCodes.FORBIDDEN, 'You are not assigned rider');
    }
  }

  if (status === 'REJECTED') {
    if (!riderId || delivery.rider?.toString() !== riderId) {
      throw new ApiError(StatusCodes.FORBIDDEN, 'You are not assigned rider');
    }
  }

  if (status === 'CANCELLED') {
    if (!userId || delivery.order?.user.toString() !== userId) {
      throw new ApiError(StatusCodes.FORBIDDEN, 'Not authorized to cancel');
    }
  }

  if (status === 'ASSIGNED') {
    if (!riderId) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'RiderId required for assignment',
      );
    }
    delivery.rider = new Types.ObjectId(riderId);
  }

  // Remove rider on these statuses
  if (['REQUESTED', 'REJECTED', 'CANCELLED'].includes(status)) {
    delivery.rider = undefined;
  }

  delivery.status = status;

  const tsKey = statusTimestampsMap[status];
  if (tsKey) {
    delivery.timestamps = delivery.timestamps || {};
    delivery.timestamps[tsKey] = new Date();
  }

  await delivery.save({ session });

  await delivery.save({ session });

  const updatedDelivery = await Delivery.findById(delivery._id)
    .populate('rider')
    .populate('order');

    // console.log(delivery.order.user,"Delivery Order User")
    // console.log(delivery?.rider?._id,"Delivery Rider Id")

  // @ts-ignore
  const io = global.io;

  if (io) {
    const roomsToNotify = [
      `user::${delivery.order?.user}`,  // Notify the user
      `rider::${delivery.rider?._id}`, // Notify the assigned rider
    ];

    roomsToNotify.forEach(room => {
      io.to(room).emit("delivery-updated", {
        delivery: updatedDelivery,
        message: `Delivery status changed to ${status}`,
      });
    });
  }


  return updatedDelivery;
};

export const detectOfflineRiders = async () => {
  const offlineThreshold = new Date(Date.now() - 2 * 60 * 1000); // 2 minutes ago

  const result = await User.updateMany(
    {
      isOnline: true,
      updatedAt: { $lt: offlineThreshold },
    },
    { isOnline: false },
  );

  console.log(
    `Offline detection: ${result.modifiedCount} riders marked offline`,
  );
};

setInterval(
  () => {
    detectOfflineRiders().catch(console.error);
  },
  10 * 60 * 1000,
); // every 2 minutes

const assignRiderWithTimeout = async (deliveryId: string) => {
  const delivery = await Delivery.findById(deliveryId).populate<{
    order: IOrder;
  }>('order');

  if (!delivery) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Delivery not found');
  }

  const attemptedRiders = delivery.attempts.map(a => a.rider.toString());

  const riders = await findNearestOnlineRiders(delivery.order.pickupLocation);
  const nextRider = riders.find(
    r => !attemptedRiders.includes(r._id.toString()),
  );

  if (!nextRider) {
    // status update
    await updateStatus({ deliveryId, status: 'FAILED' });

    // refund payment
    await refundIfNeeded(deliveryId);

    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'No available rider found at this moment. Refund user payment.',
    );
  }

  // assign rider
  await updateStatus({
    deliveryId,
    status: 'ASSIGNED',
    riderId: nextRider._id.toString(),
  });

  // save attempt
  delivery.attempts.push({ rider: nextRider._id, attemptedAt: new Date() });
  await delivery.save();

  setTimeout(() => {
    (async () => {
      try {
        const updatedDelivery = await Delivery.findById(deliveryId);

        if (updatedDelivery?.status === 'ASSIGNED') {
          // revert to REQUESTED
          await updateStatus({ deliveryId, status: 'REQUESTED' });

          // try assigning again
          await assignRiderWithTimeout(deliveryId);
        }
      } catch (err) {
        errorLogger.error('🚨 Error during rider reassignment:', err);
      }
    })();
  }, 600000); // 1 minute  60000

  return delivery;
};

const acceptDeliveryByRider = async (deliveryId: string, riderId: string) => {
  const rider = await User.findById(riderId);

  //  check stripe account before proceeding
  if (!rider?.stripeAccountId) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Rider must have a connected Stripe account to accept delivery.',
    );
  }

  const delivery = await updateStatus({
    deliveryId,
    status: 'ACCEPTED',
    riderId,
  });
  return delivery;
};

const rejectDeliveryByRider = async (deliveryId: string, riderId: string) => {
  await updateStatus({ deliveryId, status: 'REJECTED', riderId });

  await updateStatus({ deliveryId, status: 'REQUESTED' });

  return await assignRiderWithTimeout(deliveryId);
};

const cancelDeliveryByUser = async (deliveryId: string, userId: string) => {
  const delivery = await updateStatus({
    deliveryId,
    status: 'CANCELLED',
    userId,
  });

  // Step 2: Find associated payment
  const payment = await Payment.findOne({ deliveryId: delivery?._id });

  if (payment && payment.paymentIntentId) {
    try {
      // Step 3: Process refund through Stripe
      const refund = await stripe.refunds.create({
        payment_intent: payment.paymentIntentId,
      });

      console.log('✅ Refund successful:', refund.id);

      // (Optional) Step 4: Save refund status
      payment.refunded = true;
      payment.refundId = refund.id;
      await payment.save();
    } catch (err: any) {
      console.error('❌ Refund failed:', err.message);
    }
  } else {
    console.warn('⚠️ No valid payment found to refund.');
  }
};

const markDeliveryArrivedPickedUp = async (
  deliveryId: string,
  riderId: string,
) => {
  if (!riderId)
    throw new ApiError(StatusCodes.BAD_REQUEST, 'RiderId is required');
  return await updateStatus({
    deliveryId,
    status: 'ARRIVED_PICKED_UP',
    riderId,
  });
};

const markDeliveryStarted = async (deliveryId: string, riderId: string) => {
  if (!riderId)
    throw new ApiError(StatusCodes.BAD_REQUEST, 'RiderId is required');
  return await updateStatus({ deliveryId, status: 'STARTED', riderId });
};

const markDeliveryArrivedDestination = async (
  deliveryId: string,
  riderId: string,
) => {
  if (!riderId)
    throw new ApiError(StatusCodes.BAD_REQUEST, 'RiderId is required');
  return await updateStatus({
    deliveryId,
    status: 'ARRIVED_DESTINATION',
    riderId,
  });
};

// use transaction roll back
const markDeliveryCompleted = async (deliveryId: string, riderId: string) => {
  if (!riderId)
    throw new ApiError(StatusCodes.BAD_REQUEST, 'RiderId is required');

  const delivery = await updateStatus({
    deliveryId,
    status: 'DELIVERED',
    riderId,
  });

  // payment transfer to rider
  const rider = await User.findById(riderId);
  const payment = await Payment.findOne({ deliveryId: delivery?._id });
  const order = await Order.findById(delivery?.order);

  if (rider?.stripeAccountId && payment && order) {
    const transfer = await transferToRider({
      stripeAccountId: rider.stripeAccountId,
      amount: order.riderAmount,
      orderId: order._id.toString(),
    });

    console.log('✅ Transfer successful:', transfer.id);
  } else {
    console.warn('⚠️ Transfer failed: Rider/Payment/Order doest not exist.');
  }

  return delivery;
};

// const markDeliveryCompleted = async (deliveryId: string, riderId: string) => {
//   const session = await mongoose.startSession();
//   try {
//     await session.withTransaction(async () => {
//       if (!riderId) {
//         throw new ApiError(StatusCodes.BAD_REQUEST, 'RiderId is required');
//       }

//       const delivery = await updateStatus(
//         { deliveryId, status: 'DELIVERED', riderId, session },

//       );

//       const payment = await Payment.findOne({ deliveryId }).session(session);
//       if (!payment) {
//         throw new ApiError(StatusCodes.NOT_FOUND, 'No payment found for this delivery');
//       }

//       if (payment.isTransferred) {
//         throw new ApiError(StatusCodes.CONFLICT, 'Payment already transferred');
//       }

//       const rider = await User.findById(riderId).session(session);
//       const order = await Order.findById(delivery.order).session(session);

//       if (!rider?.stripeAccountId) {
//         throw new ApiError(StatusCodes.BAD_REQUEST, 'Rider Stripe account not found');
//       }

//       if (!order) {
//         throw new ApiError(StatusCodes.NOT_FOUND, 'Order not found');
//       }

//       //  transfer payment to rider
//       const transfer = await transferToRider({
//         stripeAccountId: rider.stripeAccountId,
//         amount: order.riderAmount,
//         orderId: order._id.toString(),
//       });

//       console.log('✅ Transfer successful:', transfer.id);

//       payment.isTransferred = true;
//       await payment.save({ session });
//     });

//     return await Delivery.findById(deliveryId);

//   } catch (error) {
//     console.error('❌ Transaction failed:', error);
//     throw error;
//   } finally {
//     session.endSession();
//   }
// };

// const markDeliveryCompleted = async (deliveryId: string, riderId: string) => {
//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     if (!riderId) {
//       throw new ApiError(StatusCodes.BAD_REQUEST, 'RiderId is required');
//     }

//     const delivery = await updateStatus({
//       deliveryId,
//       status: 'DELIVERED',
//       riderId,
//       session,
//     });

//     const payment = await Payment.findOne({ deliveryId }).session(session);
//     if (!payment) {
//       throw new ApiError(StatusCodes.NOT_FOUND, 'No payment found for this delivery');
//     }

//     if (payment.isTransferred) {
//       throw new ApiError(StatusCodes.CONFLICT, 'Payment already transferred');
//     }

//     const rider = await User.findById(riderId).session(session);
//     const order = await Order.findById(delivery.order).session(session);

//     if (!rider?.stripeAccountId) {
//       throw new ApiError(StatusCodes.BAD_REQUEST, 'Rider Stripe account not found');
//     }

//     if (!order) {
//       throw new ApiError(StatusCodes.NOT_FOUND, 'Order not found');
//     }

//     // transfer payment to rider
//     const transfer = await transferToRider({
//       stripeAccountId: rider.stripeAccountId,
//       amount: order.riderAmount,
//       orderId: order._id.toString(),
//     });

//     console.log('✅ Transfer successful:', transfer.id);

//     payment.isTransferred = true;
//     await payment.save({ session });

//     await session.commitTransaction();
//     return await Delivery.findById(deliveryId);

//   } catch (error) {

//     await session.abortTransaction();
//     console.error('❌ Transaction failed, rollback initiated:', error);
//     throw error;
//   } finally {
//     session.endSession();
//   }
// };

// const markDeliveryCompleted = async (deliveryId: string, riderId: string) => {
//   try {
//     if (!riderId) {
//       throw new ApiError(StatusCodes.BAD_REQUEST, 'RiderId is required');
//     }

//     const delivery = await updateStatus({
//       deliveryId,
//       status: 'DELIVERED',
//       riderId,
//     });

//     const payment = await Payment.findOne({ deliveryId });
//     if (!payment) {
//       throw new ApiError(
//         StatusCodes.NOT_FOUND,
//         'No payment found for this delivery',
//       );
//     }

//     if (payment.isTransferred) {
//       throw new ApiError(StatusCodes.CONFLICT, 'Payment already transferred');
//     }

//     const rider = await User.findById(riderId);
//     const order = await Order.findById(delivery.order);

//     if (!rider?.stripeAccountId) {
//       throw new ApiError(
//         StatusCodes.BAD_REQUEST,
//         'Rider Stripe account not found',
//       );
//     }

//     if (!order) {
//       throw new ApiError(StatusCodes.NOT_FOUND, 'Order not found');
//     }

//     // transfer payment to rider
//     const transfer = await transferToRider({
//       stripeAccountId: rider.stripeAccountId,
//       amount: order.riderAmount,
//       orderId: order._id.toString(),
//     });

//     console.log('✅ Transfer successful:', transfer.id);

//     payment.isTransferred = true;
//     await payment.save();

//     return await Delivery.findById(deliveryId);
//   } catch (error) {
//     console.error('❌ markDeliveryCompleted failed:', error);
//     throw error;
//   }
// };

const getDeliveryDetails = async (deliveryId: string) => {
  const delivery = await Delivery.findById(deliveryId).populate('order');

  if (!delivery) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Delivery not found');
  }

  return delivery;
};

export const DeliveryServices = {
  findNearestOnlineRiders,
  assignRiderWithTimeout,
  rejectDeliveryByRider,
  cancelDeliveryByUser,
  getDeliveryDetails,
  acceptDeliveryByRider,
  updateRiderLocation,
  markDeliveryStarted,
  markDeliveryArrivedPickedUp,
  markDeliveryArrivedDestination,
  markDeliveryCompleted,
};
