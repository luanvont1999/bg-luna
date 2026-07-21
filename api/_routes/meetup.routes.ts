import { Router } from "express";
import {
  getAllMeetups,
  createMeetup,
  joinMeetup,
  approveMember,
  confirmParticipation,
  leaveOrKickMember,
} from "../_controllers/meetup.controller.js";
import { authMiddleware } from "../_middleware/auth.js";

const router = Router();

router.get("/api/meetups", getAllMeetups);
router.post("/api/meetups/create", authMiddleware, createMeetup);
router.post("/api/meetups/join", joinMeetup);
router.post("/api/meetups/approve", approveMember);
router.post("/api/meetups/confirm", confirmParticipation);
router.post("/api/meetups/leave", leaveOrKickMember);

export default router;
