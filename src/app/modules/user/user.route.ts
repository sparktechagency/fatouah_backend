import express, { NextFunction, Request, Response } from 'express';
import { USER_ROLES } from '../../../enums/user';
import auth from '../../middlewares/auth';
import fileUploadHandler from '../../middlewares/fileUploadHandler';
import validateRequest from '../../middlewares/validateRequest';
import { UserController } from './user.controller';
import { UserValidation } from './user.validation';
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
    (req: Request, res: Response, next: NextFunction) => {
      if (req.body.data) {
        req.body = UserValidation.updateUserZodSchema.parse(
          JSON.parse(req.body.data),
        );
      }
      return UserController.updateProfile(req, res, next);
    },
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
