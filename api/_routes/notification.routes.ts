import { Router } from "express";
import { sendNotification } from "../_controllers/notification.controller.js";

const router = Router();

router.post("/api/send-notification", sendNotification);

export default router;
