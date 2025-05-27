import express from 'express';
import auth from '../../middlewares/auth';
import { USER_ROLES } from '../../../enums/user';
import { BannerControllers } from './banner.controller';
import fileUploadHandler from '../../middlewares/fileUploadHandler';

const router = express.Router();

router
  .route('/')
  .post(
    fileUploadHandler(),
    auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
    BannerControllers.createBanner
  )
  .get(BannerControllers.getBanners);

router
  .route('/:id')
  .patch(
    auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
    BannerControllers.updateBanner
  )
  .delete(
    auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
    BannerControllers.deleteBanner
  );

export const BannerRoutes = router;
