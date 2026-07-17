import { useState, useEffect } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db, auth } from "../libs/firebase";
import { calculateDistance, getMeetupCity } from "../utils/geo";
import { onAuthStateChanged } from "firebase/auth";

export function useMeetupsRealtime(
  selectedCities?: ("HCM" | "HN" | "OTHER")[],
  selectedDistance: string = "all",
  userLat: number | null = null,
  userLng: number | null = null,
  sortBy: "time" | "distance" = "time"
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
            
            // Client-side sorting
            filtered.sort((a: any, b: any) => {
              if (sortBy === "distance" && userLat !== null && userLng !== null) {
                const distA = calculateDistance(userLat, userLng, a.lat || 0, a.lng || 0);
                const distB = calculateDistance(userLat, userLng, b.lat || 0, b.lng || 0);
                return distA - distB;
              } else {
                const timeA = new Date(a.time || 0).getTime();
                const timeB = new Date(b.time || 0).getTime();
                return timeA - timeB;
              }
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
      async (err) => {
        console.warn("[Firestore] meetups subscription error, falling back to REST API:", err);
        try {
          const API_BASE = import.meta.env.DEV ? (import.meta.env.VITE_API_URL || "") : "";
          const res = await fetch(`${API_BASE}/api/meetups`);
          if (res.ok) {
            const list = await res.json();
            
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
            
            // Client-side sorting for fallback
            filtered.sort((a: any, b: any) => {
              if (sortBy === "distance" && userLat !== null && userLng !== null) {
                const distA = calculateDistance(userLat, userLng, a.lat || 0, a.lng || 0);
                const distB = calculateDistance(userLat, userLng, b.lat || 0, b.lng || 0);
                return distA - distB;
              } else {
                const timeA = new Date(a.time || 0).getTime();
                const timeB = new Date(b.time || 0).getTime();
                return timeA - timeB;
              }
            });

            setAllMeetups(filtered);
          } else {
            setAllMeetups([]);
          }
        } catch (fetchErr) {
          console.error("[Firestore Fallback] Failed to fetch meetups from API:", fetchErr);
          setAllMeetups([]);
        } finally {
          setHasLoadedInitialMeetups(true);
        }
      }
    );

    return unsubscribe;
  }, [citiesKey, selectedDistance, userLat, userLng, authUid, sortBy]);

  return { allMeetups, isLoading: !hasLoadedInitialMeetups };
}
export default useMeetupsRealtime;
