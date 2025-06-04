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

router.get('/balance-transaction',auth(USER_ROLES.SUPER_ADMIN,USER_ROLES.ADMIN), ReportControllers.getBalanceTransactions);

router.get(
  '/order-history',
  auth(USER_ROLES.USER, USER_ROLES.RIDER),
  ReportControllers.getUserOrderHistory,
);

export const ReportRoutes = router;
