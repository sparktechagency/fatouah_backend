import express from 'express';
import { getStripeLoginLink } from './payment.controller';
import auth from '../../middlewares/auth';
import { USER_ROLES } from '../../../enums/user';

const router = express.Router();

router.get(
  '/rider/stripe-login-link',
  auth(USER_ROLES.RIDER),
  getStripeLoginLink,
);

export const PaymentRoutes = router;
