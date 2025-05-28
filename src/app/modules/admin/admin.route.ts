import express from 'express';
import auth from '../../middlewares/auth';
import { USER_ROLES } from '../../../enums/user';
import { AdminControllers } from './admin.controller';
import validateRequest from '../../middlewares/validateRequest';
import { AdminValidation } from './admin.validation';

const router = express.Router();

router.post(
  '/create-admin',
  auth(USER_ROLES.SUPER_ADMIN),
  validateRequest(AdminValidation.createAdminZodSchema),
  AdminControllers.createAdmin,
);

router.get(
  '/get-admin',
  auth(USER_ROLES.SUPER_ADMIN),
  AdminControllers.getAdmins,
);

router.patch("/update-admin/:id", auth(USER_ROLES.SUPER_ADMIN), AdminControllers.updateAdmin)

router.patch(
  '/:id/status',
  auth(USER_ROLES.SUPER_ADMIN),
  AdminControllers.updateAdminStatus,
);

router.delete(
  '/:id',
  auth(USER_ROLES.SUPER_ADMIN),
  AdminControllers.deleteAdmin,
);

export const AdminRoutes = router;
