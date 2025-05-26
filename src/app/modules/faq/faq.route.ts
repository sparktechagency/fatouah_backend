import express, { json } from 'express';
import auth from '../../middlewares/auth';
import { USER_ROLES } from '../../../enums/user';
import { FaqControllers } from './faq.controller';

const router = express.Router();

router
  .route('/')
  .post(
    auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
    FaqControllers.createFaq
  )
  .get(FaqControllers.getFaqs);

router
  .route('/:id')
  .patch(
    auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
    FaqControllers.updateFaq
  )
  .delete(
    auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
    FaqControllers.deleteFaq
  );

export const FaqRoutes = router;
