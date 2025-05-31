import express from 'express';
import auth from '../../middlewares/auth';
import { USER_ROLES } from '../../../enums/user';
import { BannerControllers } from './banner.controller';
import fileUploadHandler from '../../middlewares/fileUploadHandler';
import validateRequest from '../../middlewares/validateRequest';
import { BannerValidation } from './banner.validation';

const router = express.Router();

router
  .route('/')
  .post(
    fileUploadHandler(),
    validateRequest(BannerValidation.createBannerZodSchema),
    auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
    BannerControllers.createBanner,
  )
  .get(BannerControllers.getBanners);

router.patch(
  '/:id/status',
  auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  BannerControllers.updateBannerStatus,
);

// get all banners regardless of status
router.get(
  '/all-banner',
  auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  BannerControllers.getAllBanners,
);

router
  .route('/:id')
  .patch(
    fileUploadHandler(),
    auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
    BannerControllers.updateBanner,
  )
  .delete(
    auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
    BannerControllers.deleteBanner,
  );

export const BannerRoutes = router;
