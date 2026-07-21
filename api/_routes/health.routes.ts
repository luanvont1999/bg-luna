import { Router } from "express";
import { getHealth, getProfile } from "../_controllers/health.controller.js";
import { authMiddleware } from "../_middleware/auth.js";

const router = Router();

router.get("/api/health", getHealth);
router.get("/api/profile", authMiddleware, getProfile);

export default router;
