import express from 'express';
import { PushNotificationControllers } from './pushNotification.controller';

const router = express.Router();

router.post('/send', PushNotificationControllers.sendPushNotificationController);

export const  PushNotificationRoutes = router;
