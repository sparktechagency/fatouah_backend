import express, { NextFunction, Request, Response } from 'express';
import { USER_ROLES } from '../../../enums/user';
import auth from '../../middlewares/auth';
import fileUploadHandler from '../../middlewares/fileUploadHandler';
import validateRequest from '../../middlewares/validateRequest';
import { UserController } from './user.controller';
import { UserValidation } from './user.validation';
import parseFileData from '../../middlewares/parseFileData';
const router = express.Router();

router
  .route('/profile')
  .get(
    auth(
      USER_ROLES.SUPER_ADMIN,
      USER_ROLES.ADMIN,
      USER_ROLES.RIDER,
      USER_ROLES.USER,
    ),
    UserController.getUserProfile,
  )
  .patch(
    auth(
      USER_ROLES.SUPER_ADMIN,
      USER_ROLES.ADMIN,
      USER_ROLES.RIDER,
      USER_ROLES.USER,
    ),
    fileUploadHandler(),
    parseFileData("image"),
    UserController.updateProfile
  );

router
  .route('/vehicle')
  .patch(
    fileUploadHandler(),
    auth(USER_ROLES.RIDER),
    UserController.updateVehicle,
  )
  .get(auth(USER_ROLES.RIDER), UserController.getVehicle);

router.patch(
  '/profile/:userId/admin',
  fileUploadHandler(),
  auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  UserController.adminUpdateUserProfile,
);

router.patch("/rider-status/:id", auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN), UserController.changeRiderStatus)

router.patch(
  '/:id/status',
  auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  UserController.updateUserStatus,
);

router
  .route('/')
  .post(
    fileUploadHandler(),
    validateRequest(UserValidation.createUserZodSchema),
    UserController.createUser,
  );

router.get(
  '/all-user',
  auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  UserController.getUsers,
);

router.get(
  '/all-rider',
  auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  UserController.getRiders,
);

router
  .route('/:id')
  .get(
    auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
    UserController.getUserById,
  )
  .delete(
    auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
    UserController.deleteUserFromDB,
  );

export const UserRoutes = router;
