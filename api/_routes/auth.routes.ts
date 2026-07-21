import { Router } from "express";
import { handleLoginOrRegister, handleLogout } from "../_controllers/auth.controller.js";

const router = Router();

router.post("/api/auth/login", handleLoginOrRegister);
router.post("/api/auth/register", handleLoginOrRegister);
router.post("/api/auth/logout", handleLogout);

export default router;
