import { useState, useEffect } from "react";

export function usePWAInstall(addToast: (msg: string, type: "success" | "error" | "info") => void) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState<boolean>(false);
  const [showIOSInstallInstructions, setShowIOSInstallInstructions] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);

  useEffect(() => {
    // Check iOS environment
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    const isStandaloneMode =
      window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone;
    setIsStandalone(isStandaloneMode);

    const bannerShown = localStorage.getItem("pwa_banner_shown");
    if (!bannerShown) {
      setShowInstallBanner(true);
      localStorage.setItem("pwa_banner_shown", "true");
    }

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      addToast("Cài đặt ứng dụng thành công!", "success");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  async function triggerPWAInstall() {
    if (isIOS && !isStandalone) {
      setShowIOSInstallInstructions(true);
      return;
    }

    if (!deferredPrompt) {
      addToast(
        "Trình duyệt không hỗ trợ cài đặt tự động hoặc ứng dụng đã được tải về. Vui lòng thêm thủ công từ menu trình duyệt!",
        "info"
      );
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`Lựa chọn cài đặt PWA: ${outcome}`);
    if (outcome === "accepted") {
      setDeferredPrompt(null);
    }
  }

  return {
    deferredPrompt,
    showInstallBanner,
    showIOSInstallInstructions,
    isIOS,
    isStandalone,
    setShowInstallBanner,
    setShowIOSInstallInstructions,
    triggerPWAInstall,
  };
}
export default usePWAInstall;
