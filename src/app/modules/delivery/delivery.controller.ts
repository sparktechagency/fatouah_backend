import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { DeliveryServices } from './delivery.service';

const findNearestOnlineRiders = catchAsync(async (req, res) => {
  const location = req.body.location;
  const result = await DeliveryServices.findNearestOnlineRiders(location);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Find nearest online riders are retrieved',
    data: result,
  });
});

const assignRiderWithTimeout = catchAsync(async (req, res) => {
  const deliveryId = req.params.deliveryId;
  const result = await DeliveryServices.assignRiderWithTimeout(deliveryId);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Successfully Assign Rider',
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

export const DeliveryControllers = {
  findNearestOnlineRiders,
  assignRiderWithTimeout,
  rejectDeliveryByRider,
  cancelDeliveryByUser,
  getDeliveryDetails,
};
