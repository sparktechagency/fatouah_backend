import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import { Payment } from '../payment/payment.model';
import { User } from '../user/user.model';
import { startOfDay, endOfDay, subDays } from 'date-fns';
import { Order } from '../order/order.model';
import { userSearchableFields } from './report.constant';
import mongoose from 'mongoose';
import { Delivery } from '../delivery/delivery.model';
const { startOfYear, endOfYear } = require('date-fns');


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
          {
            $match: {
              'delivery.status': {
                $in: [
                  'ACCEPTED',
                  'ARRIVED_PICKED_UP',
                  'STARTED',
                  'ARRIVED_DESTINATION',
                  'DELIVERED',
                ],
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
        email: 1,
        contact: 1,
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

  // manual filtering, searching, and pagination on the resulting array
  let filteredUsers = [...users];

  // search
  if (query.searchTerm) {
    const searchRegex = new RegExp(query.searchTerm, 'i');
    filteredUsers = filteredUsers.filter(user =>
      userSearchableFields.some(field =>
        user[field]?.toString().match(searchRegex),
      ),
    );
  }

  // basic filter (if you want to support any additional filters)
  const excludeFields = ['searchTerm', 'sort', 'limit', 'page', 'fields'];
  const filterQuery = { ...query };
  excludeFields.forEach(key => delete filterQuery[key]);

  for (const key in filterQuery) {
    filteredUsers = filteredUsers.filter(user => user[key] == filterQuery[key]);
  }

  // sort (optional)
  if (query.sort) {
    const sortField = query.sort.replace('-', '');
    const sortOrder = query.sort.startsWith('-') ? -1 : 1;
    filteredUsers.sort(
      (a, b) => (a[sortField] > b[sortField] ? 1 : -1) * sortOrder,
    );
  }

  // pagination
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const skip = (page - 1) * limit;
  const paginatedData = filteredUsers.slice(skip, skip + limit);

  const meta = {
    page,
    limit,
    total: filteredUsers.length,
    totalPage: Math.ceil(filteredUsers.length / limit),
  };

  return {
    data: paginatedData,
    meta,
  };
};

const riderReport = async (query: any) => {
  const riders = await User.aggregate([
    {
      $match: { role: 'RIDER' },
    },
    {
      $lookup: {
        from: 'payments',
        let: { riderIdObj: '$_id' },
        pipeline: [
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
          {
            $match: {
              $expr: {
                $eq: ['$delivery.rider', '$$riderIdObj'],
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
        email: 1,
        contact: 1,
        nid: 1,
        registrationNumber: 1,
        status: 1,
        joiningDate: '$createdAt',
        parcelDelivered: {
          $cond: {
            if: { $isArray: '$payments' },
            then: { $size: '$payments' },
            else: 0,
          },
        },
      },
    },
  ]);

  // manual search, filter, sort, and pagination
  let filteredRiders = [...riders];

  // search
  if (query.searchTerm) {
    const searchRegex = new RegExp(query.searchTerm, 'i');
    filteredRiders = filteredRiders.filter(rider =>
      userSearchableFields.some(field =>
        rider[field]?.toString().match(searchRegex),
      ),
    );
  }

  // basic filters (remove excluded query params first)
  const excludeFields = ['searchTerm', 'sort', 'limit', 'page', 'fields'];
  const filterQuery = { ...query };
  excludeFields.forEach(field => delete filterQuery[field]);

  for (const key in filterQuery) {
    filteredRiders = filteredRiders.filter(
      rider => rider[key]?.toString() === filterQuery[key],
    );
  }

  // sort
  if (query.sort) {
    const sortField = query.sort.replace('-', '');
    const sortOrder = query.sort.startsWith('-') ? -1 : 1;
    filteredRiders.sort(
      (a, b) => (a[sortField] > b[sortField] ? 1 : -1) * sortOrder,
    );
  }

  // pagination
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const skip = (page - 1) * limit;

  const paginatedData = filteredRiders.slice(skip, skip + limit);
  const total = filteredRiders.length;
  const totalPage = Math.ceil(total / limit);

  const meta = {
    page,
    limit,
    total,
    totalPage,
  };

  return {
    data: paginatedData,
    meta,
  };
};

const parcelReport = async (query: any) => {
  const parcel = await Payment.aggregate([
    { $addFields: { deliveryId: { $toObjectId: '$deliveryId' } } },
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
        'delivery.status': {
          $in: [
            'ACCEPTED',
            'ARRIVED_PICKED_UP',
            'STARTED',
            'ARRIVED_DESTINATION',
            'DELIVERED',
          ],
        },
      },
    },
    {
      $addFields: {
        orderId: { $toObjectId: '$delivery.order' },
        riderId: { $toObjectId: '$delivery.rider' },
      },
    },
    {
      $lookup: {
        from: 'orders',
        localField: 'orderId',
        foreignField: '_id',
        as: 'order',
      },
    },
    { $unwind: '$order' },
    {
      $addFields: {
        senderId: { $toObjectId: '$order.user' },
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'senderId',
        foreignField: '_id',
        as: 'sender',
      },
    },
    { $unwind: '$sender' },
    {
      $lookup: {
        from: 'users',
        localField: 'riderId',
        foreignField: '_id',
        as: 'rider',
      },
    },
    { $unwind: '$rider' },
    {
      $project: {
        _id: 0,
        orderId: { $toString: '$orderId' },
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

  // === manual filtering, searching, pagination ===

  let filteredParcels = [...parcel];

  // search (case-insensitive)
  if (query.searchTerm) {
    const searchRegex = new RegExp(query.searchTerm, 'i');
    filteredParcels = filteredParcels.filter(item =>
      ['orderId', 'senderName', 'receiverName', 'riderName'].some(field =>
        item[field]?.toString().match(searchRegex),
      ),
    );
  }

  // basic filters (excluding some meta fields)
  const excludeFields = ['searchTerm', 'sort', 'limit', 'page', 'fields'];
  const filterQuery = { ...query };
  excludeFields.forEach(key => delete filterQuery[key]);

  for (const key in filterQuery) {
    filteredParcels = filteredParcels.filter(
      item => item[key]?.toString() === filterQuery[key],
    );
  }

  // sorting
  if (query.sort) {
    const sortField = query.sort.replace('-', '');
    const sortOrder = query.sort.startsWith('-') ? -1 : 1;
    filteredParcels.sort(
      (a, b) => (a[sortField] > b[sortField] ? 1 : -1) * sortOrder,
    );
  }

  // pagination
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const skip = (page - 1) * limit;

  const paginatedData = filteredParcels.slice(skip, skip + limit);
  const total = filteredParcels.length;
  const totalPage = Math.ceil(total / limit);

  const meta = {
    page,
    limit,
    total,
    totalPage,
  };

  return {
    data: paginatedData,
    meta,
  };
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

  // fill missing months with zero count
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

  // missing month gula 0 diye fill korbo
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

const getBalanceTransactions = async (query: any) => {
  const {
    page = 1,
    limit = 10,
    searchTerm = '',
    status,
    isTransferred,
    refunded,
  } = query;

  const currentPage = parseInt(page);
  const perPage = parseInt(limit);
  const skip = (currentPage - 1) * perPage;

  const matchStage: any = {
    'delivery.status': 'DELIVERED',
  };

  if (status) matchStage.status = status;
  if (isTransferred !== undefined)
    matchStage.isTransferred = isTransferred === 'true';
  if (refunded !== undefined) matchStage.refunded = refunded === 'true';

  const searchStage =
    searchTerm?.trim() !== ''
      ? {
          $or: [{ transactionId: { $regex: searchTerm, $options: 'i' } }],
        }
      : {};

  const pipeline = [
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
    { $match: { ...matchStage, ...searchStage } },
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
  ];

  const data = await Payment.aggregate([
    ...pipeline,
    { $sort: { paidAt: -1 } },
    { $skip: skip },
    { $limit: perPage },
  ]);

  const countResult = await Payment.aggregate([
    ...pipeline,
    { $count: 'total' },
  ]);

  const total = countResult[0]?.total || 0;

  return {
    meta: {
      page: currentPage,
      limit: perPage,
      total,
    },
    data,
  };
};

const getUserOrderHistory = async (email: string, query: any) => {
  // get user ID by email
  const user = await User.findOne({ email }).select('_id');
  if (!user) throw new Error('User not found');
  const userId = user._id;

  // aggregation pipeline
  const history = await Order.aggregate([
    { $match: { user: userId } },
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
              $expr: { $eq: ['$deliveryId', '$$deliveryIdStr'] },
            },
          },
        ],
        as: 'payment',
      },
    },
    { $unwind: { path: '$payment', preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: 'users',
        localField: 'delivery.rider',
        foreignField: '_id',
        as: 'riderInfo',
      },
    },
    { $unwind: { path: '$riderInfo', preserveNullAndEmptyArrays: true } },

    // rider rating
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
    { $unwind: { path: '$riderRating', preserveNullAndEmptyArrays: true } },

    // completed trips count
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
          { $count: 'count' },
        ],
        as: 'completedTrips',
      },
    },
    {
      $addFields: {
        'rider.trips': {
          $ifNull: [{ $arrayElemAt: ['$completedTrips.count', 0] }, 0],
        },
      },
    },

    // status logic
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

    { $sort: { 'delivery.timestamps.createdAt': -1 } },

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
        createdAt: {
          $ifNull: ['$delivery.timestamps.createdAt', '$createdAt'],
        },
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
        },
        rider: {
          name: '$riderInfo.name',
          email: '$riderInfo.email',
          phone: '$riderInfo.phone',
          image: '$riderInfo.image',
          rating: {
            average: { $round: ['$riderRating.averageRating', 1] },
            total: '$riderRating.totalReviews',
          },
          trips: 1,
        },
      },
    },
  ]);

  // === manual search, filter, paginate ===

  let filtered = [...history];

  // search on specific fields (case-insensitive)
  if (query.searchTerm) {
    const searchRegex = new RegExp(query.searchTerm, 'i');
    filtered = filtered.filter(item =>
      [
        'receiversName',
        'contact',
        'pickupAddress',
        'destinationAddress',
        'orderId',
      ].some(field => item[field]?.toString().match(searchRegex)),
    );
  }

  // filter by other fields (except meta)
  const excludeFields = ['searchTerm', 'sort', 'limit', 'page', 'fields'];

  const filterQuery = { ...query };
  excludeFields.forEach(key => delete filterQuery[key]);



  for (const key in filterQuery) {
    const value = filterQuery[key];

    // skip if value is empty string, null or undefined
    if (typeof value === 'string' && value.trim() === '') continue;
    if (value === null || value === undefined) continue;

    filtered = filtered.filter(item => item[key]?.toString() === value);
  }

  // sorting
  if (query.sort) {
    const sortField = query.sort.replace('-', '');
    const sortOrder = query.sort.startsWith('-') ? -1 : 1;
    filtered.sort((a, b) => (a[sortField] > b[sortField] ? 1 : -1) * sortOrder);
  }

  // pagination
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const skip = (page - 1) * limit;
  const paginated = filtered.slice(skip, skip + limit);

  const meta = {
    page,
    limit,
    total: filtered.length,
    totalPage: Math.ceil(filtered.length / limit),
  };

  return {
    data: paginated,
    meta,
  };
};

const getRiderOrderHistory = async (email: string, query: any) => {
  // find Rider ID from email
  const rider = await User.findOne({ email }).select('_id');
  if (!rider) throw new Error('Rider not found');
  const riderId = rider._id;

  // aggregation to get history
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
    { $sort: { 'delivery.timestamps.createdAt': -1 } },
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
        createdAt: {
          $ifNull: ['$delivery.timestamps.createdAt', '$createdAt'],
        },
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
        },
      },
    },
  ]);

  // manual search, filter, sort, paginate on array 'history'
  let filtered = [...history];

  // search on specific fields (case-insensitive)
  if (query.searchTerm) {
    const searchRegex = new RegExp(query.searchTerm, 'i');
    filtered = filtered.filter(item =>
      [
        'receiversName',
        'contact',
        'pickupAddress',
        'destinationAddress',
        'orderId',
      ].some(field => item[field]?.toString().match(searchRegex)),
    );
  }

  // filter out reserved query keys
  const excludeFields = ['searchTerm', 'sort', 'limit', 'page', 'fields'];
  const filterQuery = { ...query };
  excludeFields.forEach(key => delete filterQuery[key]);


  for (const key in filterQuery) {
    const value = filterQuery[key];

    // skip if value is empty string, null or undefined
    if (typeof value === 'string' && value.trim() === '') continue;
    if (value === null || value === undefined) continue;

    filtered = filtered.filter(item => item[key]?.toString() === value);
  }

  // sorting
  if (query.sort) {
    const sortField = query.sort.replace('-', '');
    const sortOrder = query.sort.startsWith('-') ? -1 : 1;
    filtered.sort((a, b) => (a[sortField] > b[sortField] ? 1 : -1) * sortOrder);
  }

  // pagination
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const skip = (page - 1) * limit;
  const paginated = filtered.slice(skip, skip + limit);

  const meta = {
    page,
    limit,
    total: filtered.length,
    totalPage: Math.ceil(filtered.length / limit),
  };

  return {
    data: paginated,
    meta,
  };
};

const getUserOrderDetailsById = async (orderId: string, email: string) => {
 
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

    // review
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
          { $count: 'count' },
        ],
        as: 'completedTrips',
      },
    },
    {
      $addFields: {
        'rider.trips': {
          $ifNull: [{ $arrayElemAt: ['$completedTrips.count', 0] }, 0],
        },
      },
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
        createdAt: {
          $ifNull: ['$delivery.timestamps.createdAt', '$createdAt'],
        },
        payment: {
          amountPaid: '$payment.amountPaid',
          status: '$payment.status',
          refunded: '$payment.refunded',
        },
        deliveryInfo: {
          status: '$delivery.status',
          timestamps: '$delivery.timestamps',
        },
        rider: {
          name: '$riderInfo.name',
          email: '$riderInfo.email',
          phone: '$riderInfo.phone',
          image: '$riderInfo.image',
          rating: {
            average: { $round: ['$riderRating.averageRating', 1] },
            total: '$riderRating.totalReviews',
          },
          trips: 1,
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
  // find Rider ID from email
  const rider = await User.findOne({ email }).select('_id');
  if (!rider) throw new Error('Rider not found');

  const riderId = rider._id;
  const orderObjectId = new mongoose.Types.ObjectId(orderId);

  // aggregation pipeline
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
      $match: { 'delivery.rider': riderId }, 
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
        createdAt: {
          $ifNull: ['$delivery.timestamps.createdAt', '$createdAt'],
        },
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

  // date range for aggregation (in UTC)
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
 
  const rider = await User.findOne({ email });
  if (!rider) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Rider not found');
  }

  const riderId = new mongoose.Types.ObjectId(rider._id);

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

const getRiderTrips = async (riderId: string) => {
  if (!mongoose.Types.ObjectId.isValid(riderId)) {
    throw new Error('Invalid rider ID');
  }

  const result = await Delivery.aggregate([
    {
      $match: {
        rider: new mongoose.Types.ObjectId(riderId),
        status: 'DELIVERED',
      },
    },
    {
      $count: 'totalTrips',
    },
  ]);

  return {
    riderId,
    trips: result[0]?.totalTrips || 0,
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
  getRiderTrips,
};
