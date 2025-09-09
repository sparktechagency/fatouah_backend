import express from 'express';
import auth from '../../middlewares/auth';
import { USER_ROLES } from '../../../enums/user';
import { OrderControllers } from './order.controller';
import fileUploadHandler from '../../middlewares/fileUploadHandler';
import parseFileData from '../../middlewares/parseFileData';
import { FOLDER_NAMES } from '../../../enums/files';
import validateRequest from '../../middlewares/validateRequest';
import { OrderValidation } from './order.validation';

const router = express.Router();

// router.post('/', auth(USER_ROLES.USER), OrderControllers.createParcelOrder);

// router.post(
//   '/create-checkout-session',
//   auth(USER_ROLES.USER),
//   OrderControllers.createStripeSessionOnly,
// );

router.post(
  '/',
  auth(USER_ROLES.USER),
  fileUploadHandler(),
  parseFileData("image"),
  validateRequest(OrderValidation.createOrderZodSchema),
  OrderControllers.createStripeSessionOnly,
);

router.get('/success', OrderControllers.orderSuccess);

router.get('/success-order-details', OrderControllers.getOrderSuccessDetails);

router.get("/:orderId", OrderControllers.getOrderDetailsByOrderId)

router.get('/cancel', OrderControllers.orderCancel);

export const OrderRoutes = router;
