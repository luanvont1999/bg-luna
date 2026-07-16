import fs from "fs";
import path from "path";
import jwt from "jsonwebtoken";

export interface ServiceAccount {
  type: string;
  project_id: string;
  private_key: string;
  client_email: string;
  token_uri: string;
}

let cachedAccessToken = "";
let tokenExpiration = 0;
let activeProjectId = "";

export async function getAccessToken(): Promise<{ accessToken: string; projectId: string }> {
  const now = Date.now();
  if (cachedAccessToken && now < tokenExpiration) {
    return { accessToken: cachedAccessToken, projectId: activeProjectId };
  }

  let sa: ServiceAccount;
  const saJSON = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (saJSON) {
    try {
      sa = JSON.parse(saJSON);
    } catch (err: any) {
      throw new Error(`Lỗi parse service account từ env: ${err.message}`);
    }
  } else {
    let saPath = process.env.FIREBASE_SERVICE_ACCOUNT_JSON_PATH || "firebase-service-account.json";
    if (!path.isAbsolute(saPath)) {
      saPath = path.resolve(process.cwd(), "..", saPath);
    }

    if (!fs.existsSync(saPath)) {
      saPath = path.resolve(process.cwd(), "firebase-service-account.json");
    }

    try {
      const fileContent = fs.readFileSync(saPath, "utf-8");
      sa = JSON.parse(fileContent);
    } catch (err: any) {
      throw new Error(`Không thể đọc file service account tại ${saPath}: ${err.message}`);
    }
  }

  const assertion = jwt.sign(
    {
      iss: sa.client_email,
      sub: sa.client_email,
      aud: sa.token_uri,
      scope: "https://www.googleapis.com/auth/cloud-platform",
    },
    sa.private_key,
    {
      algorithm: "RS256",
      expiresIn: "1h",
    }
  );

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch(sa.token_uri, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: assertion,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Lỗi Google OAuth API: ${res.status} - ${text}`);
    }

    const data = (await res.json()) as { access_token: string; expires_in?: number };
    cachedAccessToken = data.access_token;
    tokenExpiration = now + (data.expires_in || 3600) * 1000 - 5 * 60 * 1000;
    activeProjectId = sa.project_id;

    return { accessToken: cachedAccessToken, projectId: activeProjectId };
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === "AbortError") {
      throw new Error("Yêu cầu lấy Access Token từ Google OAuth API bị quá thời gian (5s timeout)");
    }
    throw err;
  }
}

export async function sendFCMNotification(
  token: string,
  title: string,
  body: string,
  clickAction: string
): Promise<void> {
  const { accessToken, projectId } = await getAccessToken();
  const url = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;

  const payload = {
    message: {
      token: token,
      notification: {
        title,
        body,
      },
      data: {
        title,
        body,
        clickAction,
      },
      webpush: {
        headers: {
          Urgency: "high",
        },
        notification: {
          title,
          body,
          icon: "/boardgame_pwa_icon_1784017090071.png",
          badge: "/boardgame_pwa_icon_1784017090071.png",
          click_action: clickAction,
        },
        fcm_options: {
          link: clickAction,
        },
      },
      apns: {
        headers: {
          "apns-priority": "10",
        },
        payload: {
          aps: {
            alert: {
              title,
              body,
            },
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

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`FCM V1 API error ${res.status}: ${text}`);
  }
}
