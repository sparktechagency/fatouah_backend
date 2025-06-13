import express from "express";
import auth from "../../middlewares/auth";
import { USER_ROLES } from "../../../enums/user";
import { NotificationControllers } from "./notification.controller";

const router = express.Router();

router.route("/")
    .get(auth(USER_ROLES.USER, USER_ROLES.RIDER), NotificationControllers.getNotification)
    .get(auth(USER_ROLES.USER, USER_ROLES.RIDER), NotificationControllers.readNotification)

export const NotificationRoutes = router;