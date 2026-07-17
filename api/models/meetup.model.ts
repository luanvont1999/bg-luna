import { getAccessToken } from "./notification.model.js";

export interface Meetup {
  id: string;
  title: string;
  game: string;
  host_name: string;
  host_uid: string;
  lat: number;
  lng: number;
  players_count: number;
  players_needed: number;
  time: string;
  color: string;
}

export interface FirestoreField {
  stringValue?: string;
  integerValue?: string;
  arrayValue?: { values: FirestoreField[] };
  mapValue?: { fields: Record<string, FirestoreField> };
}

export interface FirestoreDocument {
  name?: string;
  fields: Record<string, FirestoreField>;
}

export interface MeetupData {
  id: string;
  title: string;
  game: string;
  hostName: string;
  hostUID: string;
  hostFcmToken: string;
  playersCount: number;
  playersNeeded: number;
  time: string;
  color: string;
  pendingUids: string[];
  approvedPendingUids: string[];
  approvedUids: string[];
  userFcmTokens: Record<string, string>;
}

// In-Memory fallback store
export class MeetupStore {
  private meetups: Meetup[] = [
    {
      id: "1",
      title: "Hội Ma Sói Đêm Trăng Q1",
      game: "Ultimate Werewolf",
      host_name: "Minh Tuấn",
      host_uid: "default-host-1",
      lat: 10.7769,
      lng: 106.7009,
      players_count: 11,
      players_needed: 15,
      time: "2026-07-10T19:30",
      color: "#bca0f5",
    },
    {
      id: "2",
      title: "Sân Chơi Mèo Nổ Q3",
      game: "Exploding Kittens",
      host_name: "Thanh Trúc",
      host_uid: "default-host-2",
      lat: 10.7828,
      lng: 106.6896,
      players_count: 4,
      players_needed: 5,
      time: "2026-07-11T15:00",
      color: "#ffa4b2",
    },
    {
      id: "3",
      title: "CLB Cờ Tỷ Phú Bình Thạnh",
      game: "Monopoly Deal",
      host_name: "Khánh Huy",
      host_uid: "default-host-3",
      lat: 10.7981,
      lng: 106.7051,
      players_count: 3,
      players_needed: 6,
      time: "2026-07-12T18:00",
      color: "#ffe869",
    },
    {
      id: "4",
      title: "Chiến Thần Catan Hoàn Kiếm",
      game: "Settlers of Catan",
      host_name: "Hoàng Lâm",
      host_uid: "default-host-4",
      lat: 21.0285,
      lng: 105.8542,
      players_count: 2,
      players_needed: 4,
      time: "2026-07-11T19:00",
      color: "#9ee3b2",
    },
    {
      id: "5",
      title: "Hội Avalon Tây Hồ",
      game: "Avalon",
      host_name: "Thu Giang",
      host_uid: "default-host-5",
      lat: 21.0588,
      lng: 105.8285,
      players_count: 5,
      players_needed: 10,
      time: "2026-07-12T14:30",
      color: "#a4f0fd",
    },
  ];

  public getAll(): Meetup[] {
    return [...this.meetups];
  }

  public add(meetup: Meetup): void {
    this.meetups.push(meetup);
  }
}

export const meetupStore = new MeetupStore();

// REST Helper payload functions
export function parseFirestoreDocument(doc: FirestoreDocument): MeetupData {
  const fields = doc.fields || {};
  const m: MeetupData = {
    id: "",
    title: "",
    game: "",
    hostName: "",
    hostUID: "",
    hostFcmToken: "",
    playersCount: 1,
    playersNeeded: 4,
    time: "",
    color: "",
    pendingUids: [],
    approvedPendingUids: [],
    approvedUids: [],
    userFcmTokens: {},
  };

  if (doc.name) {
    const parts = doc.name.split("/");
    m.id = parts[parts.length - 1];
  }

  m.title = fields.title?.stringValue || "";
  m.game = fields.game?.stringValue || "";
  m.hostName = fields.hostName?.stringValue || fields.host_name?.stringValue || "";
  m.hostUID = fields.hostUid?.stringValue || fields.host_uid?.stringValue || "";
  m.hostFcmToken = fields.hostFcmToken?.stringValue || "";
  m.playersCount = parseInt(fields.playersCount?.integerValue || fields.players_count?.integerValue || "1");
  m.playersNeeded = parseInt(fields.playersNeeded?.integerValue || fields.players_needed?.integerValue || "4");
  m.time = fields.time?.stringValue || "";
  m.color = fields.color?.stringValue || "";

  if (fields.pendingUids?.arrayValue?.values) {
    m.pendingUids = fields.pendingUids.arrayValue.values
      .map((v) => v.stringValue || "")
      .filter(Boolean);
  }
  if (fields.approvedPendingUids?.arrayValue?.values) {
    m.approvedPendingUids = fields.approvedPendingUids.arrayValue.values
      .map((v) => v.stringValue || "")
      .filter(Boolean);
  }
  if (fields.approvedUids?.arrayValue?.values) {
    m.approvedUids = fields.approvedUids.arrayValue.values
      .map((v) => v.stringValue || "")
      .filter(Boolean);
  }

  if (fields.userFcmTokens?.mapValue?.fields) {
    const tokenMap = fields.userFcmTokens.mapValue.fields;
    for (const key of Object.keys(tokenMap)) {
      if (tokenMap[key]?.stringValue) {
        m.userFcmTokens[key] = tokenMap[key].stringValue!;
      }
    }
  }

  return m;
}

export function buildFirestoreDocument(m: MeetupData): FirestoreDocument {
  const fields: Record<string, FirestoreField> = {
    title: { stringValue: m.title },
    game: { stringValue: m.game },
    hostName: { stringValue: m.hostName },
    hostUid: { stringValue: m.hostUID },
    hostFcmToken: { stringValue: m.hostFcmToken },
    playersCount: { integerValue: m.playersCount.toString() },
    playersNeeded: { integerValue: m.playersNeeded.toString() },
    time: { stringValue: m.time },
    color: { stringValue: m.color },
    pendingUids: {
      arrayValue: {
        values: m.pendingUids.map((uid) => ({ stringValue: uid })),
      },
    },
    approvedPendingUids: {
      arrayValue: {
        values: m.approvedPendingUids.map((uid) => ({ stringValue: uid })),
      },
    },
    approvedUids: {
      arrayValue: {
        values: m.approvedUids.map((uid) => ({ stringValue: uid })),
      },
    },
  };

  const tokenFields: Record<string, FirestoreField> = {};
  for (const key of Object.keys(m.userFcmTokens)) {
    tokenFields[key] = { stringValue: m.userFcmTokens[key] };
  }
  fields.userFcmTokens = { mapValue: { fields: tokenFields } };

  return { fields };
}

// REST API calls
export async function getFirestoreMeetup(meetupId: string): Promise<MeetupData> {
  const { accessToken, projectId } = await getAccessToken();
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/meetups/${meetupId}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Firestore read failed status ${res.status}: ${text}`);
    }

    const doc = (await res.json()) as FirestoreDocument;
    return parseFirestoreDocument(doc);
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === "AbortError") {
      throw new Error("Yêu cầu đọc Firestore bị quá thời gian (5s timeout)");
    }
    throw err;
  }
}

export async function updateFirestoreMeetup(m: MeetupData, updateFields: string[]): Promise<void> {
  const { accessToken, projectId } = await getAccessToken();
  const fullDoc = buildFirestoreDocument(m);

  const filteredFields: Record<string, FirestoreField> = {};
  for (const field of updateFields) {
    if (fullDoc.fields[field] !== undefined) {
      filteredFields[field] = fullDoc.fields[field];
    }
  }

  const doc = { fields: filteredFields };
  const queryParams = new URLSearchParams();
  for (const field of updateFields) {
    queryParams.append("updateMask.fieldPaths", field);
  }

  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/meetups/${m.id}?${queryParams.toString()}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(doc),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Firestore patch failed status ${res.status}: ${text}`);
    }
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === "AbortError") {
      throw new Error("Yêu cầu cập nhật Firestore bị quá thời gian (5s timeout)");
    }
    throw err;
  }
}

export async function setFirestoreRequest(
  meetupId: string,
  userUid: string,
  userName: string,
  status: string
): Promise<void> {
  const { accessToken, projectId } = await getAccessToken();
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/meetups/${meetupId}/requests/${userUid}`;

  const doc = {
    fields: {
      uid: { stringValue: userUid },
      name: { stringValue: userName },
      status: { stringValue: status },
    },
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(doc),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Firestore set request failed status ${res.status}: ${text}`);
    }
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === "AbortError") {
      throw new Error("Yêu cầu gửi yêu cầu tham gia Firestore bị quá thời gian (5s timeout)");
    }
    throw err;
  }
}

export async function updateFirestoreRequestStatus(
  meetupId: string,
  userUid: string,
  status: string
): Promise<void> {
  const { accessToken, projectId } = await getAccessToken();
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/meetups/${meetupId}/requests/${userUid}?updateMask.fieldPaths=status`;

  const doc = {
    fields: {
      status: { stringValue: status },
    },
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(doc),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Firestore update request status failed: ${text}`);
    }
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === "AbortError") {
      throw new Error("Yêu cầu cập nhật trạng thái yêu cầu trên Firestore bị quá thời gian (5s timeout)");
    }
    throw err;
  }
}

export async function deleteFirestoreRequest(meetupId: string, userUid: string): Promise<void> {
  const { accessToken, projectId } = await getAccessToken();
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/meetups/${meetupId}/requests/${userUid}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch(url, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok && res.status !== 404) {
      const text = await res.text();
      throw new Error(`Firestore delete request failed status ${res.status}: ${text}`);
    }
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === "AbortError") {
      throw new Error("Yêu cầu xoá yêu cầu tham gia trên Firestore bị quá thời gian (5s timeout)");
    }
    throw err;
  }
}

export async function getFirestoreAllMeetups(): Promise<any[]> {
  const { accessToken, projectId } = await getAccessToken();
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/meetups`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    if (res.status === 404) return [];
    const text = await res.text();
    throw new Error(`Firestore list failed status ${res.status}: ${text}`);
  }

  const data = (await res.json()) as { documents?: FirestoreDocument[] };
  if (!data.documents) return [];

  return data.documents.map((doc) => {
    const parsed = parseFirestoreDocument(doc);
    
    const latVal = doc.fields.lat;
    let lat = 0;
    if (latVal) {
      lat = latVal.integerValue ? parseInt(latVal.integerValue) : (latVal.doubleValue !== undefined ? latVal.doubleValue : (latVal.stringValue ? parseFloat(latVal.stringValue) : 0));
    }

    const lngVal = doc.fields.lng;
    let lng = 0;
    if (lngVal) {
      lng = lngVal.integerValue ? parseInt(lngVal.integerValue) : (lngVal.doubleValue !== undefined ? lngVal.doubleValue : (lngVal.stringValue ? parseFloat(lngVal.stringValue) : 0));
    }

    const city = doc.fields.city?.stringValue || "";

    return {
      id: parsed.id,
      title: parsed.title,
      game: parsed.game,
      hostName: parsed.hostName,
      hostUid: parsed.hostUID,
      lat,
      lng,
      city,
      playersCount: parsed.playersCount,
      playersNeeded: parsed.playersNeeded,
      time: parsed.time,
      color: parsed.color,
      pendingUids: parsed.pendingUids,
      approvedPendingUids: parsed.approvedPendingUids,
      approvedUids: parsed.approvedUids,
      userFcmTokens: parsed.userFcmTokens,
    };
  });
}
