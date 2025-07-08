import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { NotificationServices } from "./notification.service";

const getNotificationFromDB = catchAsync(async (req, res) => {
  const user: any = req.user;
  const result = await NotificationServices.getNotificationFromDB(user);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Notifications Retrieved Successfully',
    data: result,
  });
});


const readNotification = catchAsync(async (req, res) => {
  const user = req.user;
  const result = await NotificationServices.readNotificationToDB(user);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Notification Read Successfully',
    data: result,
  });
});

const adminNotificationFromDB = catchAsync(async (req, res) => {
  const result = await NotificationServices.adminNotificationFromDB();

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Notifications Retrieved Successfully',
    data: result,
  });
});

const adminReadNotification = catchAsync(async (req, res) => {
  const result = await NotificationServices.adminReadNotificationToDB();

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Notification Read Successfully',
    data: result,
  });
});

export const NotificationControllers = {
  getNotificationFromDB,
  readNotification,
  adminNotificationFromDB,
  adminReadNotification,
}