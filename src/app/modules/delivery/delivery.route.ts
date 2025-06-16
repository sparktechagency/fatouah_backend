import express from 'express';
import { DeliveryControllers } from './delivery.controller';
import auth from '../../middlewares/auth';
import { USER_ROLES } from '../../../enums/user';

const router = express.Router();

// this is just test route, i will delete this letter
router.post('/nearest-riders', DeliveryControllers.findNearestOnlineRiders);

router.post('/:deliveryId/assign', DeliveryControllers.assignRiderWithTimeout);

router.post(
  '/:deliveryId/cancel',
  auth(USER_ROLES.USER),
  DeliveryControllers.cancelDeliveryByUser,
);

// router.patch(
//   '/update-location',
//   auth(USER_ROLES.RIDER),
//   DeliveryControllers.updateRiderLocation,
// );

router.patch(
  '/:deliveryId/accept',
  auth(USER_ROLES.RIDER),
  DeliveryControllers.acceptDeliveryByRider,
);

router.post(
  '/:deliveryId/reject',
  auth(USER_ROLES.RIDER),
  DeliveryControllers.rejectDeliveryByRider,
);

router.post(
  '/:deliveryId/arrived-picked-up',
  auth(USER_ROLES.RIDER),
  DeliveryControllers.markDeliveryArrivedPickedUp,
);

router.post(
  '/:deliveryId/started',
  auth(USER_ROLES.RIDER),
  DeliveryControllers.markDeliveryStarted,
);

router.post(
  '/:deliveryId/arrived-destination',
  auth(USER_ROLES.RIDER),
  DeliveryControllers.markDeliveryArrivedDestination,
);

router.post(
  '/:deliveryId/completed',
  auth(USER_ROLES.RIDER),
  DeliveryControllers.markDeliveryCompleted,
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

export const DeliveryRoutes = router;
