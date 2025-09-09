import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { DeliveryServices } from './delivery.service';

const findNearestOnlineRiders = catchAsync(async (req, res) => {
  const { location } = req.body;

  const result = await DeliveryServices.findNearestOnlineRiders(location);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Find nearest online riders are retrieved',
    data: result,
  });
});

// const assignRiderWithTimeout = catchAsync(async (req, res) => {
//   const deliveryId = req.params.deliveryId;
//   const result = await DeliveryServices.assignRiderWithTimeout(deliveryId);
//   sendResponse(res, {
//     success: true,
//     statusCode: 200,
//     message: 'Successfully Assign Rider',
//     data: result,
//   });
// });

const acceptDeliveryByRider = catchAsync(async (req, res) => {
  const deliveryId = req.params.deliveryId;
  const riderId = req.user.id;
  const result = await DeliveryServices.acceptDeliveryByRider(
    deliveryId,
    riderId,
  );
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Rider successfully accept the delivery request',
    data: result,
  });
});

const rejectDeliveryByRider = catchAsync(async (req, res) => {
  const riderId = req.user.id;
  const deliveryId = req.params.deliveryId;
  const result = await DeliveryServices.rejectDeliveryByRider(
    deliveryId,
    riderId,
  );
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Successfully reject delivery by rider',
    data: result,
  });
});

const cancelDeliveryByUser = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const deliveryId = req.params.deliveryId;
  const result = await DeliveryServices.cancelDeliveryByUser(
    deliveryId,
    userId,
  );
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Successfully cancel delivery by user',
    data: result,
  });
});

const markDeliveryArrivedPickedUp = catchAsync(async (req, res) => {
  const deliveryId = req.params.deliveryId;
  const riderId = req.user.id;
  const result = await DeliveryServices.markDeliveryArrivedPickedUp(
    deliveryId,
    riderId,
  );
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Rider has arrived at pick up location',
    data: result,
  });
});

const markDeliveryStarted = catchAsync(async (req, res) => {
  const deliveryId = req.params.deliveryId;
  const riderId = req.user.id;
  const result = await DeliveryServices.markDeliveryStarted(
    deliveryId,
    riderId,
  );
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Delivery marked as started',
    data: result,
  });
});

const markDeliveryArrivedDestination = catchAsync(async (req, res) => {
  const deliveryId = req.params.deliveryId;
  const riderId = req.user.id;
  const result = await DeliveryServices.markDeliveryArrivedDestination(
    deliveryId,
    riderId,
  );
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Rider has arrived at the delivery location',
    data: result,
  });
});

const markDeliveryCompleted = catchAsync(async (req, res) => {
  const deliveryId = req.params.deliveryId;
  const riderId = req.user.id;
  const result = await DeliveryServices.markDeliveryCompleted(
    deliveryId,
    riderId,
  );
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Delivery completed successfully',
    data: result,
  });
});

const getDeliveryDetails = catchAsync(async (req, res) => {
  const id = req.params.id;
  const result = await DeliveryServices.getDeliveryDetails(id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Delivery details is retrieved successfully',
    data: result,
  });
});

// const updateRiderLocation = catchAsync(async (req, res) => {
//   const { geoLocation } = req.body;

//   const riderId = req.user.id;
//   const result = await DeliveryServices.updateRiderLocation(
//     riderId,
//     geoLocation,
//   );
//   sendResponse(res, {
//     success: true,
//     statusCode: 200,
//     message: 'Successfully update rider location',
//     data: result,
//   });
// });

export const DeliveryControllers = {
  findNearestOnlineRiders,
  // assignRiderWithTimeout,
  rejectDeliveryByRider,
  cancelDeliveryByUser,
  getDeliveryDetails,
  acceptDeliveryByRider,
  // updateRiderLocation,
  markDeliveryStarted,
  markDeliveryArrivedDestination,
  markDeliveryArrivedPickedUp,
  markDeliveryCompleted,
};
