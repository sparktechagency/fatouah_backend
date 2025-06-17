import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { ReportServices } from './report.service';

const userReport = catchAsync(async (req, res) => {
  const result = await ReportServices.userReport(req.query);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'User reports are retrieved successfully',
    data: result,
  });
});

const riderReport = catchAsync(async (req, res) => {
  const result = await ReportServices.riderReport(req.query);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Rider reports are retrieved successfully',
    data: result,
  });
});

const parcelReport = catchAsync(async (req, res) => {
  const result = await ReportServices.parcelReport(req.query);
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

const totalAdminEarnings = catchAsync(async (req, res) => {
  const result = await ReportServices.totalAdminEarnings();
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Total admin earnings data are retrieved successfully',
    data: result,
  });
});

const totalMonthlyDeliveryReport = catchAsync(async (req, res) => {
  const year = req.query.year;
  const result = await ReportServices.totalMonthlyDeliveryReport(year);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Retrieved monthly delivery report',
    data: result,
  });
});

const revenueAnalyticsReport = catchAsync(async (req, res) => {
  const year = req.query.year;
  const result = await ReportServices.revenueAnalyticsReport(year);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Retrieved revenue analytics report',
    data: result,
  });
});

const getUserOrderHistory = catchAsync(async (req, res) => {
  const user = req.user.email;
  const result = await ReportServices.getUserOrderHistory(user, req.query);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'User order history are retrieved successfully',
    data: result,
  });
});

const getRiderOrderHistory = catchAsync(async (req, res) => {
  const user = req.user.email;
  const result = await ReportServices.getRiderOrderHistory(user, req.query);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Rider order history are retrieved successfully',
    data: result,
  });
});

const getUserOrderDetailsById = catchAsync(async (req, res) => {
  const orderId = req.params.orderId;
  const user = req.user.email;
  const result = await ReportServices.getUserOrderDetailsById(orderId, user);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Order details are retrieved successfully',
    data: result,
  });
});

const getRiderOrderDetailsById = catchAsync(async (req, res) => {
  const orderId = req.params.orderId;
  const user = req.user.email;
  const result = await ReportServices.getRiderOrderDetailsById(orderId, user);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Order details are retrieved successfully',
    data: result,
  });
});

const getRiderWeeklyEarnings = catchAsync(async (req, res) => {
  const user = req.user.email;
  const result = await ReportServices.getRiderWeeklyEarnings(user);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Rider weekly earnings data retrieved successfully',
    data: result,
  });
});

const getBalanceTransactions = catchAsync(async (req, res) => {
  const result = await ReportServices.getBalanceTransactions();
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Successfully retrieved are balance transactions data',
    data: result,
  });
});

const getRiderTransactionHistory = catchAsync(async (req, res) => {
  const user = req.user.email;
  const result = await ReportServices.getRiderTransactionHistory(user);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Successfully retrieved are transactions data for rider',
    data: result,
  });
});


const getRiderTrips = catchAsync(async (req, res) => {
  const { riderId } = req.params;
  const result = await ReportServices.getRiderTrips(riderId);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Successfully retrieved are rider trips',
    data: result,
  });
});

export const ReportControllers = {
  userReport,
  riderReport,
  parcelReport,
  totalDeliveryReport,
  totalUsers,
  totalRiders,
  totalBikeAndCars,
  totalAdminEarnings,
  totalMonthlyDeliveryReport,
  revenueAnalyticsReport,
  getBalanceTransactions,
  getUserOrderHistory,
  getUserOrderDetailsById,
  getRiderOrderDetailsById,
  getRiderOrderHistory,
  getRiderWeeklyEarnings,
  getRiderTransactionHistory,
  getRiderTrips,
};
