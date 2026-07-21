import { Request, Response } from "express";
import { FirebaseUser } from "../_middleware/auth.js";

export async function getHealth(req: Request, res: Response) {
  res.json({
    status: "OK",
    message: "Boardgame Luna API Node/Express is running smoothly",
  });
}

export async function getProfile(req: Request, res: Response) {
  const user = (req as any).firebase_user as FirebaseUser;
  res.json({
    message: "Kết nối API xác thực thành công!",
    user,
  });
}
