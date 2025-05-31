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

export const ReportControllers = {
  userReport,
  riderReport,
};
