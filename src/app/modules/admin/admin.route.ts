import express from 'express';
import auth from '../../middlewares/auth';
import { USER_ROLES } from '../../../enums/user';
import { AdminControllers } from './admin.controller';

const router = express.Router();

router
  .route('/')
  .post(auth(USER_ROLES.SUPER_ADMIN), AdminControllers.createAdmin)
  .get(
    auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
    AdminControllers.getAdmins
  );

router.patch(
  '/:id/status',
  auth(USER_ROLES.SUPER_ADMIN),
  AdminControllers.updateAdminStatus
);

router
  .route('/:id')
  .patch(auth(USER_ROLES.SUPER_ADMIN), AdminControllers.updateAdmin)
  .delete(auth(USER_ROLES.SUPER_ADMIN), AdminControllers.deleteAdmin);

export const AdminRoutes = router;
