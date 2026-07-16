import { Context } from "hono";
import { sendFCMNotification } from "../models/notification.model.js";

export async function sendNotification(c: Context) {
  let body: any;
  try {
    body = await c.req.json();
  } catch {
    c.status(400);
    return c.json({ error: "Invalid JSON body" });
  }

  const { fcmToken, fcmTokens, title, body: bodyText, clickAction } = body;
  if (!title || !bodyText) {
    c.status(400);
    return c.json({ error: "Missing required fields (title, body)" });
  }

  const tokens: string[] = [];
  if (fcmToken) tokens.push(fcmToken);
  if (Array.isArray(fcmTokens)) tokens.push(...fcmTokens);

  if (tokens.length === 0) {
    c.status(400);
    return c.json({ error: "At least one fcmToken or fcmTokens must be provided" });
  }

  console.log(`[FCM] Sending push notification to ${tokens.length} devices...`);

  const sendErrors: string[] = [];
  for (const token of tokens) {
    const tokenHint = token.length > 15 ? token.substring(0, 15) + "..." : token;
    try {
      await sendFCMNotification(token, title, bodyText, clickAction || "/");
    } catch (err: any) {
      console.error(`[FCM ERROR] Failed sending to ${tokenHint}:`, err);
      sendErrors.push(`${tokenHint}: ${err.message}`);
    }
  }

  if (sendErrors.length > 0 && sendErrors.length === tokens.length) {
    c.status(500);
    return c.json({
      success: false,
      warning: "Tất cả các lượt gửi đều thất bại. Vui lòng kiểm tra lại cấu hình hoặc token.",
      errors: sendErrors,
    });
  }

  return c.json({
    success: true,
    message: `Đã gửi thông báo đẩy thành công tới ${tokens.length - sendErrors.length}/${tokens.length} thiết bị!`,
    errors: sendErrors,
  });
}
