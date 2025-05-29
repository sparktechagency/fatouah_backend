import express from 'express';
import auth from '../../middlewares/auth';
import { USER_ROLES } from '../../../enums/user';
import { OrderControllers } from './order.controller';

const router = express.Router();

router.post(
  '/',
  auth(
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.ADMIN,
    USER_ROLES.USER,
    USER_ROLES.RIDER,
  ),
  OrderControllers.createParcelOrder,
);

export const OrderRoutes = router;
