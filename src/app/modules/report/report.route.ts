import express from 'express';
import { ReportControllers } from './report.controller';
import auth from '../../middlewares/auth';
import { USER_ROLES } from '../../../enums/user';

const router = express.Router();

router.get(
  '/user-report',
  auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  ReportControllers.userReport,
);

router.get(
  '/rider-report',
  auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  ReportControllers.riderReport,
);

router.get(
  '/parcel-report',
  auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  ReportControllers.parcelReport,
);

router.get(
  '/total-delivery-report',
  auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  ReportControllers.totalDeliveryReport,
);

router.get(
  '/total-user',
  auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  ReportControllers.totalUsers,
);

router.get(
  '/total-rider',
  auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  ReportControllers.totalRiders,
);

router.get(
  '/total-vehicle',
  auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  ReportControllers.totalBikeAndCars,
);

router.get(
  '/total-admin-earning',
  auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  ReportControllers.totalAdminEarnings,
);

router.get(
  '/total-monthly-delivery-report',
  auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  ReportControllers.totalMonthlyDeliveryReport,
);

router.get(
  '/revenue-analytics-report',
  auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  ReportControllers.revenueAnalyticsReport,
);

router.get(
  '/balance-transaction',
  auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  ReportControllers.getBalanceTransactions,
);

// router.get(
//   '/order-history',
//   auth(USER_ROLES.USER),
//   ReportControllers.getUserOrderHistory,
// );

router.get(
  '/user-order-history',
  auth(USER_ROLES.USER),
  ReportControllers.getUserOrderHistory,
);

router.get(
  '/rider-order-history',
  auth(USER_ROLES.RIDER),
  ReportControllers.getRiderOrderHistory,
);

router.get(
  '/user-order-history/:orderId',
  auth(USER_ROLES.USER),
  ReportControllers.getUserOrderDetailsById,
);

router.get(
  '/rider-order-history/:orderId',
  auth(USER_ROLES.RIDER),
  ReportControllers.getRiderOrderDetailsById,
);

router.get(
  '/earning',
  auth(USER_ROLES.RIDER),
  ReportControllers.getRiderWeeklyEarnings,
);

router.get(
  '/rider/transaction',
  auth(USER_ROLES.RIDER),
  ReportControllers.getRiderTransactionHistory,
);

router.get(
  '/rider/:riderId/trips',
  ReportControllers.getRiderTrips,
);

export const ReportRoutes = router;
