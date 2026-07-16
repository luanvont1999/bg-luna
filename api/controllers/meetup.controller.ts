import { Context } from "hono";
import { FirebaseUser } from "../middleware/auth.js";
import {
  meetupStore,
  getFirestoreMeetup,
  updateFirestoreMeetup,
  setFirestoreRequest,
  updateFirestoreRequestStatus,
  deleteFirestoreRequest,
  Meetup,
} from "../models/meetup.model.js";
import { sendFCMNotification } from "../models/notification.model.js";

// GET /api/meetups
export async function getAllMeetups(c: Context) {
  return c.json(meetupStore.getAll());
}

// POST /api/meetups/create
export async function createMeetup(c: Context) {
  const user = c.get("firebase_user") as FirebaseUser;
  let body: any;
  try {
    body = await c.req.json();
  } catch {
    c.status(400);
    return c.json({ error: "Invalid JSON body" });
  }

  const { title, game, lat, lng, time } = body;
  if (!title || !game || !lat || !lng || !time) {
    c.status(400);
    return c.json({ error: "Missing required fields (title, game, lat, lng, time)" });
  }

  const colors = ["#bca0f5", "#ffa4b2", "#ffe869", "#ffb875", "#9ee3b2", "#a4f0fd"];
  const color = colors[Math.floor(Math.random() * colors.length)];
  const hostName = user.name || user.email || "Ẩn danh";

  const newMeetup: Meetup = {
    id: Math.floor(Math.random() * 1000000).toString(),
    title,
    game,
    host_name: hostName,
    host_uid: user.uid,
    lat: parseFloat(lat),
    lng: parseFloat(lng),
    players_count: 1,
    players_needed: 4,
    time,
    color,
  };

  meetupStore.add(newMeetup);
  console.log(`[Meetups] Created new meetup: ${newMeetup.title} by ${newMeetup.host_name}`);

  c.status(201);
  return c.json(newMeetup);
}

// POST /api/meetups/join
export async function joinMeetup(c: Context) {
  let body: any;
  try {
    body = await c.req.json();
  } catch {
    c.status(400);
    return c.json({ error: "Invalid JSON body" });
  }

  const { meetupId, userUid, userName, fcmToken } = body;
  if (!meetupId || !userUid || !userName) {
    c.status(400);
    return c.json({ error: "Missing required fields" });
  }

  try {
    // 1. Create pending request record in Firestore
    await setFirestoreRequest(meetupId, userUid, userName, "pending");

    // 2. Add to meetup's pendingUids
    const meetup = await getFirestoreMeetup(meetupId);
    if (!meetup.pendingUids.includes(userUid)) {
      meetup.pendingUids.push(userUid);
    }
    if (fcmToken) {
      meetup.userFcmTokens[userUid] = fcmToken;
    }

    await updateFirestoreMeetup(meetup, ["pendingUids", "userFcmTokens"]);

    // 3. Send Notification to Host
    if (meetup.hostFcmToken) {
      const bodyText = `${userName} muốn xin vào kèo "${meetup.title}" chơi game ${meetup.game} của bạn.`;
      sendFCMNotification(
        meetup.hostFcmToken,
        "🎯 Yêu cầu tham gia kèo mới!",
        bodyText,
        `/#/manage/${meetupId}`
      ).catch((e) => console.error("FCM notify host failed:", e));
    }

    return c.json({
      success: true,
      message: "Đã gửi yêu cầu tham gia kèo và thông báo tới Host!",
    });
  } catch (err: any) {
    c.status(500);
    return c.json({ error: err.message });
  }
}

// POST /api/meetups/approve
export async function approveMember(c: Context) {
  let body: any;
  try {
    body = await c.req.json();
  } catch {
    c.status(400);
    return c.json({ error: "Invalid JSON body" });
  }

  const { meetupId, playerUid } = body;
  if (!meetupId || !playerUid) {
    c.status(400);
    return c.json({ error: "Missing required fields" });
  }

  try {
    // 1. Update request status to approved
    await updateFirestoreRequestStatus(meetupId, playerUid, "approved");

    // 2. Transfer from pendingUids to approvedPendingUids
    const meetup = await getFirestoreMeetup(meetupId);
    meetup.pendingUids = meetup.pendingUids.filter((uid) => uid !== playerUid);
    if (!meetup.approvedPendingUids.includes(playerUid)) {
      meetup.approvedPendingUids.push(playerUid);
    }

    await updateFirestoreMeetup(meetup, ["approvedPendingUids", "pendingUids"]);

    // 3. Send Push Notification to Player
    const playerToken = meetup.userFcmTokens[playerUid];
    if (playerToken) {
      const host = meetup.hostName || "Host";
      const bodyText = `Bạn đã được duyệt tham gia kèo "${meetup.title}" chơi game ${meetup.game} của ${host}! Hãy xác nhận tham gia kèo chính thức.`;
      sendFCMNotification(
        playerToken,
        "🎉 Yêu cầu đã được duyệt!",
        bodyText,
        `/#/manage/${meetupId}`
      ).catch((e) => console.error("FCM notify player failed:", e));
    }

    return c.json({
      success: true,
      message: "Đã duyệt thành viên và gửi thông báo!",
    });
  } catch (err: any) {
    c.status(500);
    return c.json({ error: err.message });
  }
}

// POST /api/meetups/confirm
export async function confirmParticipation(c: Context) {
  let body: any;
  try {
    body = await c.req.json();
  } catch {
    c.status(400);
    return c.json({ error: "Invalid JSON body" });
  }

  const { meetupId, userUid, userName } = body;
  if (!meetupId || !userUid || !userName) {
    c.status(400);
    return c.json({ error: "Missing required fields" });
  }

  try {
    // 1. Fetch meetup
    const meetup = await getFirestoreMeetup(meetupId);

    // 2. Transition from approvedPendingUids to approvedUids and increment player count
    meetup.approvedPendingUids = meetup.approvedPendingUids.filter((uid) => uid !== userUid);
    if (!meetup.approvedUids.includes(userUid)) {
      meetup.approvedUids.push(userUid);
      meetup.playersCount++;
    }

    await updateFirestoreMeetup(meetup, ["approvedUids", "approvedPendingUids", "playersCount"]);

    // 3. Notify everyone else (approved members + host)
    const targets = new Set<string>();
    for (const uid of meetup.approvedUids) {
      if (uid !== userUid) targets.add(uid);
    }
    if (meetup.hostUID && meetup.hostUID !== userUid) {
      targets.add(meetup.hostUID);
    }

    const bodyText = `${userName} đã xác nhận tham gia kèo "${meetup.title}" chơi game ${meetup.game}.`;
    for (const uid of targets) {
      let token = meetup.userFcmTokens[uid];
      if (!token && uid === meetup.hostUID) {
        token = meetup.hostFcmToken;
      }
      if (token) {
        sendFCMNotification(
          token,
          "➕ Kèo có thêm người chơi mới!",
          bodyText,
          `/#/manage/${meetupId}`
        ).catch((e) => console.error("FCM notify confirmed user failed:", e));
      }
    }

    return c.json({
      success: true,
      message: "Đã xác nhận vào kèo chính thức và thông báo tới mọi người!",
    });
  } catch (err: any) {
    c.status(500);
    return c.json({ error: err.message });
  }
}

// POST /api/meetups/leave
export async function leaveOrKickMember(c: Context) {
  let body: any;
  try {
    body = await c.req.json();
  } catch {
    c.status(400);
    return c.json({ error: "Invalid JSON body" });
  }

  const { meetupId, playerUid, playerName, isKick } = body;
  if (!meetupId || !playerUid || !playerName) {
    c.status(400);
    return c.json({ error: "Missing required fields" });
  }

  try {
    // 1. Delete request subcollection record
    await deleteFirestoreRequest(meetupId, playerUid);

    // 2. Load meetup and filter arrays
    const meetup = await getFirestoreMeetup(meetupId);

    const wasApproved = meetup.approvedUids.includes(playerUid);
    meetup.approvedUids = meetup.approvedUids.filter((uid) => uid !== playerUid);
    meetup.pendingUids = meetup.pendingUids.filter((uid) => uid !== playerUid);
    meetup.approvedPendingUids = meetup.approvedPendingUids.filter((uid) => uid !== playerUid);

    if (wasApproved && meetup.playersCount > 1) {
      meetup.playersCount--;
    }

    await updateFirestoreMeetup(meetup, [
      "approvedUids",
      "approvedPendingUids",
      "pendingUids",
      "playersCount",
    ]);

    // 3. Send notifications
    if (isKick) {
      // Host kick player -> notify player
      const playerToken = meetup.userFcmTokens[playerUid];
      if (playerToken) {
        const bodyText = `Host đã xóa bạn khỏi danh sách tham gia kèo "${meetup.title}".`;
        sendFCMNotification(playerToken, "✕ Bạn đã bị xóa khỏi kèo", bodyText, "/").catch((e) =>
          console.error("FCM notify kicked player failed:", e)
        );
      }

      // Notify other members
      const targets = new Set<string>();
      for (const uid of meetup.approvedUids) {
        if (uid !== playerUid) targets.add(uid);
      }
      if (meetup.hostUID && meetup.hostUID !== playerUid) {
        targets.add(meetup.hostUID);
      }

      const bodyText = `${playerName} đã không còn tham gia kèo "${meetup.title}".`;
      for (const uid of targets) {
        let token = meetup.userFcmTokens[uid];
        if (!token && uid === meetup.hostUID) {
          token = meetup.hostFcmToken;
        }
        if (token) {
          sendFCMNotification(token, "👋 Thành viên đã rời kèo", bodyText, `/#/manage/${meetupId}`).catch(
            (e) => console.error("FCM notify member left failed:", e)
          );
        }
      }
    } else {
      // Player left voluntarily -> notify host and other members
      const targets = new Set<string>();
      for (const uid of meetup.approvedUids) {
        if (uid !== playerUid) targets.add(uid);
      }
      if (meetup.hostUID && meetup.hostUID !== playerUid) {
        targets.add(meetup.hostUID);
      }

      const bodyText = `${playerName} đã rời khỏi kèo "${meetup.title}".`;
      for (const uid of targets) {
        let token = meetup.userFcmTokens[uid];
        if (!token && uid === meetup.hostUID) {
          token = meetup.hostFcmToken;
        }
        if (token) {
          sendFCMNotification(token, "🚪 Thành viên rời kèo", bodyText, `/#/manage/${meetupId}`).catch(
            (e) => console.error("FCM notify member left failed:", e)
          );
        }
      }
    }

    return c.json({
      success: true,
      message: "Đã xử lý rời kèo/kick và gửi thông báo thành công!",
    });
  } catch (err: any) {
    c.status(500);
    return c.json({ error: err.message });
  }
}
