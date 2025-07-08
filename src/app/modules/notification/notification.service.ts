import { JwtPayload } from "jsonwebtoken";
import { Notification } from "./notification.model";


const getNotificationFromDB = async (user: JwtPayload) => {
     const result = await Notification.find({ receiver: user._id });

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
     const result = await Notification.updateMany({ receiver: user._id, read: false }, { $set: { read: true } });
     return result;
};

// get notifications for admin
const adminNotificationFromDB = async () => {
     const result = await Notification.find();
     return result;
};

// read notifications only for admin
const adminReadNotificationToDB = async () => {
     const result = await Notification.updateMany({ read: false }, { $set: { read: true } }, { new: true });
     return result;
};

export const NotificationServices = {
     getNotificationFromDB,
     readNotificationToDB,
     adminNotificationFromDB,
     adminReadNotificationToDB,
}
