import React, { useState, useEffect, useMemo, useRef } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "./libs/firebase";
import {
  useRoute,
  navigateToTab,
  isChildRoute,
} from "./libs/router";
import { initNotifications } from "./api/notificationService";

// Custom Hooks
import useGPS from "./hooks/useGPS";
import usePWAInstall from "./hooks/usePWAInstall";
import useMeetupsRealtime from "./hooks/useMeetupsRealtime";
import useBackendHealth from "./hooks/useBackendHealth";

// Subcomponents
import Navbar from "./components/Navbar";
import MobileTabBar from "./components/MobileTabBar";
import InstallPWABanner from "./components/InstallPWABanner";
import IOSInstallModal from "./components/IOSInstallModal";
import ToastContainer from "./components/ToastContainer";

// Route components
import FindRoute from "./routes/FindRoute";
import CreateRoute from "./routes/CreateRoute";
import ProfileRoute from "./routes/ProfileRoute";
import MyMeetupsRoute from "./routes/MyMeetupsRoute";
import MapRoute from "./routes/MapRoute";
import FilterRoute from "./routes/FilterRoute";
import ChatRoute from "./routes/ChatRoute";
import ChatsListRoute from "./routes/ChatsListRoute";
import ManageRoute from "./routes/ManageRoute";

import { calculateDistance, getMeetupCity } from "./utils/geo";

interface Toast {
  id: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
}

export default function App() {
  const route = useRoute();
  const childRoute = isChildRoute(route.name);

  // Realtime meetups feed
  const { allMeetups, isLoading: isMeetupsLoading } = useMeetupsRealtime();

  // Auth User state
  const [currentUser, setCurrentUser] = useState<User | null>(auth.currentUser);

  // Toasts state
  const [toasts, setToasts] = useState<Toast[]>([]);

  function addToast(
    message: string,
    type: "info" | "success" | "warning" | "error" = "info"
  ) {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }

  // Location state shared across CreateRoute ↔ MapRoute
  const [createLat, setCreateLat] = useState<number | null>(null);
  const [createLng, setCreateLng] = useState<number | null>(null);
  const [createAddressText, setCreateAddressText] = useState<string>("");

  // GPS + Filter shared state
  const [selectedCity, setSelectedCity] = useState<"all" | "HCM" | "HN">(() => {
    const saved = localStorage.getItem("filter_city");
    return ["all", "HCM", "HN"].includes(saved || "") ? (saved as any) : "all";
  });
  const [selectedDistance, setSelectedDistance] = useState<"all" | "5" | "10">(() => {
    const saved = localStorage.getItem("filter_distance");
    return ["all", "5", "10"].includes(saved || "") ? (saved as any) : "all";
  });

  // GPS Tracker hook
  const { userLat, userLng, isTrackingGPS, gpsError } = useGPS();

  // Backend Health check hook
  useBackendHealth();

  // PWA Install manager hook
  const {
    deferredPrompt,
    showInstallBanner,
    showIOSInstallInstructions,
    isIOS,
    isStandalone,
    setShowInstallBanner,
    setShowIOSInstallInstructions,
    triggerPWAInstall,
  } = usePWAInstall(addToast);

  // Sync city & distance filters
  useEffect(() => {
    localStorage.setItem("filter_city", selectedCity);
    localStorage.setItem("filter_distance", selectedDistance);
  }, [selectedCity, selectedDistance]);

  // Derived filtered meetups list
  const filteredMeetups = useMemo(() => {
    return allMeetups.filter((m) => {
      if (selectedCity !== "all" && getMeetupCity(m) !== selectedCity) return false;
      if (selectedDistance !== "all" && userLat !== null && userLng !== null) {
        const dist = calculateDistance(userLat, userLng, m.lat, m.lng);
        if (dist > parseFloat(selectedDistance)) return false;
      }
      return true;
    });
  }, [allMeetups, selectedCity, selectedDistance, userLat, userLng]);

  // Total pending requests
  const totalPendingRequests = useMemo(() => {
    if (!currentUser) return 0;
    return allMeetups
      .filter((m) => m.hostUid === currentUser.uid || m.host_uid === currentUser.uid)
      .reduce(
        (sum, m) => sum + (Array.isArray(m.pendingUids) ? m.pendingUids.length : 0),
        0
      );
  }, [allMeetups, currentUser]);

  // Toast handler for newly pending requests
  const prevPendingCount = useRef(0);
  useEffect(() => {
    if (allMeetups.length > 0 && !isMeetupsLoading) {
      if (totalPendingRequests > prevPendingCount.current) {
        const diff = totalPendingRequests - prevPendingCount.current;
        addToast(`Bạn có ${diff} yêu cầu tham gia kèo mới đang chờ duyệt!`, "info");
      }
      prevPendingCount.current = totalPendingRequests;
    }
  }, [totalPendingRequests, allMeetups, isMeetupsLoading]);

  // Deep linking helper
  function handleDeepLink(urlStr: string) {
    if (urlStr.startsWith("#")) {
      window.location.hash = urlStr;
      return;
    }
    try {
      const url = new URL(urlStr, window.location.origin);
      const routeParam = url.searchParams.get("route");
      if (routeParam === "manage") {
        const meetupId = url.searchParams.get("meetupId");
        if (meetupId) {
          window.location.hash = `#/manage/${meetupId}`;
        }
      } else if (routeParam === "profile") {
        window.location.hash = `#/profile`;
      } else if (url.hash) {
        window.location.hash = url.hash;
      }
    } catch (e) {
      if (urlStr.startsWith("/")) {
        window.location.hash = `#${urlStr}`;
      } else {
        console.error("Lỗi parse deep link:", e);
      }
    }
  }

  // Auth FCM Notification initialization & listener
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        initNotifications(user.uid, (payload) => {
          const title = payload.notification?.title || "Thông báo mới";
          const body = payload.notification?.body || "";
          addToast(`${title}: ${body}`, "info");

          if (Notification.permission === "granted") {
            const clickAction = payload.data?.clickAction || "/";
            const notification = new Notification(title, {
              body: body,
              icon: "/boardgame_pwa_icon_1784017090071.png",
              tag: "foreground-push",
            });
            notification.onclick = () => {
              window.focus();
              handleDeepLink(clickAction);
              notification.close();
            };
          }
        });
      }
    });

    const handleServiceWorkerMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === "NAVIGATE_ROUTE") {
        handleDeepLink(event.data.url);
      }
    };

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("message", handleServiceWorkerMessage);
    }

    return () => {
      unsubAuth();
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.removeEventListener("message", handleServiceWorkerMessage);
      }
    };
  }, []);

  const renderRoute = () => {
    switch (route.name) {
      case "find":
        return (
          <FindRoute
            meetups={allMeetups}
            filteredMeetups={filteredMeetups}
            selectedCity={selectedCity}
            selectedDistance={selectedDistance}
            userLat={userLat}
            userLng={userLng}
            isTrackingGPS={isTrackingGPS}
            gpsError={gpsError}
            isLoading={isMeetupsLoading}
          />
        );
      case "create":
        return (
          <CreateRoute
            selectedLat={createLat}
            selectedLng={createLng}
            addressText={createAddressText}
            userLat={userLat}
            userLng={userLng}
            setSelectedLat={setCreateLat}
            setSelectedLng={setCreateLng}
            setAddressText={setCreateAddressText}
          />
        );
      case "profile":
        return (
          <ProfileRoute
            addToast={addToast}
            deferredPrompt={deferredPrompt}
            isIOS={isIOS}
            isStandalone={isStandalone}
            onTriggerInstall={triggerPWAInstall}
          />
        );
      case "my-meetups":
        return (
          <MyMeetupsRoute
            meetups={allMeetups}
            userLat={userLat}
            userLng={userLng}
            selectedCity={selectedCity}
            selectedDistance={selectedDistance}
            isTrackingGPS={isTrackingGPS}
            gpsError={gpsError}
            isLoading={isMeetupsLoading}
          />
        );
      case "chats":
        return <ChatsListRoute meetups={allMeetups} />;
      case "map":
        return (
          <MapRoute
            meetups={allMeetups}
            selectedLat={createLat}
            selectedLng={createLng}
            addressText={createAddressText}
            mode={route.mode}
            meetupId={route.meetupId}
            userLat={userLat}
            userLng={userLng}
            setSelectedLat={setCreateLat}
            setSelectedLng={setCreateLng}
            setAddressText={setCreateAddressText}
          />
        );
      case "filter":
        return (
          <FilterRoute
            selectedCity={selectedCity}
            selectedDistance={selectedDistance}
            userLat={userLat}
            isTrackingGPS={isTrackingGPS}
            gpsError={gpsError}
            onApply={(city, dist) => {
              setSelectedCity(city);
              setSelectedDistance(dist);
            }}
          />
        );
      case "chat":
        return <ChatRoute meetup={allMeetups.find((m) => m.id === route.meetupId)} />;
      case "manage":
        return <ManageRoute meetup={allMeetups.find((m) => m.id === route.meetupId)} />;
      default:
        return (
          <FindRoute
            meetups={allMeetups}
            filteredMeetups={filteredMeetups}
            selectedCity={selectedCity}
            selectedDistance={selectedDistance}
            userLat={userLat}
            userLng={userLng}
            isTrackingGPS={isTrackingGPS}
            gpsError={gpsError}
            isLoading={isMeetupsLoading}
          />
        );
    }
  };

  return (
    <div className="app-root">
      {/* Navbar Desktop */}
      <Navbar
        route={route}
        totalPendingRequests={totalPendingRequests}
        deferredPrompt={deferredPrompt}
        isIOS={isIOS}
        isStandalone={isStandalone}
        onTriggerInstall={triggerPWAInstall}
      />

      {/* PWA Install Banner */}
      <InstallPWABanner
        show={(deferredPrompt || (isIOS && !isStandalone)) && showInstallBanner}
        onInstall={triggerPWAInstall}
        onClose={() => setShowInstallBanner(false)}
      />

      {/* Main Content View */}
      <main className="container">{renderRoute()}</main>

      {/* Toast Notification Box */}
      <ToastContainer
        toasts={toasts}
        onRemoveToast={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))}
      />

      {/* Mobile Bottom Tab Bar */}
      <MobileTabBar
        route={route}
        childRoute={childRoute}
        totalPendingRequests={totalPendingRequests}
      />

      {/* iOS Install Guide Modal */}
      <IOSInstallModal
        isOpen={showIOSInstallInstructions}
        onClose={() => setShowIOSInstallInstructions(false)}
      />
    </div>
  );
}
