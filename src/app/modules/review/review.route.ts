import express from 'express';
import { ReviewControllers } from './review.controller';
import auth from '../../middlewares/auth';
import { USER_ROLES } from '../../../enums/user';
import validateRequest from '../../middlewares/validateRequest';
import { ReviewValidation } from './review.validation';

const router = express.Router();

router.route("/").post(auth(USER_ROLES.SUPER_ADMIN,USER_ROLES.ADMIN,USER_ROLES.USER),validateRequest(ReviewValidation.createReviewZodSchema),ReviewControllers.createReview)

export const ReviewRoutes = router;
