import { JwtPayload } from "jsonwebtoken";
import { Notification } from "./notification.model";
import QueryBuilder from "../../builder/QueryBuilder";


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
const adminNotificationFromDB = async (query: any) => {
     const queryBuilder = new QueryBuilder(
          Notification.find({ type: 'ADMIN' }),
          query
     )
          .paginate()

     const adminNotification = await queryBuilder.modelQuery;
     const pagination = await queryBuilder.getPaginationInfo();

     return {
          meta: pagination,
          data: adminNotification,
     };
};

// read notifications only for admin
const adminReadNotificationToDB = async () => {
     const result = await Notification.updateMany({ read: false }, { $set: { read: true } }, { new: true });
     return result;
};


// read single notification
const adminReadNotificationByIdToDB = async (id: string) => {
     const result = await Notification.findByIdAndUpdate(
          { _id: id, read: false },
          { $set: { read: true } },
          { new: true });
     return result;
}


export const NotificationServices = {
     getNotificationFromDB,
     readNotificationToDB,
     adminNotificationFromDB,
     adminReadNotificationToDB,
     adminReadNotificationByIdToDB,
}
