import { User } from "firebase/auth";
import { doc, getDoc, setDoc, arrayUnion, deleteField } from "firebase/firestore";
import { db } from "../libs/firebase";

const API_BASE = import.meta.env.DEV ? (import.meta.env.VITE_API_URL || "") : "";

/**
 * Gọi API Backend POST /api/auth/login (hoặc /register) gửi kèm thông tin User và fcmToken thiết bị,
 * đồng thời tạo ngay lập tức document /users/{userId} trên Firestore.
 */
export async function syncLoginOrRegisterApi(
  user: User,
  fcmToken?: string | null,
  isRegister: boolean = false
) {
  const token = fcmToken || localStorage.getItem("fcmToken") || "";
  
  // 1. Tạo hoặc cập nhật trực tiếp Firestore từ Client SDK để chắc chắn có record ngay lập tức
  try {
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);
    
    const displayName = user.displayName || (user.email ? user.email.split('@')[0] : "Thành viên");
    const updateData: Record<string, any> = {
      uid: user.uid,
      email: user.email || "",
      displayName,
      photoURL: user.photoURL || "",
      fcmToken: deleteField(), // Xóa field fcmToken cũ bị duplicate
      updatedAt: new Date()
    };

    if (token) {
      updateData.fcmTokens = arrayUnion(token);
    }

    if (!userSnap.exists()) {
      updateData.createdAt = new Date();
      updateData.bio = "";
      updateData.favoriteCategories = [];
      if (!updateData.fcmTokens) updateData.fcmTokens = token ? [token] : [];
    }

    await setDoc(userRef, updateData, { merge: true });
    console.log(`[Auth Client Sync] ✅ Đã lưu/cập nhật user ${user.uid} lên Firestore.`);
  } catch (err: any) {
    console.warn(`[Auth Client Sync Warning] Firestore update failed:`, err.message);
  }

  // 2. Gọi API Backend proxy
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
        fcmToken: token,
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
