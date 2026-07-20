import { Request, Response } from "express";
import { FirebaseUser } from "../middleware/auth.js";
import {
  meetupStore,
  getFirestoreMeetup,
  updateFirestoreMeetup,
  setFirestoreRequest,
  getFirestoreRequest,
  updateFirestoreRequestStatus,
  deleteFirestoreRequest,
  Meetup,
  getFirestoreAllMeetups,
} from "../models/meetup.model.js";
import { sendFCMNotification, getUserFCMToken } from "../models/notification.model.js";

// GET /api/meetups
export async function getAllMeetups(req: Request, res: Response) {
  try {
    const list = await getFirestoreAllMeetups();
    res.json(list);
  } catch (err: any) {
    console.error("[Backend REST] Failed to get all meetups:", err);
    res.status(500).json({ error: "Lỗi kết nối Firestore: " + err.message });
  }
}

// POST /api/meetups/create
export async function createMeetup(req: Request, res: Response) {
  const user = (req as any).firebase_user as FirebaseUser;
  const body = req.body;

  const { title, game, lat, lng, time, playersCount, playersNeeded } = body;
  if (!title || !game || !lat || !lng || !time) {
    res.status(400).json({ error: "Missing required fields (title, game, lat, lng, time)" });
    return;
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
    players_count: parseInt(playersCount) || 1,
    players_needed: parseInt(playersNeeded) || 4,
    time,
    color,
  };

  meetupStore.add(newMeetup);
  console.log(`[Meetups] Created new meetup: ${newMeetup.title} by ${newMeetup.host_name}`);

  res.status(201).json(newMeetup);
}

// POST /api/meetups/join
export async function joinMeetup(req: Request, res: Response) {
  const body = req.body;

  const { meetupId, userUid, userName, participantCount, message } = body;
  if (!meetupId || !userUid || !userName) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  const pCount = Math.max(1, parseInt(participantCount) || 1);
  const msg = typeof message === "string" ? message.trim() : "";

  try {
    // 1. Create pending request record in Firestore
    await setFirestoreRequest(meetupId, userUid, userName, "pending", pCount, msg);

    // 2. Add to meetup's pendingUids
    const meetup = await getFirestoreMeetup(meetupId);
    if (!meetup.pendingUids.includes(userUid)) {
      meetup.pendingUids.push(userUid);
    }

    await updateFirestoreMeetup(meetup, ["pendingUids"]);

    // 3. Send Notification to Host (Get token dynamically)
    if (meetup.hostUID) {
      const hostToken = await getUserFCMToken(meetup.hostUID);
      if (hostToken) {
        const countStr = pCount > 1 ? ` (${pCount} người)` : "";
        const msgStr = msg ? ` - Lời nhắn: "${msg}"` : "";
        const bodyText = `${userName}${countStr} muốn xin vào kèo "${meetup.title}" chơi game ${meetup.game} của bạn.${msgStr}`;
        sendFCMNotification(
          hostToken,
          "🎯 Yêu cầu tham gia kèo mới!",
          bodyText,
          `/#/manage/${meetupId}`
        ).catch((e) => console.error("FCM notify host failed:", e));
      }
    }

    res.json({
      success: true,
      message: "Đã gửi yêu cầu tham gia kèo và thông báo tới Host!",
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

// POST /api/meetups/approve
export async function approveMember(req: Request, res: Response) {
  const body = req.body;

  const { meetupId, playerUid } = body;
  if (!meetupId || !playerUid) {
    res.status(400).json({ error: "Missing required fields" });
    return;
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

    // 3. Send Push Notification to Player (Get token dynamically)
    const playerToken = await getUserFCMToken(playerUid);
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

    res.json({
      success: true,
      message: "Đã duyệt thành viên và gửi thông báo!",
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

// POST /api/meetups/confirm
export async function confirmParticipation(req: Request, res: Response) {
  const body = req.body;

  const { meetupId, userUid, userName } = body;
  if (!meetupId || !userUid || !userName) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  try {
    // 1. Fetch meetup and user's request details
    const meetup = await getFirestoreMeetup(meetupId);
    const reqData = await getFirestoreRequest(meetupId, userUid);
    const addedSlots = reqData?.participantCount || 1;

    // 2. Transition from approvedPendingUids to approvedUids and increment player count by participantCount
    meetup.approvedPendingUids = meetup.approvedPendingUids.filter((uid) => uid !== userUid);
    if (!meetup.approvedUids.includes(userUid)) {
      meetup.approvedUids.push(userUid);
      meetup.playersCount += addedSlots;
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

    const countStr = addedSlots > 1 ? ` (${addedSlots} người)` : "";
    const bodyText = `${userName}${countStr} đã xác nhận tham gia kèo "${meetup.title}" chơi game ${meetup.game}.`;
    for (const uid of targets) {
      // Get token dynamically for each member
      getUserFCMToken(uid).then((token) => {
        if (token) {
          sendFCMNotification(
            token,
            "➕ Kèo có thêm người chơi mới!",
            bodyText,
            `/#/manage/${meetupId}`
          ).catch((e) => console.error("FCM notify confirmed user failed:", e));
        }
      }).catch((err) => console.error(`Failed to get FCM token for notifying user ${uid}:`, err));
    }

    res.json({
      success: true,
      message: "Đã xác nhận vào kèo chính thức và thông báo tới mọi người!",
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

// POST /api/meetups/leave
export async function leaveOrKickMember(req: Request, res: Response) {
  const body = req.body;

  const { meetupId, playerUid, playerName, isKick } = body;
  if (!meetupId || !playerUid || !playerName) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  try {
    // 1. Get request data before deletion to know participantCount
    const reqData = await getFirestoreRequest(meetupId, playerUid);
    const removedSlots = reqData?.participantCount || 1;

    // 2. Delete request subcollection record
    await deleteFirestoreRequest(meetupId, playerUid);

    // 3. Load meetup and filter arrays
    const meetup = await getFirestoreMeetup(meetupId);

    const wasApproved = meetup.approvedUids.includes(playerUid);
    meetup.approvedUids = meetup.approvedUids.filter((uid) => uid !== playerUid);
    meetup.pendingUids = meetup.pendingUids.filter((uid) => uid !== playerUid);
    meetup.approvedPendingUids = meetup.approvedPendingUids.filter((uid) => uid !== playerUid);

    if (wasApproved) {
      meetup.playersCount = Math.max(1, meetup.playersCount - removedSlots);
    }

    await updateFirestoreMeetup(meetup, [
      "approvedUids",
      "approvedPendingUids",
      "pendingUids",
      "playersCount",
    ]);

    // 3. Send notifications (Get tokens dynamically)
    if (isKick) {
      // Host kick player -> notify player
      getUserFCMToken(playerUid).then((playerToken) => {
        if (playerToken) {
          const bodyText = `Host đã xóa bạn khỏi danh sách tham gia kèo "${meetup.title}".`;
          sendFCMNotification(playerToken, "✕ Bạn đã bị xóa khỏi kèo", bodyText, "/").catch((e) =>
            console.error("FCM notify kicked player failed:", e)
          );
        }
      }).catch((err) => console.error("Failed to get FCM token for kicked player:", err));

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
        getUserFCMToken(uid).then((token) => {
          if (token) {
            sendFCMNotification(token, "👋 Thành viên đã rời kèo", bodyText, `/#/manage/${meetupId}`).catch(
              (e) => console.error("FCM notify member left failed:", e)
            );
          }
        }).catch((err) => console.error(`Failed to get FCM token for notifying member ${uid}:`, err));
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
        getUserFCMToken(uid).then((token) => {
          if (token) {
            sendFCMNotification(token, "🚪 Thành viên rời kèo", bodyText, `/#/manage/${meetupId}`).catch(
              (e) => console.error("FCM notify member left failed:", e)
            );
          }
        }).catch((err) => console.error(`Failed to get FCM token for notifying member ${uid}:`, err));
      }
    }

    res.json({
      success: true,
      message: "Đã xử lý rời kèo/kick và gửi thông báo thành công!",
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
