import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { OrderServices } from './order.service';

// export const createParcelOrder = catchAsync(async (req, res) => {
//   const user = req.user;
//   const parcelOrderData = req.body;
//   const result = await OrderServices.createParcelOrderToDB(
//     user,
//     parcelOrderData,
//   );

//   sendResponse(res, {
//     success: true,
//     statusCode: 200,
//     message: 'Parcel order is created successfully',
//     data: result,
//   });
// });

const createStripeSessionOnly = catchAsync(async (req, res) => {
  const user = req.user;
  const parcelOrderData = req.body;
  const result = await OrderServices.createStripeSessionOnly(
    user,
    parcelOrderData,
  );

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Stripe session created successfully',
    data: result,
  });
});

const orderSuccess = catchAsync(async (req, res) => {
  const sessionId = req.query.session_id as string;
  const session = await OrderServices.successMessage(sessionId);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Order created successfully',
    data: session.id,
  });
});

const orderCancel = catchAsync(async (req, res) => {
  res.render('cancel');
});

const getOrderSuccessDetails = catchAsync(async (req, res) => {
  const sessionId = req.query.session_id as string;

  const result = await OrderServices.getSuccessOrderDetails(sessionId);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Success order details data retrieved successfully',
    data: result,
  });
});

const getOrderDetailsByOrderId = catchAsync(async (req, res) => {
  const { orderId } = req.params;
  const result = await OrderServices.getOrderDetailsByOrderId(orderId);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Order data is retrieved successfully",
    data: result,
  })
})

export const OrderControllers = {
  // createParcelOrder,
  createStripeSessionOnly,
  orderSuccess,
  orderCancel,
  getOrderSuccessDetails,
  getOrderDetailsByOrderId,
};
