import { Request, Response } from "express";
import { saveOrUpdateUserOnLogin, removeUserFCMTokenOnLogout } from "../models/user.model.js";

// POST /api/auth/login OR /api/auth/register
export async function handleLoginOrRegister(req: Request, res: Response) {
  const { uid, email, displayName, photoURL, fcmToken } = req.body;

  if (!uid) {
    res.status(400).json({ error: "Missing required field: uid" });
    return;
  }

  try {
    const user = await saveOrUpdateUserOnLogin({
      uid,
      email,
      displayName,
      photoURL,
      fcmToken,
    });

    res.json({
      success: true,
      message: "Đăng nhập / đăng ký thành công và cập nhật FCM Token!",
      user,
    });
  } catch (err: any) {
    console.error("[Auth Controller Login/Register Error]:", err);
    res.status(500).json({ error: err.message });
  }
}

// POST /api/auth/logout
export async function handleLogout(req: Request, res: Response) {
  const { uid, fcmToken } = req.body;

  if (!uid) {
    res.status(400).json({ error: "Missing required field: uid" });
    return;
  }

  try {
    await removeUserFCMTokenOnLogout(uid, fcmToken);

    res.json({
      success: true,
      message: "Đăng xuất thành công và xóa FCM Token của thiết bị!",
    });
  } catch (err: any) {
    console.error("[Auth Controller Logout Error]:", err);
    res.status(500).json({ error: err.message });
  }
}
