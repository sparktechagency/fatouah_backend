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
import { RIDER_STATUS } from '../user/user.constant';

// find nearest riders
// const findNearestOnlineRiders = async (location: {
//   coordinates: [number, number];
// }) => {
//   if (
//     !location.coordinates ||
//     !Array.isArray(location.coordinates) ||
//     location.coordinates.length !== 2
//   ) {
//     throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid coordinates');
//   }
//   const result = await User.find({
//     role: 'RIDER',
//     isOnline: true,
//     'geoLocation.coordinates': { $ne: [0, 0] },
//     geoLocation: {
//       $near: {
//         $geometry: {
//           type: 'Point',
//           coordinates: location.coordinates,
//         },
//         $maxDistance: 20000000, // 20k km 5 km radius
//       },
//     },
//   });
//   return result;
// };

// const finalStatuses = ['DELIVERED', 'CANCELLED', 'FAILED'];

// const updateStatus = async ({
//   deliveryId,
//   status,
//   riderId,
//   userId,
//   session,
// }: UpdateStatusOptions) => {
//   const delivery = await Delivery.findById(deliveryId)
//     .populate<{ order: IOrder }>('order')
//     .session(session || null);

//   if (!delivery) {
//     throw new ApiError(StatusCodes.NOT_FOUND, 'Delivery not found');
//   }

//   // prevent updates if delivery already in a final state (excluding REJECTED)
//   if (finalStatuses.includes(delivery.status)) {
//     throw new ApiError(
//       StatusCodes.BAD_REQUEST,
//       `Cannot change status once delivery is ${delivery.status}`,
//     );
//   }

//   // restrict assigned before requested
//   if (status === 'ASSIGNED' && delivery.status !== 'REQUESTED') {
//     throw new ApiError(
//       StatusCodes.BAD_REQUEST,
//       'Cannot assign delivery before it is requested',
//     );
//   }

//   // only accept if current status is ASSIGNED
//   if (status === 'ACCEPTED' && delivery.status !== 'ASSIGNED') {
//     throw new ApiError(
//       StatusCodes.BAD_REQUEST,
//       'Can only accept delivery if status is ASSIGNED',
//     );
//   }

//   // ARRIVED_PICKED_UP only allowed after ACCEPTED
//   if (status === 'ARRIVED_PICKED_UP' && delivery.status !== 'ACCEPTED') {
//     throw new ApiError(
//       StatusCodes.BAD_REQUEST,
//       'Cannot mark ARRIVED_PICKED_UP before ACCEPTED',
//     );
//   }

//   // STARTED only allowed after ARRIVED_PICKED_UP
//   if (status === 'STARTED' && delivery.status !== 'ARRIVED_PICKED_UP') {
//     throw new ApiError(
//       StatusCodes.BAD_REQUEST,
//       'Cannot start delivery before ARRIVED_PICKED_UP',
//     );
//   }

//   // ARRIVED_DESTINATION only allowed after STARTED
//   if (status === 'ARRIVED_DESTINATION' && delivery.status !== 'STARTED') {
//     throw new ApiError(
//       StatusCodes.BAD_REQUEST,
//       'Cannot mark ARRIVED_DESTINATION before STARTED',
//     );
//   }

//   // DELIVERED only allowed after ARRIVED_DESTINATION
//   if (status === 'DELIVERED' && delivery.status !== 'ARRIVED_DESTINATION') {
//     throw new ApiError(
//       StatusCodes.BAD_REQUEST,
//       'Cannot mark DELIVERED before ARRIVED_DESTINATION',
//     );
//   }

//   // validate permissions and extra constraints
//   if (status === 'ACCEPTED' || status === 'REJECTED') {
//     if (!riderId || delivery.rider?.toString() !== riderId) {
//       throw new ApiError(StatusCodes.FORBIDDEN, 'You are not assigned rider');
//     }
//     if (finalStatuses.includes(delivery.status)) {
//       throw new ApiError(
//         StatusCodes.BAD_REQUEST,
//         `Cannot change status once delivery is ${delivery.status}`,
//       );
//     }
//   }

//   if (status === 'CANCELLED') {
//     if (!userId || delivery.order?.user.toString() !== userId) {
//       throw new ApiError(StatusCodes.FORBIDDEN, 'Not authorized to cancel');
//     }
//     if (finalStatuses.includes(delivery.status)) {
//       throw new ApiError(
//         StatusCodes.BAD_REQUEST,
//         `Cannot cancel delivery once it is ${delivery.status}`,
//       );
//     }
//   }

//   // set rider during assignment
//   if (status === 'ASSIGNED') {
//     if (!riderId) {
//       throw new ApiError(
//         StatusCodes.BAD_REQUEST,
//         'RiderId required for assignment',
//       );
//     }
//     delivery.rider = new Types.ObjectId(riderId);
//   }

//   // remove rider on certain statuses
//   if (['REQUESTED', 'REJECTED', 'CANCELLED'].includes(status)) {
//     delivery.rider = undefined;
//   }

//   // set isActive based on status
//   if (
//     [
//       'ASSIGNED',
//       'ACCEPTED',
//       'ARRIVED_PICKED_UP',
//       'STARTED',
//       'ARRIVED_DESTINATION',
//     ].includes(status)
//   ) {
//     delivery.isActive = true;
//   } else if (
//     ['DELIVERED', 'REJECTED', 'CANCELLED', 'FAILED'].includes(status)
//   ) {
//     delivery.isActive = false;
//   }

//   // set the new status
//   delivery.status = status;

//   const tsKey = statusTimestampsMap[status];
//   if (tsKey) {
//     delivery.timestamps = delivery.timestamps || {};
//     delivery.timestamps[tsKey] = new Date();
//   }

//   await delivery.save({ session });

//   const updatedDelivery = await Delivery.findById(delivery._id)
//     .populate('rider')
//     .populate<{ order: IOrder }>('order');

//   console.log(updatedDelivery, "updated delivery")

//   //  notification after successful status change
//   if (updatedDelivery) {
//     const { order, rider } = updatedDelivery;

//     const notifyPayload = {
//       title: `Delivery ${status}`,
//       message: `Your delivery status has been updated to ${status}`,
//       delivery: updatedDelivery._id,
//     };

//     // notify User
//     if (order?.user) {
//       await sendNotifications({
//         ...notifyPayload,
//         receiver: order.user.toString(),
//       });
//     }

//     if (order?.user) {
//       await sendNotifications({
//         ...notifyPayload,
//         type: 'ADMIN',
//         receiver: order.user.toString(),
//       });
//     }

//     // notify Rider
//     if (rider?._id) {
//       await sendNotifications({
//         ...notifyPayload,
//         receiver: rider._id.toString(),
//       });
//     }

//     // real time send data user, and rider
//     // @ts-ignore
//     const socketIo = global.io;
//     socketIo.emit(`delivery::status::${order.user.toString()}`, updatedDelivery);

//     if (rider?._id) {
//       socketIo.emit(`delivery::status::${rider._id}`, updatedDelivery);
//     }
//   }


//   return updatedDelivery;
// };

// export const notifyNearestRiders = async (deliveryId: string) => {
//   const delivery = await Delivery.findById(deliveryId).populate<{ order: IOrder }>('order');
//   if (!delivery) throw new ApiError(StatusCodes.NOT_FOUND, 'Delivery not found');
//   if (delivery.status !== 'REQUESTED') return;

//   const pickupCoordinates = delivery.order.pickupLocation.coordinates;

//   const nearestRiders = await findNearestOnlineRiders({
//     coordinates: pickupCoordinates,
//   });

//   if (!nearestRiders || nearestRiders.length === 0) {
//     console.log('No riders nearby');
//     return;
//   }

//   // @ts-ignore
//   const socketIo = global.io;
//   nearestRiders.forEach(rider => {
//     socketIo.emit(`delivery::request::${rider._id}`, delivery);
//   });
// };


// const updateRiderLocation = async (
//   riderId: string,
//   coordinates: [number, number],
// ) => {
//   if (!riderId) throw new Error('Rider ID is required');
//   if (!coordinates || !Array.isArray(coordinates) || coordinates.length !== 2) {
//     throw new Error('Invalid coordinates');
//   }

//   // update rider's geoLocation
//   await User.findByIdAndUpdate(riderId, {
//     geoLocation: {
//       type: 'Point',
//       coordinates,
//     },
//   });

//   // find active delivery of this rider
//   const activeDelivery = await Delivery.findOne({
//     rider: riderId,
//     isActive: true,
//   }).populate<{ order: IOrder & Document }>('order');

//   // emit real-time location to the user
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

//   return { riderId, coordinates };
// };


// const assignRiderWithTimeout = async (deliveryId: string) => {
//   const delivery = await Delivery.findById(deliveryId).populate<{
//     order: IOrder;
//   }>('order');

//   if (!delivery) {
//     throw new ApiError(StatusCodes.NOT_FOUND, 'Delivery not found');
//   }

//   const attemptedRiders = delivery.attempts.map(a => a.rider.toString());

//   const riders = await findNearestOnlineRiders(delivery.order.pickupLocation);
//   const nextRider = riders.find(
//     r => !attemptedRiders.includes(r._id.toString()),
//   );

//   if (!nextRider) {
//     // status update
//     await updateStatus({ deliveryId, status: 'FAILED' });

//     // refund payment
//     await refundIfNeeded(deliveryId);

//     throw new ApiError(
//       StatusCodes.BAD_REQUEST,
//       'No available rider found at this moment. Refund user payment.',
//     );
//   }

//   // assign rider
//   await updateStatus({
//     deliveryId,
//     status: 'ASSIGNED',
//     riderId: nextRider._id.toString(),
//   });

//   // save attempt
//   delivery.attempts.push({ rider: nextRider._id, attemptedAt: new Date() });
//   await delivery.save();

//   setTimeout(() => {
//     (async () => {
//       try {
//         const updatedDelivery = await Delivery.findById(deliveryId);

//         if (updatedDelivery?.status === 'ASSIGNED') {
//           // revert to REQUESTED
//           await updateStatus({ deliveryId, status: 'REQUESTED' });

//           // try assigning again
//           await assignRiderWithTimeout(deliveryId);
//         }
//       } catch (err) {
//         errorLogger.error('🚨 Error during rider reassignment:', err);
//       }
//     })();
//   }, 3600000); // 1hour,   1 minute  60000

//   return delivery;
// };

// const acceptDeliveryByRider = async (deliveryId: string, riderId: string) => {
//   const rider = await User.findById(riderId);

//   //  check stripe account before proceeding
//   if (!rider?.stripeAccountId) {
//     throw new ApiError(
//       StatusCodes.BAD_REQUEST,
//       'Rider must have a connected Stripe account to accept delivery.',
//     );
//   }

//   const delivery = await updateStatus({
//     deliveryId,
//     status: 'ACCEPTED',
//     riderId,
//   });
//   return delivery;
// };

// const rejectDeliveryByRider = async (deliveryId: string, riderId: string) => {
//   console.log(riderId, 'Rider ID');
//   await updateStatus({ deliveryId, status: 'REJECTED', riderId });

//   await updateStatus({ deliveryId, status: 'REQUESTED' });

//   return await assignRiderWithTimeout(deliveryId);
// };

// const cancelDeliveryByUser = async (deliveryId: string, userId: string) => {
//   const delivery = await updateStatus({
//     deliveryId,
//     status: 'CANCELLED',
//     userId,
//   });

//   // find associated payment
//   const payment = await Payment.findOne({ deliveryId: delivery?._id });

//   if (payment && payment.paymentIntentId) {
//     try {
//       // process refund through Stripe
//       const refund = await stripe.refunds.create({
//         payment_intent: payment.paymentIntentId,
//       });

//       console.log('✅ Refund successful:', refund.id);

//       // save refund status
//       payment.refunded = true;
//       payment.refundId = refund.id;
//       await payment.save();
//     } catch (err: any) {
//       console.error('❌ Refund failed:', err.message);
//     }
//   } else {
//     console.warn('⚠️ No valid payment found to refund.');
//   }
// };

// const markDeliveryArrivedPickedUp = async (
//   deliveryId: string,
//   riderId: string,
// ) => {
//   if (!riderId)
//     throw new ApiError(StatusCodes.BAD_REQUEST, 'RiderId is required');
//   return await updateStatus({
//     deliveryId,
//     status: 'ARRIVED_PICKED_UP',
//     riderId,
//   });
// };

// const markDeliveryStarted = async (deliveryId: string, riderId: string) => {
//   if (!riderId)
//     throw new ApiError(StatusCodes.BAD_REQUEST, 'RiderId is required');
//   return await updateStatus({ deliveryId, status: 'STARTED', riderId });
// };

// const markDeliveryArrivedDestination = async (
//   deliveryId: string,
//   riderId: string,
// ) => {
//   if (!riderId)
//     throw new ApiError(StatusCodes.BAD_REQUEST, 'RiderId is required');
//   return await updateStatus({
//     deliveryId,
//     status: 'ARRIVED_DESTINATION',
//     riderId,
//   });
// };

// // use transaction roll back
// const markDeliveryCompleted = async (deliveryId: string, riderId: string) => {
//   if (!riderId)
//     throw new ApiError(StatusCodes.BAD_REQUEST, 'RiderId is required');

//   const delivery = await updateStatus({
//     deliveryId,
//     status: 'DELIVERED',
//     riderId,
//   });

//   // payment transfer to rider
//   const rider = await User.findById(riderId);
//   const payment = await Payment.findOne({ deliveryId: delivery?._id });
//   const order = await Order.findById(delivery?.order);

//   if (rider?.stripeAccountId && payment && order) {
//     const transfer = await transferToRider({
//       stripeAccountId: rider.stripeAccountId,
//       amount: order.riderAmount,
//       orderId: order._id.toString(),
//     });

//     console.log('✅ Transfer successful:', transfer.id);
//   } else {
//     console.warn('⚠️ Transfer failed: Rider/Payment/Order doest not exist.');
//   }

//   return delivery;
// };

// const getDeliveryDetails = async (deliveryId: string) => {
//   const delivery = await Delivery.findById(deliveryId).populate('order');

//   if (!delivery) {
//     throw new ApiError(StatusCodes.NOT_FOUND, 'Delivery not found');
//   }

//   return delivery;
// };

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
  const result = await User.find({ // filterout by riderStatus
    role: 'RIDER',
    riderStatus: RIDER_STATUS.APPROVED,
    isOnline: true,
    'geoLocation.coordinates': { $ne: [0, 0] },
    geoLocation: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: location.coordinates,
        },
        $maxDistance: 20000000000, // 20k km
      },
    },
  });
  return result;
};

const finalStatuses = ['DELIVERED', 'CANCELLED', 'FAILED'];

// const updateStatus = async ({
//   deliveryId,
//   status,
//   riderId,
//   userId,
//   session,
// }: UpdateStatusOptions) => {
//   const delivery = await Delivery.findById(deliveryId)
//     .populate<{ order: IOrder }>('order')
//     .session(session || null);

//   if (!delivery) {
//     throw new ApiError(StatusCodes.NOT_FOUND, 'Delivery not found');
//   }

//   // prevent updates if delivery already in a final state (excluding REJECTED)
//   if (finalStatuses.includes(delivery.status)) {
//     throw new ApiError(
//       StatusCodes.BAD_REQUEST,
//       `Cannot change status once delivery is ${delivery.status}`,
//     );
//   }

//   // only accept if current status is REQUESTED
//   if (status === 'ACCEPTED' && delivery.status !== 'REQUESTED') {
//     throw new ApiError(
//       StatusCodes.BAD_REQUEST,
//       'Can only accept delivery if status is REQUESTED',
//     );
//   }

//   // validate permissions and extra constraints
//   if (status === 'ACCEPTED') {
//     if (!riderId) {
//       throw new ApiError(StatusCodes.FORBIDDEN, 'Rider ID required to accept');
//     }
//     delivery.rider = new Types.ObjectId(riderId);
//   }

//   if (status === 'CANCELLED') {
//     if (!userId || delivery.order?.user.toString() !== userId) {
//       throw new ApiError(StatusCodes.FORBIDDEN, 'Not authorized to cancel');
//     }
//     if (finalStatuses.includes(delivery.status)) {
//       throw new ApiError(
//         StatusCodes.BAD_REQUEST,
//         `Cannot cancel delivery once it is ${delivery.status}`,
//       );
//     }
//   }

//   // set isActive based on status
//   if (['ACCEPTED', 'ARRIVED_PICKED_UP', 'STARTED', 'ARRIVED_DESTINATION'].includes(status)) {
//     delivery.isActive = true;
//   } else if (['DELIVERED', 'REJECTED', 'CANCELLED', 'FAILED'].includes(status)) {
//     delivery.isActive = false;
//   }

//   // remove rider if delivery is CANCELLED/FAILED
//   if (['CANCELLED', 'FAILED'].includes(status)) {
//     delivery.rider = undefined;
//   }

//   // set the new status
//   delivery.status = status;

//   const tsKey = statusTimestampsMap[status];
//   if (tsKey) {
//     delivery.timestamps = delivery.timestamps || {};
//     delivery.timestamps[tsKey] = new Date();
//   }

//   await delivery.save({ session });

//   const updatedDelivery = await Delivery.findById(delivery._id)
//     .populate('rider')
//     .populate<{ order: IOrder }>('order');

//   // notification after successful status change
//   if (updatedDelivery) {
//     const { order, rider } = updatedDelivery;

//     const notifyPayload = {
//       title: `Delivery ${status}`,
//       message: `Your delivery status has been updated to ${status}`,
//       delivery: updatedDelivery._id,
//     };

//     // notify User
//     if (order?.user) {
//       await sendNotifications({
//         ...notifyPayload,
//         receiver: order.user.toString(),
//       });
//     }

//     if (order?.user) {
//       await sendNotifications({
//         ...notifyPayload,
//         type: 'ADMIN',
//         receiver: order.user.toString(),
//       });
//     }

//     // notify Rider
//     if (rider?._id) {
//       await sendNotifications({
//         ...notifyPayload,
//         receiver: rider._id.toString(),
//       });
//     }

//     // real time send data user, and rider
//     // @ts-ignore
//     const socketIo = global.io;
//     socketIo.emit(`delivery::status::${order.user.toString()}`, updatedDelivery);
//     if (rider?._id) {
//       socketIo.emit(`delivery::status::${rider._id}`, updatedDelivery);
//     }
//   }

//   return updatedDelivery;
// };



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

  // 🚫 prevent same rider from updating after rejection
  if (
    riderId &&
    delivery.rejectedRiders?.some(r => r.toString() === riderId)
  ) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      'You already rejected this delivery. Cannot update again.'
    );
  }

  // only accept if current status is REQUESTED
  if (status === 'ACCEPTED' && delivery.status !== 'REQUESTED') {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Can only accept delivery if status is REQUESTED',
    );
  }

  // validate permissions and extra constraints
  if (status === 'ACCEPTED') {
    if (!riderId) {
      throw new ApiError(StatusCodes.FORBIDDEN, 'Rider ID required to accept');
    }
    delivery.rider = new Types.ObjectId(riderId);
  }

  if (status === 'REJECTED') {
    if (!riderId) {
      throw new ApiError(StatusCodes.FORBIDDEN, 'Rider ID required to reject');
    }
    // add to rejectedRiders list
    if (!delivery.rejectedRiders) delivery.rejectedRiders = [];
    if (!delivery.rejectedRiders.some(r => r.toString() === riderId)) {
      delivery.rejectedRiders.push(new Types.ObjectId(riderId));
    }
    delivery.rider = undefined; // remove rider
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

  // set isActive based on status
  if (
    ['ACCEPTED', 'ARRIVED_PICKED_UP', 'STARTED', 'ARRIVED_DESTINATION'].includes(
      status,
    )
  ) {
    delivery.isActive = true;
  } else if (['DELIVERED', 'REJECTED', 'CANCELLED', 'FAILED'].includes(status)) {
    delivery.isActive = false;
  }

  // remove rider if delivery is CANCELLED/FAILED
  if (['CANCELLED', 'FAILED'].includes(status)) {
    delivery.rider = undefined;
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

  // 🔔 send notifications (same as before)
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

    // realtime socket
    // @ts-ignore
    const socketIo = global.io;
    socketIo.emit(`delivery::status::${order.user.toString()}`, updatedDelivery);
    if (rider?._id) {
      socketIo.emit(`delivery::status::${rider._id}`, updatedDelivery);
    }
  }

  return updatedDelivery;
};


// notify nearest riders without ASSIGNED
export const notifyNearestRiders = async (deliveryId: string) => {
  const delivery = await Delivery.findById(deliveryId).populate<{ order: IOrder }>('order');
  if (!delivery) throw new ApiError(StatusCodes.NOT_FOUND, 'Delivery not found');
  if (delivery.status !== 'REQUESTED') return;

  const attemptedRiders = delivery.attempts.map(a => a.rider.toString());

  const nearestRiders = await findNearestOnlineRiders(delivery.order.pickupLocation);
  const nextRider = nearestRiders.find(r => !attemptedRiders.includes(r._id.toString()));

  if (!nextRider) {
    await updateStatus({ deliveryId, status: 'FAILED' });
    await refundIfNeeded(deliveryId);
    return;
  }



  // @ts-ignore
  const socketIo = global.io;
  socketIo.emit(`delivery::request::${nextRider._id}`, delivery);

  delivery.attempts.push({ rider: nextRider._id, attemptedAt: new Date() });
  await delivery.save();

  setTimeout(async () => {
    const updatedDelivery = await Delivery.findById(deliveryId);
    if (updatedDelivery?.status === 'REQUESTED') {
      await notifyNearestRiders(deliveryId); // next rider
    }
  }, 3600000); // 1 hour
};

// update rider location
const updateRiderLocation = async (
  riderId: string,
  coordinates: [number, number],
) => {
  if (!riderId) throw new Error('Rider ID is required');
  if (!coordinates || !Array.isArray(coordinates) || coordinates.length !== 2) {
    throw new Error('Invalid coordinates');
  }

  await User.findByIdAndUpdate(riderId, {
    geoLocation: {
      type: 'Point',
      coordinates,
    },
  });

  const activeDelivery = await Delivery.findOne({
    rider: riderId,
    isActive: true,
  }).populate<{ order: IOrder & Document }>('order');

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

// rider accept / reject
const acceptDeliveryByRider = async (deliveryId: string, riderId: string) => {
  const rider = await User.findById(riderId);
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

// const rejectDeliveryByRider = async (deliveryId: string, riderId: string) => {
//   await notifyNearestRiders(deliveryId); // auto next rider
//   return await Delivery.findById(deliveryId);
// };

const rejectDeliveryByRider = async (
  deliveryId: string,
  riderId: string
) => {
  const delivery = await Delivery.findById(deliveryId);

  if (!delivery) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Delivery not found');
  }

  // যদি delivery ইতিমধ্যেই final status এ থাকে
  if (['DELIVERED', 'CANCELLED', 'FAILED'].includes(delivery.status)) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      `Cannot reject once delivery is ${delivery.status}`
    );
  }

  // যদি rider আগে reject করে থাকে
  if (
    delivery.rejectedRiders?.some(r => r.toString() === riderId)
  ) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      'You already rejected this delivery'
    );
  }

  // rider কে rejectedRiders এ push করা
  if (!delivery.rejectedRiders) delivery.rejectedRiders = [];
  delivery.rejectedRiders.push(new Types.ObjectId(riderId));

  // rider field clear করা
  delivery.rider = undefined;

  // status update করা

  delivery.isActive = false;

  await delivery.save();

  // auto notify অন্য nearest rider দের
  await notifyNearestRiders(deliveryId);

  return delivery;
};


// user cancel
const cancelDeliveryByUser = async (deliveryId: string, userId: string) => {
  const delivery = await updateStatus({
    deliveryId,
    status: 'CANCELLED',
    userId,
  });

  const payment = await Payment.findOne({ deliveryId: delivery?._id });

  if (payment && payment.paymentIntentId) {
    try {
      const refund = await stripe.refunds.create({
        payment_intent: payment.paymentIntentId,
      });

      console.log('✅ Refund successful:', refund.id);

      payment.refunded = true;
      payment.refundId = refund.id;
      await payment.save();

      // --- Send notification here ---
      await sendNotifications({
        title: 'Payment Refunded',
        message: `Your payment for delivery ${deliveryId} has been refunded.`,
        receiver: payment.userId,
        data: {
          deliveryId,
          refundId: refund.id,
          amountRefunded: payment.amountPaid,
        },
      });

    } catch (err: any) {
      console.error('❌ Refund failed:', err.message);
    }
  }
};

// delivery progression
const markDeliveryArrivedPickedUp = async (deliveryId: string, riderId: string) => {
  if (!riderId) throw new ApiError(StatusCodes.BAD_REQUEST, 'RiderId is required');
  return await updateStatus({ deliveryId, status: 'ARRIVED_PICKED_UP', riderId });
};

const markDeliveryStarted = async (deliveryId: string, riderId: string) => {
  if (!riderId) throw new ApiError(StatusCodes.BAD_REQUEST, 'RiderId is required');
  return await updateStatus({ deliveryId, status: 'STARTED', riderId });
};

const markDeliveryArrivedDestination = async (deliveryId: string, riderId: string) => {
  if (!riderId) throw new ApiError(StatusCodes.BAD_REQUEST, 'RiderId is required');
  return await updateStatus({ deliveryId, status: 'ARRIVED_DESTINATION', riderId });
};

const markDeliveryCompleted = async (deliveryId: string, riderId: string) => {
  if (!riderId) throw new ApiError(StatusCodes.BAD_REQUEST, 'RiderId is required');

  const delivery = await updateStatus({ deliveryId, status: 'DELIVERED', riderId });

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
  }

  // send notifications
  // rider notification
  if (rider) {
    await sendNotifications({
      title: 'Delivery Completed',
      message: `Delivery for order ${order?._id} has been marked as completed.`,
      receiver: rider._id.toString(),
      data: { deliveryId, orderId: order?._id },
    });
  }

  // customer notification
  if (order?.user) {
    await sendNotifications({
      title: 'Your Order Delivered',
      message: `Your order ${order._id} has been successfully delivered!`,
      receiver: order.user.toString(),
      data: { deliveryId, orderId: order._id },
    });
  }

  return delivery;
};


const getDeliveryDetails = async (deliveryId: string) => {
  const delivery = await Delivery.findById(deliveryId).populate('order');
  if (!delivery) throw new ApiError(StatusCodes.NOT_FOUND, 'Delivery not found');
  return delivery;
};



export const DeliveryServices = {
  findNearestOnlineRiders,
  // assignRiderWithTimeout,
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
