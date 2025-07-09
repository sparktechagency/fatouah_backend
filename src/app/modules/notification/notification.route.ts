import express from 'express';
import auth from '../../middlewares/auth';
import { USER_ROLES } from '../../../enums/user';
import { NotificationControllers } from './notification.controller';

const router = express.Router();

router
  .route('/')
  .get(
    auth(USER_ROLES.USER, USER_ROLES.RIDER),
    NotificationControllers.getNotificationFromDB,
  )
  .patch(
    auth(USER_ROLES.USER, USER_ROLES.RIDER),
    NotificationControllers.readNotification,
  );

router
  .route('/admin')
  .get(
    auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
    NotificationControllers.adminNotificationFromDB,
  )
  .patch(
    auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
    NotificationControllers.adminReadNotification,
  );

router.patch(
  '/admin/:id',
  auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  NotificationControllers.adminReadNotificationById,
);

export const NotificationRoutes = router;
