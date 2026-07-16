import React from "react";
import { navigateToTab, RouteParams } from "../libs/router";

interface Props {
  route: RouteParams;
  childRoute: boolean;
  totalPendingRequests: number;
}

export default function MobileTabBar({ route, childRoute, totalPendingRequests }: Props) {
  if (childRoute) return null;

  return (
    <nav className="mobile-nav-bar">
      <button
        className={`mobile-nav-item ${route.name === "find" ? "active" : ""}`}
        onClick={() => navigateToTab("find")}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
        </svg>
        <span>Tìm kèo</span>
      </button>

      <button
        className={`mobile-nav-item ${route.name === "my-meetups" ? "active" : ""}`}
        onClick={() => navigateToTab("my-meetups")}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" strokeWidth="2.5" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" strokeWidth="2.5" />
        </svg>
        <span>Các kèo</span>
      </button>

      <button
        className={`mobile-nav-item ${route.name === "chats" ? "active" : ""}`}
        onClick={() => navigateToTab("chats")}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        <span>Trò chuyện</span>
      </button>

      <button
        className={`mobile-nav-item ${route.name === "create" ? "active" : ""}`}
        onClick={() => navigateToTab("create")}
      >
        <div className="relative inline-block">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-6 h-6"
          >
            <path d="M12 5v14M5 12h14" strokeWidth="3" />
          </svg>
          {totalPendingRequests > 0 && <span className="mobile-badge-count">{totalPendingRequests}</span>}
        </div>
        <span>Lên kèo</span>
      </button>

      <button
        className={`mobile-nav-item ${route.name === "profile" ? "active" : ""}`}
        onClick={() => navigateToTab("profile")}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
        <span>Hồ sơ</span>
      </button>
    </nav>
  );
}
