import { Context } from "hono";
import { FirebaseUser } from "../middleware/auth.js";

export async function getHealth(c: Context) {
  return c.json({
    status: "OK",
    message: "Boardgame Luna API Node/Hono is running smoothly",
  });
}

export async function getProfile(c: Context) {
  const user = c.get("firebase_user") as FirebaseUser;
  return c.json({
    message: "Kết nối API xác thực thành công!",
    user,
  });
}
