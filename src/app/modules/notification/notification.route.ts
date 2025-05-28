import express from 'express';
import { NotificationControllers } from './notification.controller';

const router = express.Router();

router.post("/send",NotificationControllers.sendNotificationController)

export const NotificationRoutes = router;
