import { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db, auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";

export interface UserProfile {
  uid: string;
  displayName: string;
  bio: string;
  favoriteCategories: string[];
  loaded: boolean;
}

const defaultProfile: UserProfile = {
  uid: "",
  displayName: "",
  bio: "",
  favoriteCategories: [],
  loaded: false,
};

let _profile: UserProfile = { ...defaultProfile };
let _isLoading = false;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((fn) => fn());
}

class UserProfileState {
  get profile() {
    return _profile;
  }

  get isLoading() {
    return _isLoading;
  }

  constructor() {
    if (typeof window !== "undefined") {
      onAuthStateChanged(auth, async (user) => {
        if (user) {
          const isUserChanged = _profile.uid !== user.uid;
          _profile.uid = user.uid;
          if (isUserChanged || !_profile.loaded) {
            await this.fetchProfile(user.uid, user.displayName);
          }
        } else {
          _profile = { ...defaultProfile };
          notify();
        }
      });
    }
  }

  async fetchProfile(uid: string, defaultDisplayName?: string | null) {
    _isLoading = true;
    notify();
    try {
      const docRef = doc(db, "users", uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        _profile = {
          uid,
          displayName: data.displayName || defaultDisplayName || "",
          bio: data.bio || "",
          favoriteCategories: data.favoriteCategories || [],
          loaded: true,
        };
      } else {
        _profile = {
          uid,
          displayName: defaultDisplayName || "",
          bio: "",
          favoriteCategories: [],
          loaded: true,
        };
      }
    } catch (err) {
      console.error("Lỗi tải thông tin user profile:", err);
    } finally {
      _isLoading = false;
      notify();
    }
  }

  async updateProfile(data: { displayName: string; bio: string; favoriteCategories: string[] }) {
    if (!_profile.uid) return;
    _isLoading = true;
    notify();
    try {
      const docRef = doc(db, "users", _profile.uid);
      await setDoc(docRef, {
        displayName: data.displayName,
        bio: data.bio,
        favoriteCategories: data.favoriteCategories,
        updatedAt: new Date(),
      }, { merge: true });

      _profile = {
        uid: _profile.uid,
        displayName: data.displayName,
        bio: data.bio,
        favoriteCategories: data.favoriteCategories,
        loaded: true,
      };
    } catch (err) {
      console.error("Lỗi cập nhật user profile:", err);
      throw err;
    } finally {
      _isLoading = false;
      notify();
    }
  }
}

export const userProfileState = new UserProfileState();

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile>(_profile);
  const [isLoading, setIsLoading] = useState<boolean>(_isLoading);

  useEffect(() => {
    const handleUpdate = () => {
      setProfile({ ..._profile });
      setIsLoading(_isLoading);
    };

    listeners.add(handleUpdate);
    return () => {
      listeners.delete(handleUpdate);
    };
  }, []);

  return { profile, isLoading, userProfileState };
}
