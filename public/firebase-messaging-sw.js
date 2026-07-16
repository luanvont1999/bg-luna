// public/firebase-messaging-sw.js

// Ép Service Worker mới kích hoạt ngay lập tức khi phát hiện có thay đổi
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// Lắng nghe sự kiện push thô của trình duyệt (Web Push API) để hiển thị thông báo dưới nền
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Nhận sự kiện push thô:', event);
  
  if (!event.data) return;

  try {
    const payload = event.data.json();
    console.log('[Service Worker] Payload JSON:', payload);

    // FCM V1 gửi dữ liệu trong nhánh data của payload.
    // Ưu tiên trích xuất từ payload.notification hoặc payload.data
    const title = payload.notification?.title || payload.data?.title || 'Boardgame Luna 🎲';
    const body = payload.notification?.body || payload.data?.body || 'Bạn có thông báo mới!';
    const clickAction = payload.notification?.click_action || payload.data?.clickAction || '/';

    const notificationOptions = {
      body: body,
      icon: '/boardgame_pwa_icon_1784017090071.png',
      badge: '/boardgame_pwa_icon_1784017090071.png',
      data: {
        clickAction: clickAction
      }
    };

    event.waitUntil(
      self.registration.showNotification(title, notificationOptions)
    );
  } catch (e) {
    console.error('[Service Worker] Lỗi xử lý push payload:', e);
  }
});

// Xử lý sự kiện click vào thông báo đẩy để chuyển hướng
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  // Trích xuất link điều hướng từ data payload
  let clickAction = '/';
  if (event.notification.data) {
    clickAction = event.notification.data.clickAction || clickAction;
    if (!event.notification.data.clickAction && event.notification.data.FCM_MSG) {
      const fcmMsg = event.notification.data.FCM_MSG;
      if (fcmMsg.notification && fcmMsg.notification.click_action) {
        clickAction = fcmMsg.notification.click_action;
      }
    }
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Nếu có tab app đang mở, focus vào tab đó và gửi tin nhắn điều hướng route
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if ('focus' in client) {
          client.focus();
          client.postMessage({ type: 'NAVIGATE_ROUTE', url: clickAction });
          return;
        }
      }
      // Nếu chưa có tab nào mở, mở tab mới với đường dẫn clickAction
      if (clients.openWindow) {
        return clients.openWindow(clickAction);
      }
    })
  );
});
