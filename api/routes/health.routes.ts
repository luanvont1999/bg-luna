import { Hono } from "hono";
import { getHealth, getProfile } from "../controllers/health.controller.js";
import { authMiddleware } from "../middleware/auth.js";

const router = new Hono();

router.get("/api/health", getHealth);
router.get("/api/profile", authMiddleware, getProfile);

export default router;
