import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { ReportServices } from './report.service';

const userReport = catchAsync(async (req, res) => {
  const result = await ReportServices.userReport();
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'User reports are retrieved successfully',
    data: result,
  });
});

const riderReport = catchAsync(async (req, res) => {
  const result = await ReportServices.riderReport();
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Rider reports are retrieved successfully',
    data: result,
  });
});

const parcelReport = catchAsync(async (req, res) => {
  const result = await ReportServices.parcelReport();
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Parcel report are retrieved successfully',
    data: result,
  });
});

const totalDeliveryReport = catchAsync(async (req, res) => {
  const result = await ReportServices.totalDeliveryReport();
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Total delivery data are retrieved successfully',
    data: result,
  });
});

const totalUsers = catchAsync(async (req, res) => {
  const result = await ReportServices.totalUsers();
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Total users data are retrieved successfully',
    data: result,
  });
});

const totalRiders = catchAsync(async (req, res) => {
  const result = await ReportServices.totalRiders();
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Total riders data are retrieved successfully',
    data: result,
  });
});

const totalBikeAndCars = catchAsync(async (req, res) => {
  const result = await ReportServices.totalBikeAndCars();
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Total bike and car data are retrieved successfully',
    data: result,
  });
});

const getUserOrderHistory = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const result = await ReportServices.getUserOrderHistory(userId);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Order history are retrieved successfully",
    data: result,
  })
})

export const ReportControllers = {
  userReport,
  riderReport,
  parcelReport,
  totalDeliveryReport,
  totalUsers,
  totalRiders,
  totalBikeAndCars,
  getUserOrderHistory
};
