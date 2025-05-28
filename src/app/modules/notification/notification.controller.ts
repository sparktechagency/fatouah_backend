import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { sendToTopic } from '../services/fcmService';

 const sendNotificationController = catchAsync(async (req, res) => {
  const { topic, title, body } = req.body;

  if (!topic || !title || !body) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Missing fields');
  }

  const result = await sendToTopic(topic, { title, body });

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Notification send successfully',
    data: result,
  });
});

export const NotificationControllers = {
  sendNotificationController,
};
