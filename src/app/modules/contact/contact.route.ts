import express from 'express';
import auth from '../../middlewares/auth';
import { USER_ROLES } from '../../../enums/user';
import { ContactControllers } from './contact.controller';

const router = express.Router();

router
  .route('/')
  .post(
    auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
    ContactControllers.createContact,
  );

export const ContactRoutes = router;
