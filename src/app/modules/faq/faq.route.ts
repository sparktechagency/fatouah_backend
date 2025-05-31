import express from 'express';
import auth from '../../middlewares/auth';
import { USER_ROLES } from '../../../enums/user';
import { FaqControllers } from './faq.controller';
import validateRequest from '../../middlewares/validateRequest';
import { FaqValidation } from './faq.validation';

const router = express.Router();

router
  .route('/')
  .post(
    validateRequest(FaqValidation.createFaqZodSchema),
    auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
    FaqControllers.createFaq,
  )
  .get(FaqControllers.getFaqs);

router.delete(
  '/multiple-delete',
  auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  FaqControllers.deleteMultipleFaqs,
);

router
  .route('/:id')
  .patch(
    validateRequest(FaqValidation.updateFaqZodSchema),
    auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
    FaqControllers.updateFaq,
  )
  .delete(
    auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
    FaqControllers.deleteFaq,
  );

export const FaqRoutes = router;
