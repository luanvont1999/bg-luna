import { useState, useEffect } from "react";
import { collection, onSnapshot, doc, setDoc, query, where } from "firebase/firestore";
import { db, auth } from "../libs/firebase";
import { calculateDistance, getMeetupCity } from "../utils/geo";
import { onAuthStateChanged } from "firebase/auth";

const SEED_MEETUPS = [
  {
    id: "1",
    title: "Hội Ma Sói Đêm Trăng Q1",
    game: "Ultimate Werewolf",
    hostName: "Minh Tuấn",
    hostUid: "default-host-1",
    lat: 10.7769,
    lng: 106.7009,
    playersCount: 11,
    playersNeeded: 15,
    time: "2026-07-10T19:30",
    color: "#bca0f5",
    city: "HCM" as const,
  },
  {
    id: "2",
    title: "Sân Chơi Mèo Nổ Q3",
    game: "Exploding Kittens",
    hostName: "Thanh Trúc",
    hostUid: "default-host-2",
    lat: 10.7828,
    lng: 106.6896,
    playersCount: 4,
    playersNeeded: 5,
    time: "2026-07-11T15:00",
    color: "#ffa4b2",
    city: "HCM" as const,
  },
  {
    id: "3",
    title: "CLB Cờ Tỷ Phú Bình Thạnh",
    game: "Monopoly Deal",
    hostName: "Khánh Huy",
    hostUid: "default-host-3",
    lat: 10.7981,
    lng: 106.7051,
    playersCount: 3,
    playersNeeded: 6,
    time: "2026-07-12T18:00",
    color: "#ffe869",
    city: "HCM" as const,
  },
  {
    id: "4",
    title: "Chiến Thần Catan Hoàn Kiếm",
    game: "Settlers of Catan",
    hostName: "Hoàng Lâm",
    hostUid: "default-host-4",
    lat: 21.0285,
    lng: 105.8542,
    playersCount: 2,
    playersNeeded: 4,
    time: "2026-07-11T19:00",
    color: "#9ee3b2",
    city: "HN" as const,
  },
  {
    id: "5",
    title: "Hội Avalon Tây Hồ",
    game: "Avalon",
    hostName: "Thu Giang",
    hostUid: "default-host-5",
    lat: 21.0588,
    lng: 105.8285,
    playersCount: 5,
    playersNeeded: 10,
    time: "2026-07-12T14:30",
    color: "#a4f0fd",
    city: "HN" as const,
  },
];

export function useMeetupsRealtime(
  selectedCities?: ("HCM" | "HN" | "OTHER")[],
  selectedDistance: string = "all",
  userLat: number | null = null,
  userLng: number | null = null
) {
  const [allMeetups, setAllMeetups] = useState<any[]>([]);
  const [hasLoadedInitialMeetups, setHasLoadedInitialMeetups] = useState<boolean>(false);
  const [authUid, setAuthUid] = useState<string | null>(auth.currentUser?.uid || null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthUid(user?.uid || null);
    });
    return unsubscribe;
  }, []);

  const citiesKey = selectedCities ? JSON.stringify(selectedCities) : "";

  useEffect(() => {
    let q: any = collection(db, "meetups");
    
    // Server-side Firestore query optimization:
    // - If selectedCities is empty, we don't query Firestore (directly set empty list in snapshot)
    // - If selectedCities is less than 3, query only those cities to minimize network payload
    // - If selectedCities is all 3, query all docs (safest & includes docs without city field)
    if (selectedCities && selectedCities.length > 0 && selectedCities.length < 3) {
      q = query(collection(db, "meetups"), where("city", "in", selectedCities));
    }

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        try {
          if (selectedCities && selectedCities.length === 0) {
            setAllMeetups([]);
            setHasLoadedInitialMeetups(true);
            return;
          }

          if (snapshot.empty) {
            // Seed logic
            if (auth.currentUser) {
              for (const seed of SEED_MEETUPS) {
                try {
                  await setDoc(doc(db, "meetups", seed.id), seed);
                } catch (e) {
                  console.warn("[Firestore] Seed failed:", e);
                }
              }
            } else {
              setAllMeetups(SEED_MEETUPS);
            }
          } else {
            const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
            
            // Client-side filtering
            const filtered = list.filter((m: any) => {
              if (selectedCities && selectedCities.length > 0) {
                const calculatedCity = m.city || getMeetupCity(m);
                if (!selectedCities.includes(calculatedCity)) return false;
              }
              
              if (selectedDistance !== "all" && userLat !== null && userLng !== null) {
                const lat = m.lat !== undefined ? m.lat : 0;
                const lng = m.lng !== undefined ? m.lng : 0;
                const dist = calculateDistance(userLat, userLng, lat, lng);
                return dist <= parseFloat(selectedDistance);
              }
              return true;
            });

            setAllMeetups(filtered);
          }
        } catch (e) {
          console.error("[Firestore] snapshot process error:", e);
          setAllMeetups((prev) => (prev.length === 0 ? SEED_MEETUPS : prev));
        } finally {
          setHasLoadedInitialMeetups(true);
        }
      },
      (err) => {
        console.error("[Firestore] meetups subscription error:", err);
        setAllMeetups((prev) => (prev.length === 0 ? SEED_MEETUPS : prev));
        setHasLoadedInitialMeetups(true);
      }
    );

    return unsubscribe;
  }, [citiesKey, selectedDistance, userLat, userLng, authUid]);

  return { allMeetups, isLoading: !hasLoadedInitialMeetups };
}
export default useMeetupsRealtime;
