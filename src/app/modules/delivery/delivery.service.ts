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
import { NotificationServices } from '../notification/notification.service';
import { sendNotifications } from '../../../helpers/notificationHelper';

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
        $maxDistance: 20000000, // 20k km 5 km radius
      },
    },
  });
  return result;
};

// const getOrderIdForRider = async (riderId: string) => {
//   const delivery = await Delivery.findOne({
//     rider: riderId,
//     status: {
//       $in: [
//         'ASSIGNED',
//         'ACCEPTED',
//         'ARRIVED_PICKED_UP',
//         'STARTED',
//         'ARRIVED_DESTINATION',
//       ],
//     }, // active delivery status
//   }).populate('order');

//   if (!delivery) return null;

//   return delivery.order._id.toString();
// };

// const updateRiderLocation = async (
//   riderId: string,
//   { coordinates }: { coordinates: [number, number] },
// ) => {
//   if (!coordinates || !Array.isArray(coordinates) || coordinates.length !== 2) {
//     throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid coordinates');
//   }

//   // Update rider geoLocation & online status
//   const result = await User.findByIdAndUpdate(
//     riderId,
//     {
//       geoLocation: {
//         type: 'Point',
//         coordinates: coordinates,
//       },
//       isOnline: true,
//     },
//     { new: true },
//   );

//   if (result) {
//     const orderId = await getOrderIdForRider(riderId);

//     // @ts-ignore
//     const io = global.io;
//     if (io) {
//       io.emit(`rider::${riderId}`, {
//         riderId,
//         coordinates: result.geoLocation?.coordinates,
//       });

//       if (orderId) {
//         const delivery = await Delivery.findOne({
//           rider: riderId,
//           status: {
//             $in: [
//               'ASSIGNED',
//               'ACCEPTED',
//               'ARRIVED_PICKED_UP',
//               'STARTED',
//               'ARRIVED_DESTINATION',
//             ],
//           },
//         }).populate({
//           path: 'order',
//           populate: { path: 'user' },
//         });

//         const user = (delivery?.order as any)?.user as {
//           _id: Types.ObjectId | string;
//         };

//         if (user) {
//           io.emit(`user::${user._id.toString()}`, {
//             riderId,
//             coordinates: result.geoLocation?.coordinates,
//             orderId,
//           });
//         }
//       }
//     }
//   }

//   return result;
// };

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

  // only accept if current status is ASSIGNED
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

  // STARTED only allowed after ARRIVED_PICKED_UP
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

  // DELIVERED only allowed after ARRIVED_DESTINATION
  if (status === 'DELIVERED' && delivery.status !== 'ARRIVED_DESTINATION') {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Cannot mark DELIVERED before ARRIVED_DESTINATION',
    );
  }

  // validate permissions and extra constraints
  if (status === 'ACCEPTED' || status === 'REJECTED') {
    if (!riderId || delivery.rider?.toString() !== riderId) {
      throw new ApiError(StatusCodes.FORBIDDEN, 'You are not assigned rider');
    }
    if (finalStatuses.includes(delivery.status)) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        `Cannot change status once delivery is ${delivery.status}`,
      );
    }
  }

  if (status === 'CANCELLED') {
    if (!userId || delivery.order?.user.toString() !== userId) {
      throw new ApiError(StatusCodes.FORBIDDEN, 'Not authorized to cancel');
    }
    if (finalStatuses.includes(delivery.status)) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        `Cannot cancel delivery once it is ${delivery.status}`,
      );
    }
  }

  // set rider during assignment
  if (status === 'ASSIGNED') {
    if (!riderId) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'RiderId required for assignment',
      );
    }
    delivery.rider = new Types.ObjectId(riderId);
  }

  // remove rider on certain statuses
  if (['REQUESTED', 'REJECTED', 'CANCELLED'].includes(status)) {
    delivery.rider = undefined;
  }

  // set isActive based on status
  if (
    [
      'ASSIGNED',
      'ACCEPTED',
      'ARRIVED_PICKED_UP',
      'STARTED',
      'ARRIVED_DESTINATION',
    ].includes(status)
  ) {
    delivery.isActive = true;
  } else if (
    ['DELIVERED', 'REJECTED', 'CANCELLED', 'FAILED'].includes(status)
  ) {
    delivery.isActive = false;
  }

  // set the new status
  delivery.status = status;

  const tsKey = statusTimestampsMap[status];
  if (tsKey) {
    delivery.timestamps = delivery.timestamps || {};
    delivery.timestamps[tsKey] = new Date();
  }

  await delivery.save({ session });

  const updatedDelivery = await Delivery.findById(delivery._id)
    .populate('rider')
    .populate<{ order: IOrder }>('order');

    console.log(updatedDelivery,"updated delivery")

  //  notification after successful status change
  if (updatedDelivery) {
    const { order, rider } = updatedDelivery;

    const notifyPayload = {
      title: `Delivery ${status}`,
      message: `Your delivery status has been updated to ${status}`,
      delivery: updatedDelivery._id,
    };

    // notify User
    if (order?.user) {
      await sendNotifications({
        ...notifyPayload,
        receiver: order.user.toString(),
      });
    }

    if (order?.user) {
      await sendNotifications({
        ...notifyPayload,
        type: 'ADMIN',
        receiver: order.user.toString(),
      });
    }

    // notify Rider
    if (rider?._id) {
      await sendNotifications({
        ...notifyPayload,
        receiver: rider._id.toString(),
      });
    }

    // real time send data user, and rider
    // @ts-ignore
    const socketIo = global.io;
    socketIo.emit(`delivery::status::${order.user.toString()}`, updatedDelivery);

    if (rider?._id) {
      socketIo.emit(`delivery::status::${rider._id}`, updatedDelivery);
    }
  }


  return updatedDelivery;
};

// const updateRiderLocation = async (
//   riderId: string,
//   coordinates: [number, number],
// ) => {
//   if (!riderId) throw new Error('Rider ID is required');
//   if (!coordinates || !Array.isArray(coordinates) || coordinates.length !== 2) {
//     throw new Error('Invalid coordinates');
//   }

//   const user = await User.findById(riderId);
//   if (!user) throw new Error('Rider not found');

//   const currentCoords = user.geoLocation?.coordinates || [];
//   const [lon, lat] = coordinates;

//   if (currentCoords[0] !== lon || currentCoords[1] !== lat) {
//     user.geoLocation = {
//       type: 'Point',
//       coordinates,
//     };
//     await user.save();
//   }

//   // ==========================New Code=============================

//   // Step 2: Find active delivery of this rider
//   const activeDelivery = await Delivery.findOne({
//     rider: riderId,
//     isActive: true, // এই flag আগেই implement করা উচিত
//   }).populate<{ order: IOrder & Document }>('order');

//   // Step 3: Emit real-time location to the user
//   if (activeDelivery?.order?.user) {
//     const userId = activeDelivery.order.user.toString();
//     // @ts-ignore
//     const socketIo = global.io;
//     socketIo.emit(`user::rider_location::${userId}`, {
//       deliveryId: activeDelivery._id,
//       riderId,
//       coordinates,
//     });
//   }

//   return user;
// };


const updateRiderLocation = async (
  riderId: string,
  coordinates: [number, number],
) => {
  if (!riderId) throw new Error('Rider ID is required');
  if (!coordinates || !Array.isArray(coordinates) || coordinates.length !== 2) {
    throw new Error('Invalid coordinates');
  }

  // update rider's geoLocation
  await User.findByIdAndUpdate(riderId, {
    geoLocation: {
      type: 'Point',
      coordinates,
    },
  });

  // find active delivery of this rider
  const activeDelivery = await Delivery.findOne({
    rider: riderId,
    isActive: true,
  }).populate<{ order: IOrder & Document }>('order');

  // emit real-time location to the user
  if (activeDelivery?.order?.user) {
    const userId = activeDelivery.order.user.toString();
    // @ts-ignore
    const socketIo = global.io;
    socketIo.emit(`user::rider_location::${userId}`, {
      deliveryId: activeDelivery._id,
      riderId,
      coordinates,
    });
  }

  return { riderId, coordinates };
};


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
  }, 3600000); // 1hour,   1 minute  60000

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
  console.log(riderId, 'Rider ID');
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

  // find associated payment
  const payment = await Payment.findOne({ deliveryId: delivery?._id });

  if (payment && payment.paymentIntentId) {
    try {
      // process refund through Stripe
      const refund = await stripe.refunds.create({
        payment_intent: payment.paymentIntentId,
      });

      console.log('✅ Refund successful:', refund.id);

      // save refund status
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
