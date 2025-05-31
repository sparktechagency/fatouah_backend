import express from "express";
import { ReportControllers } from "./report.controller";

const router = express.Router();

router.get("/user-report", ReportControllers.userReport)

export const ReportRoutes = router;