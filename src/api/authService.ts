import { User } from "firebase/auth";

const API_BASE = import.meta.env.DEV ? (import.meta.env.VITE_API_URL || "") : "";

/**
 * Gọi API Backend POST /api/auth/login (hoặc /register) gửi kèm thông tin User và fcmToken thiết bị.
 */
export async function syncLoginOrRegisterApi(
  user: User,
  fcmToken?: string | null,
  isRegister: boolean = false
) {
  const endpoint = isRegister ? "/api/auth/register" : "/api/auth/login";
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        uid: user.uid,
        email: user.email || "",
        displayName: user.displayName || "",
        photoURL: user.photoURL || "",
        fcmToken: fcmToken || localStorage.getItem("fcmToken") || "",
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.warn(`[Auth API Warning] ${endpoint} failed: ${res.status} - ${text}`);
      return false;
    }

    const data = await res.json();
    console.log(`[Auth API Success] ${endpoint}:`, data.message);
    return true;
  } catch (err: any) {
    console.error(`[Auth API Error] ${endpoint} failed:`, err.message);
    return false;
  }
}

/**
 * Gọi API Backend POST /api/auth/logout gửi kèm fcmToken của thiết bị để hủy token trên Firestore.
 */
export async function syncLogoutApi(uid: string, fcmToken?: string | null) {
  try {
    const token = fcmToken || localStorage.getItem("fcmToken") || "";
    const res = await fetch(`${API_BASE}/api/auth/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        uid,
        fcmToken: token,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.warn(`[Auth Logout API Warning]: ${res.status} - ${text}`);
      return false;
    }

    const data = await res.json();
    console.log(`[Auth Logout API Success]:`, data.message);
    return true;
  } catch (err: any) {
    console.error(`[Auth Logout API Error]:`, err.message);
    return false;
  }
}
