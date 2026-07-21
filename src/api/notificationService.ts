import { doc, getDoc, setDoc, updateDoc, deleteField, arrayUnion, arrayRemove, collection, getDocs } from 'firebase/firestore';
import { getToken, deleteToken, onMessage } from 'firebase/messaging';
import { db, messaging, auth } from '../libs/firebase';

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || '';

/**
 * Xin quyền thông báo đẩy và lấy FCM Token của thiết bị.
 * Lưu token này vào mảng `fcmTokens` của user tại `/users/{userId}` trên Firestore.
 */
export async function initNotifications(userId: string, onForegroundNotification?: (payload: any) => void) {
  if (!messaging) {
    console.warn('[FCM] Messaging không được hỗ trợ trong môi trường này.');
    return null;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('[FCM] Quyền thông báo bị từ chối.');
      return null;
    }

    // Đăng ký Service Worker tường minh
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    console.log('[FCM] Service worker registered successfully:', registration);

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration
    });

    if (token) {
      console.log('[FCM] Lấy FCM Token thành công:', token);
      
      // Lưu token vào mảng fcmTokens trong document /users/{userId} và xóa fcmToken đơn cũ
      const userRef = doc(db, 'users', userId);
      const user = auth.currentUser;
      const profileData: Record<string, any> = {
        fcmTokens: arrayUnion(token),
        fcmToken: deleteField(),
        updatedAt: new Date()
      };
      if (user?.displayName) profileData.displayName = user.displayName;
      if (user?.email) profileData.email = user.email;

      await setDoc(userRef, profileData, { merge: true });
      localStorage.setItem('fcmToken', token);
      console.log('[FCM] Đã thêm fcmToken vào mảng thiết bị cho user:', userId);
      
      // Lắng nghe thông báo khi app đang mở (Foreground)
      onMessage(messaging, (payload) => {
        console.log('[FCM] Nhận thông báo ở Foreground:', payload);
        if (onForegroundNotification) {
          onForegroundNotification(payload);
        }
      });

      return token;
    } else {
      console.warn('[FCM] Không lấy được FCM Token.');
      return null;
    }
  } catch (err) {
    console.error('[FCM] Lỗi cấu hình thông báo đẩy:', err);
    return null;
  }
}

/**
 * Xóa FCM Token của thiết bị hiện tại khỏi mảng `fcmTokens` trên Firestore và hủy Token trên Firebase Messaging khi đăng xuất hoặc tắt thông báo.
 */
export async function removeNotificationToken(userId: string) {
  const currentToken = localStorage.getItem('fcmToken');

  try {
    if (messaging) {
      await deleteToken(messaging).catch((err) =>
        console.warn('[FCM] Lỗi deleteToken từ Firebase Messaging:', err)
      );
    }
  } catch (err) {
    console.warn('[FCM] Unregister token error:', err);
  }

  if (userId) {
    try {
      const userRef = doc(db, 'users', userId);
      if (currentToken) {
        await updateDoc(userRef, {
          fcmTokens: arrayRemove(currentToken),
          fcmToken: deleteField()
        });
      } else {
        await updateDoc(userRef, {
          fcmToken: deleteField()
        });
      }
      console.log(`[FCM] Đã xóa fcmToken của thiết bị cho user ${userId} trên Firestore.`);
    } catch (err) {
      console.warn('[FCM] Lỗi xóa fcmToken trên Firestore:', err);
    }
  }

  localStorage.removeItem('fcmToken');
}


/**
 * Gửi thông báo đẩy bằng cách gọi API Proxy của Backend Go.
 */
export async function sendPushNotificationProxy(fcmToken: string, title: string, body: string, clickAction?: string) {
  if (!fcmToken) return;

  const API_BASE = import.meta.env.DEV ? (import.meta.env.VITE_API_URL || '') : '';
  try {
    const res = await fetch(`${API_BASE}/api/send-notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ fcmToken, title, body, clickAction })
    });
    const data = await res.json();
    if (data.success) {
      console.log('[FCM Proxy] Đã kích hoạt gửi thông báo thành công!');
    } else {
      console.warn('[FCM Proxy Warning]:', data.warning);
    }
  } catch (err) {
    console.error('[FCM Proxy Error] Gửi thông báo thất bại:', err);
  }
}

/**
 * Gửi thông báo broadcast tới tất cả các thiết bị đã đăng ký.
 */
export async function broadcastPushNotifications(title: string, body: string, clickAction?: string): Promise<{ success: boolean; message: string; errors?: string[] }> {
  console.log('[FCM Frontend Broadcast] Bắt đầu quét Firestore tìm FCM Tokens...');
  try {
    const querySnapshot = await getDocs(collection(db, 'users'));
    const tokensSet = new Set<string>();
    
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (data) {
        if (Array.isArray(data.fcmTokens)) {
          data.fcmTokens.forEach((t: string) => t && tokensSet.add(t));
        }
        if (data.fcmToken) {
          tokensSet.add(data.fcmToken);
        }
      }
    });

    const tokens = Array.from(tokensSet);

    console.log(`[FCM Frontend Broadcast] Đã quét xong. Tìm thấy tổng cộng ${querySnapshot.size} tài khoản, trong đó có ${tokens.length} tài khoản đăng ký FCM Token.`);

    if (tokens.length === 0) {
      console.warn('[FCM Frontend Broadcast] Không có thiết bị nào đăng ký token.');
      return { success: false, message: 'Không tìm thấy thiết bị nào có đăng ký FCM Token trên Firestore!' };
    }

    const API_BASE = import.meta.env.DEV ? (import.meta.env.VITE_API_URL || '') : '';
    console.log(`[FCM Frontend Broadcast] Gửi request lên Backend API: ${API_BASE}/api/send-notification`);
    
    const res = await fetch(`${API_BASE}/api/send-notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ fcmTokens: tokens, title, body, clickAction })
    });
    
    const data = await res.json();
    console.log('[FCM Frontend Broadcast] Backend phản hồi:', data);
    return {
      success: data.success,
      message: data.message || data.warning || 'Đã thực hiện gửi broadcast!',
      errors: data.errors
    };
  } catch (err: any) {
    console.error('[FCM Frontend Broadcast Error]:', err);
    return { success: false, message: 'Lỗi gửi broadcast: ' + err.message };
  }
}

/**
 * Gửi thông báo đẩy tới tất cả các thành viên tham gia trong kèo khi có tin nhắn mới.
 */
export async function notifyMeetupChatMembers(
  meetupId: string,
  meetupTitle: string,
  allMemberUids: string[],
  senderUid: string,
  senderName: string,
  messageText: string
) {
  try {
    const targetUids = Array.from(new Set(allMemberUids)).filter((uid) => uid && uid !== senderUid);
    if (targetUids.length === 0) return;

    const tokenPromises = targetUids.map(async (uid) => {
      try {
        const userDoc = await getDoc(doc(db, 'users', uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (Array.isArray(data.fcmTokens)) return data.fcmTokens as string[];
          if (data.fcmToken) return [data.fcmToken as string];
        }
      } catch (e) {
        console.warn(`[FCM Chat] Failed to fetch token for user ${uid}:`, e);
      }
      return [];
    });

    const tokensNested = await Promise.all(tokenPromises);
    const tokens = tokensNested.flat().filter(Boolean);
    if (tokens.length === 0) return;

    const API_BASE = import.meta.env.DEV ? (import.meta.env.VITE_API_URL || '') : '';
    const title = `💬 [${meetupTitle}] ${senderName}`;
    const body = messageText.length > 80 ? messageText.substring(0, 80) + '...' : messageText;

    await fetch(`${API_BASE}/api/send-notification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fcmTokens: tokens,
        title,
        body,
        clickAction: `/#/chat/${meetupId}`
      })
    });
    console.log(`[FCM Chat Notification] Sent notification to ${tokens.length} device tokens.`);
  } catch (err) {
    console.error('[FCM Chat Notification Error]:', err);
  }
}

/**
 * Gửi thông báo đẩy tới tất cả thành viên trong kèo khi kèo bị hủy bởi Host.
 */
export async function notifyMeetupCancellation(
  meetupTitle: string,
  gameName: string,
  memberUids: string[],
  hostUid: string,
  hostName: string
) {
  try {
    const targetUids = Array.from(new Set(memberUids)).filter((uid) => uid && uid !== hostUid);
    if (targetUids.length === 0) return;

    const tokenPromises = targetUids.map(async (uid) => {
      try {
        const userDoc = await getDoc(doc(db, 'users', uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (Array.isArray(data.fcmTokens)) return data.fcmTokens as string[];
          if (data.fcmToken) return [data.fcmToken as string];
        }
      } catch (e) {
        console.warn(`[FCM Cancellation] Failed to fetch token for user ${uid}:`, e);
      }
      return [];
    });

    const tokensNested = await Promise.all(tokenPromises);
    const tokens = tokensNested.flat().filter(Boolean);
    if (tokens.length === 0) return;

    const API_BASE = import.meta.env.DEV ? (import.meta.env.VITE_API_URL || '') : '';
    const title = `🚫 Kèo chơi đã bị huỷ!`;
    const body = `Kèo "${meetupTitle}" (Game: ${gameName}) đã bị huỷ bởi Host ${hostName}.`;

    await fetch(`${API_BASE}/api/send-notification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fcmTokens: tokens,
        title,
        body,
        clickAction: `/#/`
      })
    });
    console.log(`[FCM Cancellation Notification] Sent cancellation notification to ${tokens.length} members.`);
  } catch (err) {
    console.error('[FCM Cancellation Notification Error]:', err);
  }
}
