import { useState, useEffect } from "react";

export function useBackendHealth() {
  const [apiStatus, setApiStatus] = useState<"online" | "offline" | "connecting">("connecting");
  const [apiMessage, setApiMessage] = useState<string>("Đang ping server Go...");
  const [apiCode, setApiCode] = useState<number | null>(null);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const API_BASE = import.meta.env.DEV ? (import.meta.env.VITE_API_URL || "") : "";

  async function checkBackendHealth() {
    setIsChecking(true);
    setApiStatus("connecting");
    setApiMessage("Đang ping server...");
    setApiCode(null);
    try {
      const res = await fetch(`${API_BASE}/api/health`);
      if (res.ok) {
        const data = await res.json();
        setApiStatus("online");
        setApiMessage(data.message || "API hoạt động tốt!");
        setApiCode(res.status);
      } else {
        setApiStatus("offline");
        setApiMessage(`Lỗi server: Code ${res.status}`);
        setApiCode(res.status);
      }
    } catch {
      setApiStatus("offline");
      setApiMessage("Mất kết nối API");
    } finally {
      setIsChecking(false);
    }
  }

  useEffect(() => {
    checkBackendHealth();
  }, []);

  return { apiStatus, apiMessage, apiCode, isChecking, checkBackendHealth };
}
export default useBackendHealth;
