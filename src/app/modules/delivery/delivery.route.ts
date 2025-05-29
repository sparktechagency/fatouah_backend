import express from 'express';
import { DeliveryControllers } from './delivery.controller';
import auth from '../../middlewares/auth';
import { USER_ROLES } from '../../../enums/user';

const router = express.Router();

router.post('/nearest-riders', DeliveryControllers.findNearestOnlineRiders);

router.post(
  '/:deliveryId/assign',
  DeliveryControllers.assignRiderWithTimeout,
);

router.patch(
  '/:deliveryId/reject',
  auth(USER_ROLES.RIDER),
  DeliveryControllers.rejectDeliveryByRider,
);

router.patch(
  '/:deliveryId/cancel',
  auth(USER_ROLES.USER),
  DeliveryControllers.cancelDeliveryByUser,
);

router.get(
  '/:id',
  auth(
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.ADMIN,
    USER_ROLES.RIDER,
    USER_ROLES.USER,
  ),
  DeliveryControllers.getDeliveryDetails,
);

router.patch(
  '/:deliveryId/accept',
  auth(USER_ROLES.RIDER),
  DeliveryControllers.acceptDeliveryByRider,
);

router.patch(
  '/:deliveryId/location',
  auth(USER_ROLES.RIDER),
  DeliveryControllers.updateRiderLocation,
);

export const DeliveryRoutes = router;
