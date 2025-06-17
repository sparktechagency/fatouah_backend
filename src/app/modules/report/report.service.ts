import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import { Payment } from '../payment/payment.model';
import { User } from '../user/user.model';
import { startOfDay, endOfDay, subDays } from 'date-fns';
import { Order } from '../order/order.model';
import QueryBuilder from '../../builder/QueryBuilder';
import { riderSearchableFields, userSearchableFields } from './report.constant';
import mongoose from 'mongoose';
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

  const riderQuery = new QueryBuilder(riders, query)
    .search(riderSearchableFields)
    .filter()
    .paginate();

  const result = riderQuery.modelQuery;
  const meta = await riderQuery.getPaginationInfo();
  return {
    data: result,
    meta,
  };
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

const getUserOrderHistory = async (email: string, query: any) => {
  // 1. User ber koro email diye
  const user = await User.findOne({ email }).select('_id');
  if (!user) throw new Error('User not found');

  const userId = user._id;

  // 2. Aggregation Pipeline
  const history = await Order.aggregate([
    {
      $match: { user: userId },
    },
    {
      $lookup: {
        from: 'deliveries',
        localField: '_id',
        foreignField: 'order',
        as: 'delivery',
      },
    },
    { $unwind: { path: '$delivery', preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: 'payments',
        let: { deliveryIdStr: { $toString: '$delivery._id' } },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ['$deliveryId', '$$deliveryIdStr'],
              },
            },
          },
        ],
        as: 'payment',
      },
    },
    { $unwind: { path: '$payment', preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: 'users', // Rider info from users collection
        localField: 'delivery.rider',
        foreignField: '_id',
        as: 'riderInfo',
      },
    },
    { $unwind: { path: '$riderInfo', preserveNullAndEmptyArrays: true } },

    // ⭐️ Rider Rating
    {
      $lookup: {
        from: 'reviews',
        let: { riderId: '$delivery.rider' },
        pipeline: [
          { $match: { $expr: { $eq: ['$rider', '$$riderId'] } } },
          {
            $group: {
              _id: null,
              averageRating: { $avg: '$rating' },
              totalReviews: { $sum: 1 },
            },
          },
        ],
        as: 'riderRating',
      },
    },
    {
      $unwind: {
        path: '$riderRating',
        preserveNullAndEmptyArrays: true,
      },
    },

    // Status
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
                    [
                      'ACCEPTED',
                      'ARRIVED_PICKED_UP',
                      'STARTED',
                      'ARRIVED_DESTINATION',
                    ],
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
    // sort
    {
      $sort: { 'delivery.timestamps.createdAt': -1 },
    },

    // Final Projection
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
        createdAt: { $ifNull: ['$delivery.timestamps.createdAt', '$createdAt'] },
        pickupAddress: '$pickupLocation.address',
        destinationAddress: '$destinationLocation.address',
        payment: {
          amountPaid: '$payment.amountPaid',
          status: '$payment.status',
          refunded: '$payment.refunded',
        },

        deliveryInfo: {
          status: '$delivery.status',
          timestamps: '$delivery.timestamps',
          // attempts: '$delivery.attempts',
        },

        rider: {
          name: '$riderInfo.name',
          email: '$riderInfo.email',
          phone: '$riderInfo.phone',
          image: "$riderInfo.image",
          rating: {
            average: { $round: ['$riderRating.averageRating', 1] },
            total: '$riderRating.totalReviews',
          },
        },
      },
    },
  ]);

  const userOrderHistoryQuery = new QueryBuilder(history, query)
    .search([
      'receiversName',
      'contact',
      'pickupAddress',
      'destinationAddress',
      'orderId',
    ])
    .filter();

  const result = userOrderHistoryQuery.modelQuery;
  const meta = await userOrderHistoryQuery.getPaginationInfo();

  return {
    data: result,
    meta,
  };
};

const getRiderOrderHistory = async (email: string, query: any) => {
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
        let: { deliveryIdStr: { $toString: '$delivery._id' } },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ['$deliveryId', '$$deliveryIdStr'],
              },
            },
          },
        ],
        as: 'payment',
      },
    },
    { $unwind: { path: '$payment', preserveNullAndEmptyArrays: true } },
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
                    [
                      'ACCEPTED',
                      'ARRIVED_PICKED_UP',
                      'STARTED',
                      'ARRIVED_DESTINATION',
                    ],
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
      $sort: { 'delivery.timestamps.createdAt': -1 },
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
        createdAt: { $ifNull: ['$delivery.timestamps.createdAt', '$createdAt'] },
        pickupAddress: '$pickupLocation.address',
        destinationAddress: '$destinationLocation.address',
        status: 1,
        payment: {
          amountPaid: '$payment.amountPaid',
          status: '$payment.status',
          refunded: '$payment.refunded',
        },
        deliveryInfo: {
          status: '$delivery.status',
          timestamps: '$delivery.timestamps',
          // attempts: '$delivery.attempts',
        },
      },
    },
  ]);

  const riderOrderHistoryQuery = new QueryBuilder(history, query)
    .search(['receiversName', 'contact', 'pickupAddress', 'destinationAddress'])
    .filter();

  const result = riderOrderHistoryQuery.modelQuery;
  const meta = await riderOrderHistoryQuery.getPaginationInfo();

  return {
    data: result,
    meta,
  };
};

const getUserOrderDetailsById = async (orderId: string, email: string) => {
  // 1. Prothome user er id ber koren email diye
  const user = await User.findOne({ email: email }, { _id: 1 });
  if (!user) throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');

  const orderObjectId = new mongoose.Types.ObjectId(orderId);

  const orderDetails = await Order.aggregate([
    {
      $match: { _id: orderObjectId, user: user._id },
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
      $unwind: { path: '$delivery', preserveNullAndEmptyArrays: true },
    },
    {
      $lookup: {
        from: 'payments',
        let: { deliveryIdStr: { $toString: '$delivery._id' } },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ['$deliveryId', '$$deliveryIdStr'] },
            },
          },
        ],
        as: 'payment',
      },
    },
    {
      $unwind: { path: '$payment', preserveNullAndEmptyArrays: true },
    },
    {
      $lookup: {
        from: 'users', // Rider info
        localField: 'delivery.rider',
        foreignField: '_id',
        as: 'riderInfo',
      },
    },
    {
      $unwind: { path: '$riderInfo', preserveNullAndEmptyArrays: true },
    },
    {
      $lookup: {
        from: 'reviews',
        let: { riderId: '$delivery.rider' },
        pipeline: [
          { $match: { $expr: { $eq: ['$rider', '$$riderId'] } } },
          {
            $group: {
              _id: null,
              averageRating: { $avg: '$rating' },
              totalReviews: { $sum: 1 },
            },
          },
        ],
        as: 'riderRating',
      },
    },
    {
      $unwind: { path: '$riderRating', preserveNullAndEmptyArrays: true },
    },
    {
      $addFields: {
        status: {
          $switch: {
            branches: [
              { case: { $eq: ['$payment.refunded', true] }, then: 'returned' },
              {
                case: { $eq: ['$delivery.status', 'DELIVERED'] },
                then: 'completed',
              },
              {
                case: {
                  $in: [
                    '$delivery.status',
                    [
                      'ACCEPTED',
                      'ARRIVED_PICKED_UP',
                      'STARTED',
                      'ARRIVED_DESTINATION',
                    ],
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
        createdAt: { $ifNull: ['$delivery.timestamps.createdAt', '$createdAt'] },
        payment: {
          amountPaid: '$payment.amountPaid',
          status: '$payment.status',
          refunded: '$payment.refunded',
        },
        deliveryInfo: {
          status: '$delivery.status',
          timestamps: '$delivery.timestamps',
          // attempts: '$delivery.attempts',
        },
        rider: {
          name: '$riderInfo.name',
          email: '$riderInfo.email',
          phone: '$riderInfo.phone',
          image: "$riderInfo.image",
          rating: {
            average: { $round: ['$riderRating.averageRating', 1] },
            total: '$riderRating.totalReviews',
          },
        },
      },
    },
  ]);

  if (!orderDetails.length) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Order not found');
  }

  return orderDetails[0];
};

const getRiderOrderDetailsById = async (orderId: string, email: string) => {
  // Step 1: Find Rider ID from email
  const rider = await User.findOne({ email }).select('_id');
  if (!rider) throw new Error('Rider not found');

  const riderId = rider._id;
  const orderObjectId = new mongoose.Types.ObjectId(orderId);

  // Step 2: Aggregation pipeline
  const orderDetails = await Order.aggregate([
    {
      $match: { _id: orderObjectId },
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
      $unwind: { path: '$delivery', preserveNullAndEmptyArrays: false },
    },
    {
      $match: { 'delivery.rider': riderId }, // Check order belongs to rider
    },
    {
      $lookup: {
        from: 'payments',
        let: { deliveryIdStr: { $toString: '$delivery._id' } },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ['$deliveryId', '$$deliveryIdStr'] },
            },
          },
        ],
        as: 'payment',
      },
    },
    { $unwind: { path: '$payment', preserveNullAndEmptyArrays: true } },
    {
      $addFields: {
        status: {
          $switch: {
            branches: [
              { case: { $eq: ['$payment.refunded', true] }, then: 'returned' },
              {
                case: { $eq: ['$delivery.status', 'DELIVERED'] },
                then: 'completed',
              },
              {
                case: {
                  $in: [
                    '$delivery.status',
                    [
                      'ACCEPTED',
                      'ARRIVED_PICKED_UP',
                      'STARTED',
                      'ARRIVED_DESTINATION',
                    ],
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
        createdAt: { $ifNull: ['$delivery.timestamps.createdAt', '$createdAt'] },
        payment: {
          amountPaid: '$payment.amountPaid',
          status: '$payment.status',
          refunded: '$payment.refunded',
        },
        deliveryInfo: {
          status: '$delivery.status',
          timestamps: '$delivery.timestamps',
          attempts: '$delivery.attempts',
        },
      },
    },
  ]);

  if (orderDetails.length === 0) {
    throw new Error('Order not found for this rider');
  }

  return orderDetails[0];
};

const getRiderWeeklyEarnings = async (email: string) => {
  const rider = await User.findOne({ email });
  if (!rider) {
    throw new Error('Rider not found');
  }

  const riderId = new mongoose.Types.ObjectId(rider._id);

  // Date range for aggregation (in UTC)
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setHours(0, 0, 0, 0);
  sevenDaysAgo.setDate(today.getDate() - 6);

  const earnings = await Payment.aggregate([
    {
      $match: {
        paidAt: { $gte: sevenDaysAgo, $lte: today },
      },
    },
    {
      $lookup: {
        from: 'deliveries',
        localField: 'deliveryId',
        foreignField: '_id',
        as: 'delivery',
      },
    },
    { $unwind: '$delivery' },
    {
      $match: {
        'delivery.rider': riderId,
        'delivery.status': 'DELIVERED',
      },
    },
    {
      $project: {
        riderAmount: 1,
        day: { $dateToString: { format: '%Y-%m-%d', date: '$paidAt' } },
      },
    },
    {
      $group: {
        _id: '$day',
        total: { $sum: '$riderAmount' },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  if (earnings.length === 0) {
    const result = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(sevenDaysAgo);
      d.setDate(sevenDaysAgo.getDate() + i);
      result.push({
        day: d.toLocaleDateString('en-US', {
          weekday: 'short',
          timeZone: 'Asia/Dhaka',
        }),
        amount: 0,
      });
    }
    return result;
  }

  const maxDateStr = earnings[earnings.length - 1]._id; // e.g. "2025-06-11"
  const maxDate = new Date(maxDateStr + 'T23:59:59.999Z');

  const startDate = new Date(maxDate);
  startDate.setDate(maxDate.getDate() - 6);

  const result = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);

    // convert date d to 'YYYY-MM-DD' in Asia/Dhaka timezone for matching
    const dhakaDateStr = d.toLocaleDateString('en-CA', {
      timeZone: 'Asia/Dhaka',
    }); // 'YYYY-MM-DD' format

    const found = earnings.find(e => e._id === dhakaDateStr);

    result.push({
      day: d.toLocaleDateString('en-US', {
        weekday: 'short',
        timeZone: 'Asia/Dhaka',
      }),
      amount: found ? found.total : 0,
    });
  }

  return result;
};

const getRiderTransactionHistory = async (email: string) => {
  // 1. Prothome rider er user record ta ber koro email diye
  const rider = await User.findOne({ email });
  if (!rider) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Rider not found');
  }

  const riderId = new mongoose.Types.ObjectId(rider._id);

  // 2. Tarpor Payment collection theke rider er delivery id gulo theke transaction gula ber koro
  // eikhane dhore nichi je rider er ID delivery document e 'rider' field e ache
  const transactions = await Payment.aggregate([
    {
      $lookup: {
        from: 'deliveries',
        localField: 'deliveryId',
        foreignField: '_id',
        as: 'delivery',
      },
    },
    { $unwind: '$delivery' },
    {
      $match: {
        'delivery.rider': riderId,
      },
    },
    {
      $project: {
        transactionId: 1,

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
    { $sort: { paidAt: -1 } }, // newest first
  ]);

  return transactions;
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
  getRiderOrderHistory,
  getUserOrderDetailsById,
  getRiderOrderDetailsById,
  getRiderWeeklyEarnings,
  getRiderTransactionHistory,
};
