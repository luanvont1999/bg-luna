import { getAccessToken } from "./notification.model.js";
import { FirestoreDocument, FirestoreField } from "./meetup.model.js";

export interface UserDocumentData {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  bio?: string;
  favoriteCategories?: string[];
  fcmTokens: string[];
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Reads user document from Firestore `/users/{uid}`
 */
export async function getFirestoreUser(uid: string): Promise<UserDocumentData | null> {
  const { accessToken, projectId } = await getAccessToken();
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${uid}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (res.status === 404) {
      return null;
    }

    if (!res.ok) {
      const text = await res.text();
      console.warn(`[User Model] Failed to get user ${uid}: ${res.status} - ${text}`);
      return null;
    }

    const doc = (await res.json()) as FirestoreDocument;
    const fields = doc.fields || {};

    const tokensSet = new Set<string>();
    const arrayVals = fields.fcmTokens?.arrayValue?.values || [];
    for (const item of arrayVals) {
      if (item.stringValue) tokensSet.add(item.stringValue);
    }
    if (fields.fcmToken?.stringValue) {
      tokensSet.add(fields.fcmToken.stringValue);
    }

    const categoriesVals = fields.favoriteCategories?.arrayValue?.values || [];
    const favoriteCategories = categoriesVals
      .map((item) => item.stringValue)
      .filter((v): v is string => Boolean(v));

    return {
      uid,
      email: fields.email?.stringValue || "",
      displayName: fields.displayName?.stringValue || "",
      photoURL: fields.photoURL?.stringValue || "",
      bio: fields.bio?.stringValue || "",
      favoriteCategories,
      fcmTokens: Array.from(tokensSet),
    };
  } catch (err: any) {
    console.error(`[User Model Error] Failed to fetch user ${uid}:`, err.message);
    return null;
  }
}

/**
 * Creates or updates user record on login/register with fcmToken deduplication
 */
export async function saveOrUpdateUserOnLogin(data: {
  uid: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
  fcmToken?: string;
}): Promise<UserDocumentData> {
  const { accessToken, projectId } = await getAccessToken();
  const { uid, email, displayName, photoURL, fcmToken } = data;

  const existingUser = await getFirestoreUser(uid);
  const nowStr = new Date().toISOString();

  const tokensSet = new Set<string>(existingUser?.fcmTokens || []);
  if (fcmToken && fcmToken.trim()) {
    tokensSet.add(fcmToken.trim());
  }
  const updatedTokens = Array.from(tokensSet);

  const updatedEmail = email || existingUser?.email || "";
  const updatedDisplayName =
    displayName || existingUser?.displayName || (updatedEmail ? updatedEmail.split("@")[0] : "Thành viên");
  const updatedPhotoUrl = photoURL || existingUser?.photoURL || "";

  const fields: Record<string, FirestoreField> = {
    uid: { stringValue: uid },
    displayName: { stringValue: updatedDisplayName },
    email: { stringValue: updatedEmail },
    photoURL: { stringValue: updatedPhotoUrl },
    fcmTokens: {
      arrayValue: {
        values: updatedTokens.map((t) => ({ stringValue: t })),
      },
    },
    updatedAt: { stringValue: nowStr },
  };

  if (!existingUser) {
    fields.createdAt = { stringValue: nowStr };
  } else {
    if (existingUser.bio) fields.bio = { stringValue: existingUser.bio };
    if (existingUser.favoriteCategories && existingUser.favoriteCategories.length > 0) {
      fields.favoriteCategories = {
        arrayValue: {
          values: existingUser.favoriteCategories.map((c) => ({ stringValue: c })),
        },
      };
    }
  }

  const updateMask = ["displayName", "email", "photoURL", "fcmTokens", "updatedAt"];
  if (!existingUser) updateMask.push("uid", "createdAt");

  const queryParams = updateMask.map((p) => `updateMask.fieldPaths=${encodeURIComponent(p)}`).join("&");
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${uid}?${queryParams}`;

  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ fields }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`[User Model] Failed to save/update user ${uid}: ${res.status} - ${text}`);
    throw new Error(`Failed to save/update user in Firestore: ${text}`);
  }

  console.log(`[User Model] ✅ Saved user ${uid} with ${updatedTokens.length} fcmToken(s).`);
  return {
    uid,
    email: updatedEmail,
    displayName: updatedDisplayName,
    photoURL: updatedPhotoUrl,
    fcmTokens: updatedTokens,
  };
}

/**
 * Removes a specific device's fcmToken from user record upon logout
 */
export async function removeUserFCMTokenOnLogout(uid: string, fcmToken?: string): Promise<boolean> {
  const { accessToken, projectId } = await getAccessToken();
  const existingUser = await getFirestoreUser(uid);

  if (!existingUser) {
    console.warn(`[User Model Logout] User ${uid} not found in Firestore.`);
    return false;
  }

  const tokenToRemove = fcmToken ? fcmToken.trim() : "";
  let updatedTokens = existingUser.fcmTokens;

  if (tokenToRemove) {
    updatedTokens = existingUser.fcmTokens.filter((t) => t !== tokenToRemove);
  }

  const nowStr = new Date().toISOString();
  const fields: Record<string, FirestoreField> = {
    fcmTokens: {
      arrayValue: {
        values: updatedTokens.map((t) => ({ stringValue: t })),
      },
    },
    updatedAt: { stringValue: nowStr },
  };

  const updateMask = ["fcmTokens", "updatedAt"];
  const queryParams = updateMask.map((p) => `updateMask.fieldPaths=${encodeURIComponent(p)}`).join("&");
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${uid}?${queryParams}`;

  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ fields }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`[User Model Logout] Failed to remove token for user ${uid}: ${res.status} - ${text}`);
    throw new Error(`Failed to update user tokens in Firestore: ${text}`);
  }

  console.log(`[User Model Logout] ✅ Removed token for user ${uid}. Remaining tokens: ${updatedTokens.length}`);
  return true;
}
