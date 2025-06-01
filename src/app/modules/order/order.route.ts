import express from 'express';
import auth from '../../middlewares/auth';
import { USER_ROLES } from '../../../enums/user';
import { OrderControllers } from './order.controller';

const router = express.Router();

router.post('/', auth(USER_ROLES.USER), OrderControllers.createParcelOrder);

export const OrderRoutes = router;
