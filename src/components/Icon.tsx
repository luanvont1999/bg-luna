import React from "react";

interface Props {
  name: string;
  size?: number | string;
  className?: string;
  color?: string;
  strokeWidth?: number | string;
}

export default function Icon({
  name,
  size = 18,
  className = "",
  color = "currentColor",
  strokeWidth = 2.2,
}: Props) {
  const renderIconPaths = () => {
    switch (name) {
      case "dice":
        return (
          <>
            <rect x="3" y="3" width="18" height="18" rx="3" ry="3" />
            <circle cx="8.5" cy="8.5" r="1.5" fill={color} />
            <circle cx="15.5" cy="8.5" r="1.5" fill={color} />
            <circle cx="12" cy="12" r="1.5" fill={color} />
            <circle cx="8.5" cy="15.5" r="1.5" fill={color} />
            <circle cx="15.5" cy="15.5" r="1.5" fill={color} />
          </>
        );
      case "pin":
      case "map-pin":
        return (
          <>
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </>
        );
      case "map":
        return (
          <>
            <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
            <line x1="8" y1="2" x2="8" y2="18" />
            <line x1="16" y1="6" x2="16" y2="22" />
          </>
        );
      case "city":
      case "building":
        return (
          <>
            <path d="M3 21h18" />
            <path d="M6 21V7l6-4 6 4v14" />
            <path d="M9 10h1" />
            <path d="M14 10h1" />
            <path d="M9 14h1" />
            <path d="M14 14h1" />
            <path d="M9 18h1" />
            <path d="M14 18h1" />
          </>
        );
      case "landmark":
      case "capital":
        return (
          <>
            <line x1="2" y1="20" x2="22" y2="20" />
            <path d="M4 20V10l3-2 3 2v10" />
            <path d="M14 20V10l3-2 3 2v10" />
            <rect x="9" y="12" width="6" height="8" />
            <polygon points="12 3 9 7 15 7 12 3" />
          </>
        );
      case "users":
        return (
          <>
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </>
        );
      case "user":
        return (
          <>
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </>
        );
      case "crown":
        return (
          <>
            <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z" />
            <circle cx="12" cy="19" r="1" fill={color} />
          </>
        );
      case "clock":
      case "time":
        return (
          <>
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </>
        );
      case "calendar":
        return (
          <>
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </>
        );
      case "chat":
      case "message":
        return (
          <>
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </>
        );
      case "search":
      case "filter":
        return (
          <>
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </>
        );
      case "settings":
      case "cog":
        return (
          <>
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </>
        );
      case "lock":
        return (
          <>
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </>
        );
      case "key":
        return (
          <>
            <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.778-7.778zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
          </>
        );
      case "rocket":
        return (
          <>
            <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
            <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-3.05 11a22.35 22.35 0 0 1-3.95 2z" />
            <path d="M9 12l-2 2" />
            <path d="M15 9l2-2" />
          </>
        );
      case "check":
        return (
          <>
            <polyline points="20 6 9 17 4 12" />
          </>
        );
      case "check-circle":
        return (
          <>
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </>
        );
      case "bell":
        return (
          <>
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </>
        );
      case "alert":
      case "alert-triangle":
        return (
          <>
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </>
        );
      case "door":
      case "log-out":
        return (
          <>
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </>
        );
      case "x":
      case "close":
        return (
          <>
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </>
        );
      case "save":
        return (
          <>
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
            <polyline points="17 21 17 13 7 13 7 21" />
            <polyline points="7 3 7 8 15 8" />
          </>
        );
      case "sparkles":
      case "party":
        return (
          <>
            <path d="M12 3v3m0 12v3M3 12h3m12 0h3m-2.5-6.5l-2 2m-7 7l-2 2m0-11l2 2m7 7l2 2" />
            <circle cx="12" cy="12" r="3" />
          </>
        );
      case "smartphone":
      case "phone":
        return (
          <>
            <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
            <line x1="12" y1="18" x2="12.01" y2="18" />
          </>
        );
      case "target":
      case "crosshair":
      case "gps":
        return (
          <>
            <circle cx="12" cy="12" r="10" />
            <line x1="22" y1="12" x2="18" y2="12" />
            <line x1="6" y1="12" x2="2" y2="12" />
            <line x1="12" y1="6" x2="12" y2="2" />
            <line x1="12" y1="22" x2="12" y2="18" />
            <circle cx="12" cy="12" r="3" fill={color} />
          </>
        );
      case "ruler":
      case "distance":
        return (
          <>
            <path d="M2 12h20" />
            <path d="M6 12v-4" />
            <path d="M10 12v-6" />
            <path d="M14 12v-4" />
            <path d="M18 12v-6" />
          </>
        );
      case "brain":
      case "strategy":
        return (
          <>
            <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-2.04" />
            <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-2.04" />
          </>
        );
      case "home":
      case "family":
        return (
          <>
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </>
        );
      case "handshake":
      case "coop":
        return (
          <>
            <path d="M11 15h2a2 2 0 1 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 17" />
            <path d="M7 21l5-5" />
            <path d="M13 9l4.6-4.6a2 2 0 0 1 2.8 0l.6.6a2 2 0 0 1 0 2.8L16.4 12" />
            <path d="M17 13l4 4" />
          </>
        );
      case "mask":
      case "bluffing":
        return (
          <>
            <path d="M2 12a10 10 0 0 0 20 0 10 10 0 0 0-20 0z" />
            <path d="M8 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z" />
            <path d="M16 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z" />
            <path d="M8 15s1.5 2 4 2 4-2 4-2" />
          </>
        );
      case "sword":
      case "rpg":
        return (
          <>
            <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5" />
            <line x1="13" y1="19" x2="19" y2="13" />
            <line x1="16" y1="16" x2="21" y2="21" />
          </>
        );
      case "chart":
      case "economic":
        return (
          <>
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </>
        );
      case "engine":
      case "building-cog":
        return (
          <>
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
          </>
        );
      case "store":
      case "cafe":
        return (
          <>
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <path d="M9 22V12h6v10" />
          </>
        );
      case "file-text":
      case "notes":
        return (
          <>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <line x1="10" y1="9" x2="8" y2="9" />
          </>
        );
      case "zap":
      case "fast":
        return (
          <>
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </>
        );
      case "shield":
      case "badge":
        return (
          <>
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </>
        );
      case "plus":
        return (
          <>
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </>
        );
      default:
        return (
          <>
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </>
        );
    }
  };

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`inline-block shrink-0 align-middle ${className}`}
      aria-hidden="true"
    >
      {renderIconPaths()}
    </svg>
  );
}
