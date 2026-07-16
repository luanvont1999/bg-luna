import { useState, useEffect } from "react";
import { collection, onSnapshot, doc, setDoc } from "firebase/firestore";
import { db, auth } from "../libs/firebase";

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
  },
];

export function useMeetupsRealtime() {
  const [allMeetups, setAllMeetups] = useState<any[]>([]);
  const [hasLoadedInitialMeetups, setHasLoadedInitialMeetups] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "meetups"),
      async (snapshot) => {
        try {
          if (snapshot.empty) {
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
            setAllMeetups(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
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
  }, []);

  return { allMeetups, isLoading: !hasLoadedInitialMeetups };
}
export default useMeetupsRealtime;
