import { Request, Response } from "express";
import { sendFCMNotification } from "../models/notification.model.js";

export async function sendNotification(req: Request, res: Response) {
  const body = req.body;

  const { fcmToken, fcmTokens, title, body: bodyText, clickAction } = body;
  if (!title || !bodyText) {
    res.status(400).json({ error: "Missing required fields (title, body)" });
    return;
  }

  const tokens: string[] = [];
  if (fcmToken) tokens.push(fcmToken);
  if (Array.isArray(fcmTokens)) tokens.push(...fcmTokens);

  if (tokens.length === 0) {
    res.status(400).json({ error: "At least one fcmToken or fcmTokens must be provided" });
    return;
  }

  console.log(`[FCM Broadcast] Bắt đầu xử lý gửi thông báo...`);
  console.log(`[FCM Broadcast] Tiêu đề: "${title}"`);
  console.log(`[FCM Broadcast] Nội dung: "${bodyText}"`);
  console.log(`[FCM Broadcast] Deep Link: "${clickAction || "/"}"`);
  console.log(`[FCM Broadcast] Danh sách ${tokens.length} tokens nhận được:`, tokens.map(t => t.substring(0, 12) + "..."));

  const sendErrors: string[] = [];
  let successCount = 0;

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const tokenHint = token.length > 15 ? token.substring(0, 15) + "..." : token;
    try {
      console.log(`[FCM Broadcast] [${i + 1}/${tokens.length}] Đang gửi tới: ${tokenHint}`);
      await sendFCMNotification(token, title, bodyText, clickAction || "/");
      console.log(`[FCM Broadcast] [${i + 1}/${tokens.length}] ✅ Gửi thành công tới: ${tokenHint}`);
      successCount++;
    } catch (err: any) {
      console.error(`[FCM Broadcast] [${i + 1}/${tokens.length}] ❌ Lỗi gửi tới ${tokenHint}:`, err.message);
      sendErrors.push(`${tokenHint}: ${err.message}`);
    }
  }

  console.log(`[FCM Broadcast] Hoàn tất! Thành công: ${successCount}/${tokens.length}, Thất bại: ${sendErrors.length}`);

  if (sendErrors.length > 0 && sendErrors.length === tokens.length) {
    res.status(500).json({
      success: false,
      warning: "Tất cả các lượt gửi đều thất bại. Vui lòng kiểm tra lại cấu hình hoặc token.",
      errors: sendErrors,
    });
    return;
  }

  res.json({
    success: true,
    message: `Đã gửi thông báo đẩy thành công tới ${successCount}/${tokens.length} thiết bị!`,
    errors: sendErrors,
  });
}
