import fs from "fs";
import path from "path";
import jwt from "jsonwebtoken";

interface ServiceAccount {
  type: string;
  project_id: string;
  private_key: string;
  client_email: string;
  token_uri: string;
}

async function main() {
  const args = process.argv.slice(2);
  const title = args[0] || "🎲 Boardgame Hub - Thông báo đẩy!";
  const bodyText = args[1] || "Có thông tin mới trên ứng dụng Boardgame Hub, hãy chạm để xem ngay!";
  const clickAction = args[2] || "/";

  console.log("====================================================");
  console.log("🚀 BẮT ĐẦU GỬI PUSH NOTIFICATION THỬ NGHIỆM TỚI TẤT CẢ DEVICESS");
  console.log(`📌 Tiêu đề: "${title}"`);
  console.log(`💬 Nội dung: "${bodyText}"`);
  console.log(`🔗 Link: "${clickAction}"`);
  console.log("====================================================\n");

  let saPath = path.resolve(process.cwd(), "firebase-service-account.json");
  if (!fs.existsSync(saPath)) {
    saPath = path.resolve(process.cwd(), "firebase-service-account-bk.json");
  }

  if (!fs.existsSync(saPath)) {
    console.error("❌ Không tìm thấy file firebase-service-account.json!");
    process.exit(1);
  }

  const sa: ServiceAccount = JSON.parse(fs.readFileSync(saPath, "utf-8"));

  // 1. Google OAuth Access Token
  const assertion = jwt.sign(
    {
      iss: sa.client_email,
      sub: sa.client_email,
      aud: sa.token_uri,
      scope: "https://www.googleapis.com/auth/cloud-platform",
    },
    sa.private_key,
    { algorithm: "RS256", expiresIn: "1h" }
  );

  const tokenRes = await fetch(sa.token_uri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: assertion,
    }),
  });

  if (!tokenRes.ok) {
    const text = await tokenRes.text();
    console.error("❌ Không lấy được Google OAuth Access Token:", text);
    process.exit(1);
  }

  const tokenData = (await tokenRes.json()) as { access_token: string };
  const accessToken = tokenData.access_token;
  const projectId = sa.project_id;
  console.log(`✅ OAuth Access Token sẵn sàng. Firebase Project: ${projectId}`);

  // 2. Fetch all users from Firestore
  const usersUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users`;
  const usersRes = await fetch(usersUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!usersRes.ok) {
    const text = await usersRes.text();
    console.error("❌ Lỗi lấy danh sách users từ Firestore:", text);
    process.exit(1);
  }

  const usersData = await usersRes.json();
  const docs = usersData.documents || [];

  const targets: { name: string; token: string }[] = [];
  for (const doc of docs) {
    const fcmToken = doc.fields?.fcmToken?.stringValue;
    const name = doc.fields?.displayName?.stringValue || doc.name.split("/").pop();
    if (fcmToken) {
      targets.push({ name, token: fcmToken });
    }
  }

  console.log(`🔍 Tìm thấy ${docs.length} tài khoản trong hệ thống. Đã đăng ký FCM Token: ${targets.length}\n`);

  if (targets.length === 0) {
    console.warn("⚠️ Không có thiết bị nào có đăng ký FCM Token!");
    return;
  }

  // 3. Send FCM Notification concurrently
  const startTime = Date.now();
  const results = await Promise.allSettled(
    targets.map(async (item, i) => {
      const url = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;
      const payload = {
        message: {
          token: item.token,
          notification: { title, body: bodyText },
          data: { title, body: bodyText, clickAction },
          webpush: {
            headers: { Urgency: "high", TTL: "86400" },
            notification: {
              title,
              body: bodyText,
              icon: "/boardgame_pwa_icon_1784017090071.png",
              badge: "/boardgame_pwa_icon_1784017090071.png",
              click_action: clickAction,
            },
            fcm_options: { link: clickAction },
          },
          apns: {
            headers: { "apns-priority": "10", "apns-push-type": "alert" },
            payload: {
              aps: {
                alert: { title, body: bodyText },
                sound: "default",
                "mutable-content": 1,
                "content-available": 1,
              },
            },
          },
        },
      };

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      const resText = await res.text();
      const hint = item.token.slice(0, 12) + "...";
      if (!res.ok) {
        throw new Error(`[${i + 1}/${targets.length}] ${item.name} (${hint}): ${res.status} - ${resText}`);
      }
      return `[${i + 1}/${targets.length}] ${item.name} (${hint})`;
    })
  );

  const duration = Date.now() - startTime;
  let successCount = 0;
  const errors: string[] = [];

  for (const r of results) {
    if (r.status === "fulfilled") {
      successCount++;
      console.log(`  ✅ ${r.value}`);
    } else {
      errors.push(r.reason.message);
      console.error(`  ❌ ${r.reason.message}`);
    }
  }

  console.log("\n================ KẾT QUẢ BROADCAST ================");
  console.log(`⏱️  Thời gian xử lý: ${duration}ms (${(duration / 1000).toFixed(2)}s)`);
  console.log(`🎯 Thành công: ${successCount}/${targets.length}`);
  console.log(`💥 Thất bại: ${errors.length}/${targets.length}`);
  console.log("===================================================\n");
}

main().catch(console.error);
