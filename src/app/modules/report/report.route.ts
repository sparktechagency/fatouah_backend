import express from 'express';
import { ReportControllers } from './report.controller';

const router = express.Router();

router.get('/user-report', ReportControllers.userReport);

router.get('/rider-report', ReportControllers.riderReport);

export const ReportRoutes = router;
