import { JwtPayload } from 'jsonwebtoken';
import { INotification } from './notification.interface';
import { Notification } from './notification.model';

const sendNotificationToDB = async (payload: INotification) => {
  const response = await Notification.create(payload);

  // @ts-ignore
  const io = global.io;
  if (io) {
    // Emit to specific user
    io.emit(`getNotification::${payload.receiver}`, {
      notification: response,
      delivery: payload.delivery, // include full delivery
    });

    // if rider exists, notify separately
    if (payload.riderId) {
      io.emit(`getNotification::${payload.riderId}`, {
        notification: response,
        delivery: payload.delivery,
      });
    }
  }

  return response;
};

// get notifications
const getNotificationFromDB = async (user: JwtPayload) => {
  console.log(user.id, 'User ID');
  const result = await Notification.find({ receiver: user.id }).populate({
    path: 'sender',
    select: 'name email',
  });
  const unreadCount = await Notification.countDocuments({
    receiver: user.id,
    read: false,
  });
  const data = {
    result,
    unreadCount,
  };
  return data;
};

// read notifications only for user
const readNotificationToDB = async (user: JwtPayload) => {
  const result = await Notification.updateMany(
    { receiver: user.id, read: false },
    { $set: { read: true } },
  );
  return result;
};

export const NotificationServices = {
  sendNotificationToDB,
  getNotificationFromDB,
  readNotificationToDB,
};
