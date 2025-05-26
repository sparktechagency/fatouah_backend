import express from 'express';
import auth from '../../middlewares/auth';
import { USER_ROLES } from '../../../enums/user';
import { RuleControllers } from './rule.controller';

const router = express.Router();

router
  .route('/terms-and-conditions')
  .post(
    auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
    RuleControllers.createTermsAndCondition
  )
  .get(RuleControllers.getTermsAndCondition);

router
  .route('/privacy-policy')
  .post(
    auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
    RuleControllers.createPrivacyPolicy
  )
  .get(RuleControllers.getPrivacyPolicy);

router
  .route('/about')
  .post(
    auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
    RuleControllers.createAbout
  )
  .get(RuleControllers.getAbout);

export const RuleRoutes = router;
