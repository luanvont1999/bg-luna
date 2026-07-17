import React from "react";
import Icon from "./Icon";
import { navigateToTab, RouteParams } from "../libs/router";

interface Props {
  route: RouteParams;
  totalPendingRequests: number;
  deferredPrompt: any;
  isIOS: boolean;
  isStandalone: boolean;
  onTriggerInstall: () => void;
}

const getEnvInfo = () => {
  const hostname =
    typeof window !== "undefined" ? window.location.hostname : "";
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return { name: "LOCAL", color: "#ffe869" }; // Pastel yellow
  }

  const env = import.meta.env.VITE_APP_ENV || "";
  if (env === "production" && !hostname.includes("vercel.app")) {
    return { name: "PROD", color: "#86efac" }; // Pastel green
  }

  return { name: "DEV", color: "#ffb3ba" }; // Pastel pink/rose (for Vercel Preview/Dev)
};

export default function Navbar({
  route,
  totalPendingRequests,
  deferredPrompt,
  isIOS,
  isStandalone,
  onTriggerInstall,
}: Props) {
  const envInfo = getEnvInfo();

  return (
    <header className="navbar">
      <div className="container navbar-container">
        <div className="logo">
          <svg
            className="logo-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect
              x="3"
              y="3"
              width="18"
              height="18"
              rx="2"
              ry="2"
              fill="currentColor"
            />
            <circle cx="8" cy="8" r="1.5" fill="#fff" />
            <circle cx="16" cy="16" r="1.5" fill="#fff" />
            <circle cx="16" cy="8" r="1.5" fill="#fff" />
            <circle cx="8" cy="16" r="1.5" fill="#fff" />
            <circle cx="12" cy="12" r="1.5" fill="#fff" />
          </svg>
          <span>Boardgame Luna</span>
          {envInfo.name && (
            <span
              style={{
                fontSize: "10px",
                fontWeight: "bold",
                padding: "2px 6px",
                border: "2px solid var(--color-border, #1e1e24)",
                borderRadius: "6px",
                backgroundColor: envInfo.color,
                color: "var(--color-border, #1e1e24)",
                boxShadow: "2px 2px 0px var(--color-border, #1e1e24)",
                display: "inline-flex",
                alignItems: "center",
                lineHeight: "1",
                letterSpacing: "0.5px",
                fontFamily: "'Fredoka', 'Quicksand', sans-serif",
                transform: "rotate(3deg)",
              }}
            >
              {envInfo.name}
            </span>
          )}
        </div>

        <ul className="nav-links">
          <li>
            <button
              className={`nav-link ${route.name === "find" ? "active" : ""}`}
              onClick={() => navigateToTab("find")}
            >
              Tìm kèo
            </button>
          </li>
          <li>
            <button
              className={`nav-link ${route.name === "my-meetups" ? "active" : ""}`}
              onClick={() => navigateToTab("my-meetups")}
            >
              Các kèo
            </button>
          </li>
          <li>
            <button
              className={`nav-link ${route.name === "chats" ? "active" : ""}`}
              onClick={() => navigateToTab("chats")}
            >
              Trò chuyện
            </button>
          </li>
          <li>
            <button
              className={`nav-link ${route.name === "create" ? "active" : ""}`}
              onClick={() => navigateToTab("create")}
            >
              Lên kèo
              {totalPendingRequests > 0 && (
                <span className="nav-badge">{totalPendingRequests}</span>
              )}
            </button>
          </li>
          <li>
            <button
              className={`nav-link ${route.name === "profile" ? "active" : ""}`}
              onClick={() => navigateToTab("profile")}
            >
              Hồ sơ
            </button>
          </li>
        </ul>
      </div>
    </header>
  );
}
