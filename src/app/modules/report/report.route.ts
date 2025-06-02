import express from 'express';
import { ReportControllers } from './report.controller';
import auth from '../../middlewares/auth';
import { USER_ROLES } from '../../../enums/user';

const router = express.Router();

router.get('/user-report', ReportControllers.userReport);

router.get('/rider-report', ReportControllers.riderReport);

router.get('/parcel-report', ReportControllers.parcelReport);

router.get('/total-delivery-report', ReportControllers.totalDeliveryReport);

router.get('/total-user', ReportControllers.totalUsers);

router.get('/total-rider', ReportControllers.totalRiders);

router.get('/total-vehicle', ReportControllers.totalBikeAndCars);

router.get("/order-history", auth(USER_ROLES.USER, USER_ROLES.RIDER), ReportControllers.getUserOrderHistory)

export const ReportRoutes = router;
