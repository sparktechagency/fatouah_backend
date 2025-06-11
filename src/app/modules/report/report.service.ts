import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import { Payment } from '../payment/payment.model';
import { User } from '../user/user.model';
import { startOfDay, endOfDay, subDays } from 'date-fns';
import { Order } from '../order/order.model';
import QueryBuilder from '../../builder/QueryBuilder';
import { riderSearchableFields, userSearchableFields } from './report.constant';
const { startOfYear, endOfYear } = require('date-fns');

// i will delete this before finish development process
const userReports = async () => {
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
      $project: {
        name: 1,
        status: 1,
        joiningDate: '$createdAt',
        parcelSent: {
          $cond: {
            if: { $isArray: '$payments' },
            then: { $size: '$payments' },
            else: 0,
          },
        },
      },
    },
  ]);

  return result;
};

const userReport = async (query: any) => {
  const users = await User.aggregate([
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
      $project: {
        name: 1,
        status: 1,
        joiningDate: '$createdAt',
        parcelSent: {
          $cond: {
            if: { $isArray: '$payments' },
            then: { $size: '$payments' },
            else: 0,
          },
        },
      },
    },
  ]);

  const userQuery = new QueryBuilder(users, query)
    .search(userSearchableFields)
    .filter()
    .paginate();

  const result = userQuery.modelQuery;
  const meta = await userQuery.getPaginationInfo();

  return {
    data: result,
    meta,
  };
};

const riderReport = async (query: any) => {
  const riders = await Payment.aggregate([
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

  const riderQuery = new QueryBuilder(riders, query).search(riderSearchableFields).filter().paginate();

  const result = riderQuery.modelQuery;
  const meta = await riderQuery.getPaginationInfo();
  return {
    data: result,
    meta,
  }

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

const totalUsers = async (): Promise<number> => {
  return await User.countDocuments({
    verified: true,
    role: 'USER',
    status: 'active',
  });
};

const totalRiders = async (): Promise<number> => {
  return await User.countDocuments({
    verified: true,
    role: 'RIDER',
    status: 'active',
  });
};

const totalBikeAndCars = async () => {
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

const totalDeliveryReport = async () => {
  const result = await Payment.aggregate([
    {
      $match: {
        status: 'succeeded',
        refunded: { $ne: true },
      },
    },
    {
      $addFields: {
        deliveryObjectId: { $toObjectId: '$deliveryId' },
      },
    },
    {
      $lookup: {
        from: 'deliveries',
        localField: 'deliveryObjectId',
        foreignField: '_id',
        as: 'delivery',
      },
    },
    { $unwind: '$delivery' },
    {
      $match: {
        'delivery.status': 'DELIVERED',
      },
    },
    {
      $count: 'totalDelivered',
    },
  ]);

  const totalDelivered = result[0]?.totalDelivered || 0;
  return totalDelivered;
};

const totalAdminEarnings = async () => {
  const todayStart = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());
  const yesterdayStart = startOfDay(subDays(new Date(), 1));
  const yesterdayEnd = endOfDay(subDays(new Date(), 1));

  const result = await Payment.aggregate([
    {
      $match: {
        status: 'succeeded',
        refunded: { $ne: true },
      },
    },
    {
      $addFields: {
        deliveryObjectId: { $toObjectId: '$deliveryId' },
      },
    },
    {
      $lookup: {
        from: 'deliveries',
        localField: 'deliveryObjectId',
        foreignField: '_id',
        as: 'delivery',
      },
    },
    { $unwind: '$delivery' },
    {
      $match: {
        'delivery.status': 'DELIVERED',
      },
    },
    {
      $facet: {
        today: [
          {
            $match: {
              paidAt: { $gte: todayStart, $lte: todayEnd },
            },
          },
          {
            $group: {
              _id: null,
              totalCommission: { $sum: '$commissionAmount' },
            },
          },
        ],
        yesterday: [
          {
            $match: {
              paidAt: { $gte: yesterdayStart, $lte: yesterdayEnd },
            },
          },
          {
            $group: {
              _id: null,
              totalCommission: { $sum: '$commissionAmount' },
            },
          },
        ],
        allTime: [
          {
            $group: {
              _id: null,
              totalCommission: { $sum: '$commissionAmount' },
            },
          },
        ],
      },
    },
  ]);

  const todayTotal = result[0].today[0]?.totalCommission || 0;
  const yesterdayTotal = result[0].yesterday[0]?.totalCommission || 0;
  const allTimeTotal = result[0].allTime[0]?.totalCommission || 0;

  let percentageChange = 0;
  let isGrowth = false;

  if (yesterdayTotal === 0) {
    if (todayTotal > 0) {
      percentageChange = 100; // or any large number you want to show for big growth
      isGrowth = true;
    }
  } else {
    percentageChange = ((todayTotal - yesterdayTotal) / yesterdayTotal) * 100;
    isGrowth = percentageChange > 0;
  }

  // Optional: Cap percentageChange to 100% for better UX
  percentageChange = Math.min(Math.abs(percentageChange), 100);

  return {
    today: todayTotal,
    yesterday: yesterdayTotal,
    percentageChange: Number(percentageChange.toFixed(2)),
    isGrowth,
    allTimeTotal,
  };
};

const totalMonthlyDeliveryReport = async (year: any) => {
  const currentYear = new Date().getFullYear();
  const selectedYear = year || currentYear;

  const yearStart = startOfYear(new Date(selectedYear, 0, 1));
  const yearEnd = endOfYear(new Date(selectedYear, 0, 1));

  const result = await Payment.aggregate([
    {
      $match: {
        status: 'succeeded',
        refunded: { $ne: true },
        paidAt: { $gte: yearStart, $lte: yearEnd },
      },
    },
    {
      $addFields: {
        deliveryObjectId: { $toObjectId: '$deliveryId' },
      },
    },
    {
      $lookup: {
        from: 'deliveries',
        localField: 'deliveryObjectId',
        foreignField: '_id',
        as: 'delivery',
      },
    },
    { $unwind: '$delivery' },
    {
      $match: {
        'delivery.status': 'DELIVERED',
      },
    },
    {
      $group: {
        _id: { month: { $month: '$paidAt' } },
        totalDeliveries: { $sum: 1 },
      },
    },
    {
      $sort: { '_id.month': 1 },
    },
    {
      $project: {
        _id: 0,
        month: '$_id.month',
        totalDeliveries: 1,
      },
    },
  ]);

  // Fill missing months with zero count
  const monthlyData = [];
  for (let m = 1; m <= 12; m++) {
    const monthData = result.find(r => r.month === m);
    monthlyData.push({
      month: m,
      totalDeliveries: monthData ? monthData.totalDeliveries : 0,
    });
  }

  return monthlyData;
};

const revenueAnalyticsReport = async (year: any) => {
  const currentYear = new Date().getFullYear();
  const selectedYear = year || currentYear;

  const yearStart = startOfYear(new Date(selectedYear, 0, 1));
  const yearEnd = endOfYear(new Date(selectedYear, 0, 1));

  const result = await Payment.aggregate([
    {
      $match: {
        status: 'succeeded',
        refunded: { $ne: true },
        paidAt: { $gte: yearStart, $lte: yearEnd },
      },
    },
    {
      $addFields: {
        deliveryObjectId: { $toObjectId: '$deliveryId' },
      },
    },
    {
      $lookup: {
        from: 'deliveries',
        localField: 'deliveryObjectId',
        foreignField: '_id',
        as: 'delivery',
      },
    },
    { $unwind: '$delivery' },
    {
      $match: {
        'delivery.status': 'DELIVERED',
      },
    },
    {
      $group: {
        _id: { month: { $month: '$paidAt' } },
        totalCommission: { $sum: '$commissionAmount' },
      },
    },
    {
      $sort: { '_id.month': 1 },
    },
    {
      $project: {
        _id: 0,
        month: '$_id.month',
        totalCommission: 1,
      },
    },
  ]);

  // Missing month gula 0 diye fill korbo
  const monthlyData = [];
  for (let m = 1; m <= 12; m++) {
    const monthData = result.find(r => r.month === m);
    monthlyData.push({
      month: m,
      totalCommission: monthData ? monthData.totalCommission : 0,
    });
  }

  return monthlyData;
};

const getBalanceTransactions = async () => {
  const result = await Payment.aggregate([
    {
      $addFields: {
        deliveryObjectId: { $toObjectId: '$deliveryId' },
      },
    },
    {
      $lookup: {
        from: 'deliveries',
        localField: 'deliveryObjectId',
        foreignField: '_id',
        as: 'delivery',
      },
    },
    {
      $unwind: '$delivery',
    },
    {
      $match: {
        'delivery.status': 'DELIVERED',
      },
    },
    {
      $project: {
        transactionId: 1,
        deliveryId: 1,
        userId: 1,
        amountPaid: 1,
        paidAt: 1,
        status: 1,
        refunded: 1,
        refundId: 1,
        commissionAmount: 1,
        riderAmount: 1,
        isTransferred: 1,
      },
    },
  ]);
  return result;
};

// const getUserOrderHistory = async (userId: string) => {
//   const result = await Order.find({ userId })
//     .populate({
//       path: 'deliveryId',
//       populate: {
//         path: 'order',
//         model: 'Order',
//       },
//     })
//     .sort({ createdAt: -1 });

//   if (!result || result.length === 0) {
//     throw new ApiError(
//       StatusCodes.NOT_FOUND,
//       'No order history found in database',
//     );
//   }

//   return result;
// };



const getUserOrderHistory = async (email: string) => {
  const user = await User.findOne({ email }).select('_id');
  if (!user) throw new Error('User not found');

  const history = await Order.aggregate([
    {
      $match: {
        user: user._id,
      },
    },
    {
      $lookup: {
        from: 'deliveries',
        localField: '_id',
        foreignField: 'order',
        as: 'delivery',
      },
    },
    {
      $unwind: {
        path: '$delivery',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: 'payments',
        localField: '_id',
        foreignField: 'deliveryId',
        as: 'payment',
      },
    },
    {
      $unwind: {
        path: '$payment',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $addFields: {
        status: {
          $switch: {
            branches: [
              {
                case: { $eq: ['$payment.refunded', true] },
                then: 'returned',
              },
              {
                case: { $eq: ['$delivery.status', 'DELIVERED'] },
                then: 'completed',
              },
              {
                case: {
                  $in: [
                    '$delivery.status',
                    ['ACCEPTED', 'ARRIVED_PICKED_UP', 'STARTED', 'ARRIVED_DESTINATION'],
                  ],
                },
                then: 'inprogress',
              },
            ],
            default: 'unknown',
          },
        },
      },
    },
    {
      $project: {
        orderId: 1,
        receiversName: 1,
        contact: 1,
        parcelType: 1,
        parcelValue: 1,
        parcelWeight: 1,
        ride: 1,
        distance: 1,
        deliveryCharge: 1,
        commissionAmount: 1,
        riderAmount: 1,
        pickupLocation: 1,
        destinationLocation: 1,
        status: 1,
        'payment.amountPaid': 1,
        'payment.status': 1,
        'payment.refunded': 1,
        'delivery.status': 1,
      },
    },
  ]);

  return history;
};

const getRiderOrderHistory = async (email: string) => {
  // Step 1: Find Rider ID from email
  const rider = await User.findOne({ email }).select('_id');

  if (!rider) {
    throw new Error('Rider not found');
  }

  const riderId = rider._id;

  // Step 2: Aggregation to get history
  const history = await Order.aggregate([
    {
      $lookup: {
        from: 'deliveries',
        localField: '_id',
        foreignField: 'order',
        as: 'delivery',
      },
    },
    {
      $unwind: {
        path: '$delivery',
        preserveNullAndEmptyArrays: false,
      },
    },
    {
      $match: {
        'delivery.rider': riderId,
      },
    },
    {
      $lookup: {
        from: 'payments',
        localField: 'delivery._id',
        foreignField: 'deliveryId',
        as: 'payment',
      },
    },
    {
      $unwind: {
        path: '$payment',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $addFields: {
        status: {
          $switch: {
            branches: [
              {
                case: { $eq: ['$payment.refunded', true] },
                then: 'returned',
              },
              {
                case: { $eq: ['$delivery.status', 'DELIVERED'] },
                then: 'completed',
              },
              {
                case: {
                  $in: [
                    '$delivery.status',
                    ['ACCEPTED', 'ARRIVED_PICKED_UP', 'STARTED', 'ARRIVED_DESTINATION'],
                  ],
                },
                then: 'inprogress',
              },
            ],
            default: 'unknown',
          },
        },
      },
    },
    {
      $project: {
        orderId: 1,
        receiversName: 1,
        contact: 1,
        parcelType: 1,
        parcelValue: 1,
        parcelWeight: 1,
        ride: 1,
        distance: 1,
        deliveryCharge: 1,
        commissionAmount: 1,
        riderAmount: 1,
        pickupLocation: 1,
        destinationLocation: 1,
        status: 1,
        'payment.amountPaid': 1,
        'payment.status': 1,
        'payment.refunded': 1,
        'delivery.status': 1,
      },
    },
  ]);

  return history;
};





export const ReportServices = {
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
  getRiderOrderHistory
};
