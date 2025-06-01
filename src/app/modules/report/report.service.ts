import { FilterQuery } from 'mongoose';
import { Payment } from '../payment/payment.model';
import { User } from '../user/user.model';
import { IDelivery } from '../delivery/delivery.interface';
import { Delivery } from '../delivery/delivery.model';

const userReport = async () => {
  const result = await User.aggregate([
    {
      $match: { role: 'USER' },
    },
    {
      $lookup: {
        from: 'payments',
        let: { userIdStr: { $toString: '$_id' } },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ['$userId', '$$userIdStr'],
              },
            },
          },
        ],
        as: 'payments',
      },
    },
    {
      $match: {
        'payments.0': { $exists: true },
      },
    },
    {
      $project: {
        name: 1,
        status: 1,
        joiningDate: '$createdAt',
        parcelSent: { $size: '$payments' },
      },
    },
  ]);

  return result;
};

const riderReport = async () => {
  const result = await Payment.aggregate([
    // Step 1: Convert deliveryId to ObjectId
    {
      $addFields: {
        deliveryId: { $toObjectId: '$deliveryId' },
      },
    },
    // Step 2: Lookup delivery
    {
      $lookup: {
        from: 'deliveries',
        localField: 'deliveryId',
        foreignField: '_id',
        as: 'delivery',
      },
    },
    {
      $unwind: '$delivery',
    },
    // Step 3: Filter only delivered deliveries
    {
      $match: {
        'delivery.status': 'DELIVERED',
      },
    },
    // Step 5: Convert delivery.rider to ObjectId
    {
      $addFields: {
        'delivery.rider': { $toObjectId: '$delivery.rider' },
      },
    },
    // Step 6: Lookup rider info
    {
      $lookup: {
        from: 'users', // or 'riders' if your rider collection has a different name
        localField: 'delivery.rider',
        foreignField: '_id',
        as: 'rider',
      },
    },

    // Step 7: Unwind rider
    {
      $unwind: '$rider',
    },

    // Step 8: Lookup total deliveries by this rider (with status DELIVERED)
    {
      $lookup: {
        from: 'deliveries',
        let: { riderId: '$delivery.rider' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$rider', '$$riderId'] },
                  { $eq: ['$status', 'DELIVERED'] },
                ],
              },
            },
          },
          { $count: 'deliveredCount' },
        ],
        as: 'riderDelivered',
      },
    },

    // Step 9: Flatten deliveredCount result
    {
      $addFields: {
        deliveredCount: {
          $ifNull: [{ $arrayElemAt: ['$riderDelivered.deliveredCount', 0] }, 0],
        },
      },
    },

    // Step 10: Final projection
    {
      $project: {
        _id: 0,
        transactionId: 1,
        amountPaid: 1,
        paidAt: 1,
        status: 1,
        riderName: '$rider.name',
        riderStatus: '$rider.status',
        riderJoinedAt: '$rider.createdAt',
        deliveredParcelCount: '$deliveredCount',
        vehicle: '$rider.vehicleType',
      },
    },
  ]);

  return result;
};

const parcelReport = async () => {
  const result = await Payment.aggregate([
    // Step 1: Convert deliveryId to ObjectId
    {
      $addFields: {
        deliveryId: { $toObjectId: '$deliveryId' },
      },
    },

    // Step 2: Lookup delivery info
    {
      $lookup: {
        from: 'deliveries',
        localField: 'deliveryId',
        foreignField: '_id',
        as: 'delivery',
      },
    },
    { $unwind: '$delivery' },

    // Step 3: Filter only deliveries with status ACCEPTED
    {
      $match: {
        'delivery.status': { $in: ['ACCEPTED', 'DELIVERED'] },
      },
    },

    // Step 4: Convert nested IDs to ObjectId
    {
      $addFields: {
        orderId: { $toObjectId: '$delivery.order' },
        riderId: { $toObjectId: '$delivery.rider' },
      },
    },

    // Step 5: Lookup order
    {
      $lookup: {
        from: 'orders',
        localField: 'orderId',
        foreignField: '_id',
        as: 'order',
      },
    },
    { $unwind: '$order' },

    // Step 6: Convert sender ID
    {
      $addFields: {
        senderId: { $toObjectId: '$order.user' },
      },
    },

    // Step 7: Lookup sender
    {
      $lookup: {
        from: 'users',
        localField: 'senderId',
        foreignField: '_id',
        as: 'sender',
      },
    },
    { $unwind: '$sender' },

    // Step 8: Lookup rider
    {
      $lookup: {
        from: 'users',
        localField: 'riderId',
        foreignField: '_id',
        as: 'rider',
      },
    },
    { $unwind: '$rider' },

    // Step 9: Final projection
    {
      $project: {
        _id: 0,
        orderId: '$order._id',
        orderCreatedAt: '$order.createdAt',
        senderName: '$sender.name',
        receiverName: '$order.receiversName',
        riderName: '$rider.name',
        status: {
          $cond: {
            if: { $eq: ['$delivery.status', 'DELIVERED'] },
            then: 'Completed',
            else: 'Pending',
          },
        },
      },
    },
  ]);

  return result;
};

const totalDeliveryReport = async (): Promise<number> => {
  const filter: FilterQuery<IDelivery> = { status: 'DELIVERED' };

  return Delivery.countDocuments(filter).exec();
};

export const totalUsers = async (): Promise<number> => {
  return await User.countDocuments({
    verified: true,
    role: 'USER',
    status: 'active',
  });
};

export const totalRiders = async (): Promise<number> => {
  return await User.countDocuments({
    verified: true,
    role: 'RIDER',
    status: 'active',
  });
};

export const totalBikeAndCars = async () => {
  const [bikeCount, carCount] = await Promise.all([
    User.countDocuments({
      vehicleType: 'BIKE',
      status: 'active',
      role: 'RIDER',
      verified: true,
    }),
    User.countDocuments({
      vehicleType: 'CAR',
      status: 'active',
      role: 'RIDER',
      verified: true,
    }),
  ]);

  return {
    bike: bikeCount,
    car: carCount,
  };
};

export const ReportServices = {
  userReport,
  riderReport,
  parcelReport,
  totalDeliveryReport,
  totalUsers,
  totalRiders,
  totalBikeAndCars,
};
