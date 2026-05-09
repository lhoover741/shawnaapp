import { Router, type IRouter } from "express";
import healthRouter from "./health";
import reviewsRouter from "./reviews";
import adminRouter from "./admin";
import notificationsRouter from "./notifications";
import availabilityRouter from "./availability";
import settingsRouter from "./settings";
import bookingRequestsRouter from "./booking-requests";
import webPushRouter from "./web-push";

const router: IRouter = Router();

router.use(healthRouter);
router.use(reviewsRouter);
router.use(adminRouter);
router.use(notificationsRouter);
router.use(availabilityRouter);
router.use(settingsRouter);
router.use(bookingRequestsRouter);
router.use(webPushRouter);

export default router;
