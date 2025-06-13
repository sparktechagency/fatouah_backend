import { Request, Response } from 'express';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { NotificationServices } from './notification.service';

const getNotification = catchAsync(async (req, res) => {
  const user = req.user;
  const result = await NotificationServices.getNotificationFromDB(user);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Notification are retrieved successfully',
    data: result,
  });
});

const readNotification = catchAsync(async (req, res) => {
  const user = req.user;
  const result = await NotificationServices.readNotificationToDB(user);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Notification read successfully',
    data: result,
  });
});

export const NotificationControllers = {
  getNotification,
  readNotification,
};
