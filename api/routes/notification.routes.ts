import { Hono } from "hono";
import { sendNotification } from "../controllers/notification.controller.js";

const router = new Hono();

router.post("/api/send-notification", sendNotification);

export default router;
