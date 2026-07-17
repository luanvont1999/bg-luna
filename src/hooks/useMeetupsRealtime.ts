import { useState, useEffect } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db, auth } from "../libs/firebase";
import { calculateDistance, getMeetupCity } from "../utils/geo";
import { onAuthStateChanged } from "firebase/auth";

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
            setAllMeetups([]);
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
          setAllMeetups((prev) => (prev.length === 0 ? [] : prev));
        } finally {
          setHasLoadedInitialMeetups(true);
        }
      },
      (err) => {
        console.error("[Firestore] meetups subscription error:", err);
        setAllMeetups((prev) => (prev.length === 0 ? [] : prev));
        setHasLoadedInitialMeetups(true);
      }
    );

    return unsubscribe;
  }, [citiesKey, selectedDistance, userLat, userLng, authUid]);

  return { allMeetups, isLoading: !hasLoadedInitialMeetups };
}
export default useMeetupsRealtime;
