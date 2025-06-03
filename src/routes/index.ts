import express from 'express';
import { AuthRoutes } from '../app/modules/auth/auth.route';
import { UserRoutes } from '../app/modules/user/user.route';
import { ReviewRoutes } from '../app/modules/review/review.route';
import { RuleRoutes } from '../app/modules/rule/rule.route';
import { FaqRoutes } from '../app/modules/faq/faq.route';
import { BannerRoutes } from '../app/modules/banner/banner.route';
import { AdminRoutes } from '../app/modules/admin/admin.route';
import { ContactRoutes } from '../app/modules/contact/contact.route';
import { NotificationRoutes } from '../app/modules/notification/notification.route';
import { OrderRoutes } from '../app/modules/order/order.route';
import { DeliveryRoutes } from '../app/modules/delivery/delivery.route';
import { ReportRoutes } from '../app/modules/report/report.route';

const router = express.Router();

const apiRoutes = [
  {
    path: '/user',
    route: UserRoutes,
  },
  {
    path: '/auth',
    route: AuthRoutes,
  },
  {
    path: '/review',
    route: ReviewRoutes,
  },
  {
    path: '/rule',
    route: RuleRoutes,
  },
  {
    path: '/faq',
    route: FaqRoutes,
  },
  {
    path: '/banner',
    route: BannerRoutes,
  },
  {
    path: '/admin',
    route: AdminRoutes,
  },
  {
    path: '/contact',
    route: ContactRoutes,
  },
  {
    path: '/notification',
    route: NotificationRoutes,
  },
  {
    path: '/order',
    route: OrderRoutes,
  },
  {
    path: '/delivery',
    route: DeliveryRoutes,
  },
  {
    path: '/report',
    route: ReportRoutes,
  }
];

apiRoutes.forEach(route => router.use(route.path, route.route));

export default router;
