import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import { IOrder } from '../order/order.interface';
import { User } from '../user/user.model';
import { Delivery } from './delivery.model';
import { statusTimestampsMap, UpdateStatusOptions } from './delivery.interface';
import { Types } from 'mongoose';
import { errorLogger } from '../../../shared/logger';

// find nearest riders
const findNearestOnlineRiders = async (location: {
  coordinates: [number, number];
}) => {
  if (!location.coordinates || !Array.isArray(location.coordinates) || location.coordinates.length !== 2) {
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
      io.emit("rider-location-updated", riderId, {
        coordinates: result.geoLocation?.coordinates,
      });
    }
  }

  return result;
};


const updateStatus = async ({
  deliveryId,
  status,
  riderId,
  userId,
}: UpdateStatusOptions) => {
  const delivery = await Delivery.findById(deliveryId).populate<{
    order: IOrder;
  }>('order');
  if (!delivery) throw new ApiError(StatusCodes.NOT_FOUND, 'Delivery not found');

  // Validate status transitions and permissions

  if (status === 'ACCEPTED') {
    if (delivery.status !== 'ASSIGNED')
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Delivery not in ASSIGNED state');
    if (!riderId || delivery.rider?.toString() !== riderId)
      throw new ApiError(StatusCodes.FORBIDDEN, 'You are not assigned rider');
  }

  if (status === 'REJECTED') {
    if (!riderId || delivery.rider?.toString() !== riderId)
      throw new ApiError(StatusCodes.FORBIDDEN, 'You are not assigned rider');
  }

  if (status === 'CANCELLED') {
    if (!userId || delivery.order?.user.toString() !== userId)
      throw new ApiError(StatusCodes.FORBIDDEN, 'Not authorized to cancel');
    if (['DELIVERED', 'CANCELLED'].includes(delivery.status))
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Cannot cancel delivered or cancelled delivery');
  }

  if (status === 'ASSIGNED') {
    if (!riderId) throw new ApiError(StatusCodes.BAD_REQUEST, 'RiderId required for assignment');
    delivery.rider = new Types.ObjectId(riderId);
  }

  // Remove rider for some statuses
  if (['REQUESTED', 'REJECTED', 'CANCELLED'].includes(status)) {
    delivery.rider = undefined;
  }


  delivery.status = status;

  // Set timestamp if available
  const tsKey = statusTimestampsMap[status];
  if (tsKey) delivery.timestamps[tsKey] = new Date();

  await delivery.save();

  // Optional: Emit socket event for real-time update
  // @ts-ignore
  const io = global.io;
  if (io) {
    io.emit(`delivery-status::${deliveryId}`, {
      delivery,
    });
  }

  return delivery;
};


// const assignRiderWithTimeout = async (deliveryId: string) => {
//   const delivery = await Delivery.findById(deliveryId).populate<{
//     order: IOrder;
//   }>('order');
//   if (!delivery) throw new ApiError(StatusCodes.NOT_FOUND, 'Delivery not found');

//   const attemptedRiders = delivery.attempts.map(a => a.rider.toString());

//   const riders = await findNearestOnlineRiders(delivery.order.pickupLocation);
//   const nextRider = riders.find(r => !attemptedRiders.includes(r._id.toString()));

//   if (!nextRider)
//     throw new ApiError(StatusCodes.BAD_REQUEST, 'No available rider to assign');

//   await updateStatus({ deliveryId, status: 'ASSIGNED', riderId: nextRider._id.toString() });

//   delivery.attempts.push({ rider: nextRider._id, attemptedAt: new Date() });
//   await delivery.save();

//   // After 1 minute, if rider did not accept, revert to REQUESTED and try next rider
//   setTimeout(async () => {
//     const updatedDelivery = await Delivery.findById(deliveryId);
//     if (updatedDelivery?.status === 'ASSIGNED') {
//       await updateStatus({ deliveryId, status: 'REQUESTED' });
//       await assignRiderWithTimeout(deliveryId);
//     }
//   }, 60000);

//   return delivery;
// };

const assignRiderWithTimeout = async (deliveryId: string) => {
  const delivery = await Delivery.findById(deliveryId).populate<{
    order: IOrder;
  }>('order');

  if (!delivery) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Delivery not found');
  }

  const attemptedRiders = delivery.attempts.map(a => a.rider.toString());

  const riders = await findNearestOnlineRiders(delivery.order.pickupLocation);
  const nextRider = riders.find(r => !attemptedRiders.includes(r._id.toString()));

  if (!nextRider) {

    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'No available rider found at this moment. Please try again shortly.'
    );
  }

  // assign rider
  await updateStatus({ deliveryId, status: 'ASSIGNED', riderId: nextRider._id.toString() });

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
  }, 60000); // 1 minute

  return delivery;
};


const acceptDeliveryByRider = async (deliveryId: string, riderId: string) => {
  return updateStatus({ deliveryId, status: 'ACCEPTED', riderId });
};

const rejectDeliveryByRider = async (deliveryId: string, riderId: string) => {
  return updateStatus({ deliveryId, status: 'REJECTED', riderId });
};

const cancelDeliveryByUser = async (deliveryId: string, userId: string) => {
  return updateStatus({ deliveryId, status: 'CANCELLED', userId });
};

const markDeliveryStarted = async (deliveryId: string, riderId: string) => {
  if (!riderId) throw new ApiError(StatusCodes.BAD_REQUEST, 'RiderId is required');
  return updateStatus({ deliveryId, status: 'STARTED', riderId });
};

const markDeliveryArrived = async (deliveryId: string, riderId: string) => {
  if (!riderId) throw new ApiError(StatusCodes.BAD_REQUEST, 'RiderId is required');
  return updateStatus({ deliveryId, status: 'ARRIVED', riderId });
};

const markDeliveryPickedUp = async (deliveryId: string, riderId: string) => {
  if (!riderId) throw new ApiError(StatusCodes.BAD_REQUEST, 'RiderId is required');
  return updateStatus({ deliveryId, status: 'PICKED_UP', riderId });
};

const markDeliveryCompleted = async (deliveryId: string, riderId: string) => {
  if (!riderId) throw new ApiError(StatusCodes.BAD_REQUEST, 'RiderId is required');
  return updateStatus({ deliveryId, status: 'DELIVERED', riderId });
};


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
  markDeliveryArrived,
  markDeliveryPickedUp,
  markDeliveryCompleted
};
