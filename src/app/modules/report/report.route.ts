import express from 'express';
import { ReportControllers } from './report.controller';

const router = express.Router();

router.get('/user-report', ReportControllers.userReport);

router.get('/rider-report', ReportControllers.riderReport);

router.get("/parcel-report", ReportControllers.parcelReport)

router.get("/total-delivery-report", ReportControllers.totalDeliveryReport)

router.get("/total-user", ReportControllers.totalUsers);

router.get("/total-rider", ReportControllers.totalRiders);
router.get("/total-vehicle", ReportControllers.totalBikeAndCars);



export const ReportRoutes = router;
