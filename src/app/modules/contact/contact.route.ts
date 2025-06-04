import express from 'express';
import auth from '../../middlewares/auth';
import { USER_ROLES } from '../../../enums/user';
import { ContactControllers } from './contact.controller';
import validateRequest from '../../middlewares/validateRequest';
import { ContactValidation } from './contact.validation';

const router = express.Router();

router
  .route('/')
  .post(
    auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
    validateRequest(ContactValidation.createContactZodSchema),
    ContactControllers.createContact,
  )
  .get(ContactControllers.getContact);

export const ContactRoutes = router;
