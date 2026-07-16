import { useState, useEffect } from "react";

export function useGPS() {
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);
  const [isTrackingGPS, setIsTrackingGPS] = useState<boolean>(false);
  const [gpsError, setGpsError] = useState<boolean>(false);

  useEffect(() => {
    if (navigator.geolocation) {
      setIsTrackingGPS(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLat(pos.coords.latitude);
          setUserLng(pos.coords.longitude);
          setIsTrackingGPS(false);
        },
        (err) => {
          console.warn("GPS failed:", err);
          setGpsError(true);
          setIsTrackingGPS(false);
        },
        { enableHighAccuracy: true }
      );
    } else {
      setGpsError(true);
    }
  }, []);

  return { userLat, userLng, isTrackingGPS, gpsError };
}
export default useGPS;
