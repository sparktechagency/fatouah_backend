import express from 'express';
import { ReviewControllers } from './review.controller';
import auth from '../../middlewares/auth';
import { USER_ROLES } from '../../../enums/user';

const router = express.Router();

router.route('/:id').get(ReviewControllers.getRiderReviews);

router.post(
  '/rider-to-customer/:orderId',
  auth(USER_ROLES.RIDER),
  ReviewControllers.createRiderReviewToCustomer,
);

router.post(
  '/customer-to-rider/:orderId',
  auth(USER_ROLES.USER),
  ReviewControllers.createCustomerReviewToRider,
);


export const ReviewRoutes = router;
