import express from 'express';
import auth from '../../middlewares/auth';
import { USER_ROLES } from '../../../enums/user';
import { OrderControllers } from './order.controller';

const router = express.Router();

router.post('/', auth(USER_ROLES.USER), OrderControllers.createParcelOrder);

router.post('/create-checkout-session', auth(USER_ROLES.USER), OrderControllers.createStripeSessionOnly);

router.get('/success', OrderControllers.orderSuccess);

router.get("/success-order-details",OrderControllers.getOrderSuccessDetails)

router.get('/cancel', OrderControllers.orderCancel);

export const OrderRoutes = router;
