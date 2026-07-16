import { 
  collection, 
  onSnapshot
} from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { db } from '../libs/firebase';

export interface MeetupRequest {
  uid: string;
  name: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt?: any;
}

const API_BASE = import.meta.env.DEV ? (import.meta.env.VITE_API_URL || '') : '';

/**
 * Checks if a user is an approved member or host of a meetup
 */
export function isApprovedMember(meetup: any, userUid: string | null | undefined): boolean {
  if (!userUid || !meetup) return false;
  const hostUid = meetup.hostUid || meetup.host_uid;
  if (userUid === hostUid) return true;
  if (Array.isArray(meetup.approvedUids) && meetup.approvedUids.includes(userUid)) {
    return true;
  }
  return false;
}

/**
 * Checks if user is the creator/host of the meetup
 */
export function isHost(meetup: any, userUid: string | null | undefined): boolean {
  if (!userUid || !meetup) return false;
  const hostUid = meetup.hostUid || meetup.host_uid;
  return userUid === hostUid;
}

/**
 * Player sends a join request to a meetup (called via Go Backend)
 */
export async function requestToJoin(meetupId: string, user: User) {
  const name = user.displayName || user.email || 'Thành viên';

  const res = await fetch(`${API_BASE}/api/meetups/join`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      meetupId,
      userUid: user.uid,
      userName: name
    })
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gửi yêu cầu tham gia thất bại: ${text}`);
  }
}

/**
 * Player cancels their pending join request (calls leave API via Go Backend)
 */
export async function cancelJoinRequest(meetupId: string, userUid: string) {
  const res = await fetch(`${API_BASE}/api/meetups/leave`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      meetupId,
      playerUid: userUid,
      playerName: 'Thành viên',
      isKick: false
    })
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Hủy yêu cầu tham gia thất bại: ${text}`);
  }
}

/**
 * Host approves a pending player to join the meetup (calls approve API via Go Backend)
 */
export async function approveMember(meetupId: string, playerUid: string) {
  const res = await fetch(`${API_BASE}/api/meetups/approve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      meetupId,
      playerUid
    })
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Duyệt thành viên thất bại: ${text}`);
  }
}

/**
 * Host rejects a pending player request (calls leave API via Go Backend)
 */
export async function rejectMember(meetupId: string, playerUid: string) {
  const res = await fetch(`${API_BASE}/api/meetups/leave`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      meetupId,
      playerUid,
      playerName: 'Thành viên',
      isKick: true
    })
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Từ chối thành viên thất bại: ${text}`);
  }
}

/**
 * Host kicks an approved member OR member leaves the meetup (calls leave API via Go Backend)
 */
export async function kickOrLeaveMember(meetupId: string, playerUid: string, playerName: string = 'Thành viên', isKick: boolean = false) {
  const res = await fetch(`${API_BASE}/api/meetups/leave`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      meetupId,
      playerUid,
      playerName,
      isKick
    })
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Rời/Kick thành viên thất bại: ${text}`);
  }
}

/**
 * Player confirms their participation to formally join the meetup (calls confirm API via Go Backend)
 */
export async function confirmParticipation(meetupId: string, userUid: string, userName: string) {
  const res = await fetch(`${API_BASE}/api/meetups/confirm`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      meetupId,
      userUid,
      userName
    })
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Xác nhận tham gia kèo thất bại: ${text}`);
  }
}

/**
 * Realtime subscription to all requests of a meetup
 */
export function subscribeToMeetupRequests(
  meetupId: string, 
  callback: (requests: MeetupRequest[]) => void
) {
  const reqsRef = collection(db, 'meetups', meetupId, 'requests');
  return onSnapshot(reqsRef, (snapshot) => {
    const list = snapshot.docs.map(docSnap => ({
      uid: docSnap.id,
      ...docSnap.data()
    })) as MeetupRequest[];
    callback(list);
  }, (err) => {
    console.error('[MeetupService] Requests listener error:', err);
  });
}
