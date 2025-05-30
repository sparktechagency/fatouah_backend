import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { OrderServices } from './order.service';

export const createParcelOrder = catchAsync(async (req, res) => {
  const user = req.user;
  const parcelOrderData = req.body;
  const result = await OrderServices.createParcelOrderToDB(
    user,
    parcelOrderData,
  );

 
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Parcel order is created successfully',
    data: result,
  });
});

export const OrderControllers = {
  createParcelOrder,
};
