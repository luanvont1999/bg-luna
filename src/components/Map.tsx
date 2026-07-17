import React, {
  useEffect,
  useRef,
  useState,
  useImperativeHandle,
  forwardRef,
} from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import Icon from "./Icon";
import { formatTime } from "../utils/time";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || "";

interface Meetup {
  id: string;
  title: string;
  game: string;
  hostName?: string;
  host_name?: string;
  playersCount?: number;
  players_count?: number;
  playersNeeded?: number;
  players_needed?: number;
  time: string;
  lat: number;
  lng: number;
  color?: string;
}

interface PresetVenue {
  name: string;
  address: string;
  lat: number;
  lng: number;
}

interface Props {
  meetups?: Meetup[];
  presetVenues?: PresetVenue[];
  selectedLat: number | null;
  selectedLng: number | null;
  mode?: "view" | "select";
  meetupId?: string; // highlight specific meetup if in view mode
  userLat?: number | null;
  userLng?: number | null;
  onSelectCoordinates?: (
    lat: number,
    lng: number,
    name?: string,
    address?: string
  ) => void;
}

export interface MapRef {
  flyTo: (lat: number, lng: number, zoom?: number) => void;
}

const Map = forwardRef<MapRef, Props>(
  (
    {
      meetups = [],
      presetVenues = [],
      selectedLat,
      selectedLng,
      mode = "view",
      meetupId,
      userLat = null,
      userLng = null,
      onSelectCoordinates,
    },
    ref
  ) => {
    const mapContainer = useRef<HTMLDivElement | null>(null);
    const map = useRef<mapboxgl.Map | null>(null);
    const markers = useRef<{ [key: string]: mapboxgl.Marker }>({});
    const selectionMarker = useRef<mapboxgl.Marker | null>(null);
    const userMarker = useRef<mapboxgl.Marker | null>(null);
    const presetMarkers = useRef<mapboxgl.Marker[]>([]);

    const [mapError, setMapError] = useState<string>("");

    // Expose map controllers to parent routes
    useImperativeHandle(ref, () => ({
      flyTo(lat: number, lng: number, zoom = 14) {
        if (map.current) {
          map.current.flyTo({ center: [lng, lat], zoom, essential: true });
        }
      },
    }));

    // Initialize Map
    useEffect(() => {
      if (!mapContainer.current) return;
      if (!mapboxgl.accessToken) {
        setMapError("Token Mapbox Access Token chưa được cấu hình ở môi trường (.env)!");
        return;
      }

      // Default center is Saigon Q1
      let initialCenter: [number, number] = [106.7009, 10.7769];
      let initialZoom = 13;

      if (userLng !== null && userLat !== null) {
        initialCenter = [userLng, userLat];
      }

      // If viewing a specific meetup, center on it
      if (mode === "view" && meetupId) {
        const active = meetups.find((m) => m.id === meetupId);
        if (active) {
          initialCenter = [active.lng, active.lat];
          initialZoom = 14;
        }
      } else if (mode === "select" && selectedLat !== null && selectedLng !== null) {
        initialCenter = [selectedLng, selectedLat];
      }

      try {
        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: "mapbox://styles/mapbox/streets-v12",
          center: initialCenter,
          zoom: initialZoom,
          cooperativeGestures: false, // mobile-friendly scroll
        });

        map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

        // Map Click handling (in select mode)
        map.current.on("click", (e) => {
          if (mode === "select" && onSelectCoordinates) {
            const { lat: clickLat, lng: clickLng } = e.lngLat;
            onSelectCoordinates(clickLat, clickLng);
          }
        });
      } catch (err: any) {
        console.error("Lỗi khởi tạo bản đồ Mapbox:", err);
        setMapError("Không thể tải bản đồ Mapbox: " + err.message);
      }

      return () => {
        if (map.current) {
          map.current.remove();
          map.current = null;
        }
      };
    }, []);

    // Sync user GPS marker
    useEffect(() => {
      if (!map.current || userLat === null || userLng === null) return;

      if (!userMarker.current) {
        // Create user marker element
        const el = document.createElement("div");
        el.className = "user-location-marker";
        el.style.width = "22px";
        el.style.height = "22px";
        el.style.borderRadius = "50%";
        el.style.backgroundColor = "#3b82f6";
        el.style.border = "3px solid white";
        el.style.boxShadow = "0 0 10px rgba(0,0,0,0.3)";

        userMarker.current = new mapboxgl.Marker(el)
          .setLngLat([userLng, userLat])
          .addTo(map.current);
      } else {
        userMarker.current.setLngLat([userLng, userLat]);
      }
    }, [userLat, userLng]);

    // Sync selected location pin (in select mode)
    useEffect(() => {
      if (!map.current) return;

      const isPredefined = presetVenues && presetVenues.some(
        (v) => Math.abs(v.lat - selectedLat!) < 0.0001 && Math.abs(v.lng - selectedLng!) < 0.0001
      );

      if (mode === "select" && selectedLat !== null && selectedLng !== null && !isPredefined) {
        if (!selectionMarker.current) {
          const el = document.createElement("div");
          el.className = "map-selection-marker";
          el.innerHTML = `
            <svg viewBox="0 0 24 24" width="36" height="36" stroke="#1e1e24" stroke-width="2.5" fill="#ef4444">
              <path d="M12 2.5a3.5 3.5 0 0 1 3.5 3.5c0 1.25-.66 2.35-1.65 3C17.15 10 19.5 12.7 19.5 16v6h-4v-4.5c0-.8-.7-1.5-1.5-1.5h-4c-.8 0-1.5.7-1.5 1.5V22h-4v-6c0-3.3 2.35-6 5.65-7A3.5 3.5 0 0 1 12 2.5z" />
            </svg>
          `;

          selectionMarker.current = new mapboxgl.Marker({
            element: el,
            anchor: "bottom",
          })
            .setLngLat([selectedLng, selectedLat])
            .addTo(map.current);
        } else {
          selectionMarker.current.setLngLat([selectedLng, selectedLat]);
        }
      } else {
        if (selectionMarker.current) {
          selectionMarker.current.remove();
          selectionMarker.current = null;
        }
      }
    }, [selectedLat, selectedLng, mode, presetVenues]);

    // Sync preset venues markers (in select mode)
    useEffect(() => {
      if (!map.current) return;

      // Clear existing preset markers
      presetMarkers.current.forEach((m) => m.remove());
      presetMarkers.current = [];

      if (mode === "select" && presetVenues && presetVenues.length > 0) {
        presetVenues.forEach((venue) => {
          const isSelected =
            selectedLat !== null &&
            selectedLng !== null &&
            Math.abs(venue.lat - selectedLat) < 0.0001 &&
            Math.abs(venue.lng - selectedLng) < 0.0001;

          const el = document.createElement("div");
          el.className = `preset-venue-marker ${isSelected ? "selected" : ""}`;
          el.style.width = "34px";
          el.style.height = "34px";
          el.style.cursor = "pointer";
          el.style.filter = "drop-shadow(2px 2px 0px #1e1e24)";
          el.innerHTML = `
            <svg viewBox="0 0 24 24" width="32" height="32" stroke="#1e1e24" stroke-width="2.5" fill="${isSelected ? "#ffe869" : "#a4f0fd"}">
              <path d="M12 2.5a3.5 3.5 0 0 1 3.5 3.5c0 1.25-.66 2.35-1.65 3C17.15 10 19.5 12.7 19.5 16v6h-4v-4.5c0-.8-.7-1.5-1.5-1.5h-4c-.8 0-1.5.7-1.5 1.5V22h-4v-6c0-3.3 2.35-6 5.65-7A3.5 3.5 0 0 1 12 2.5z" />
            </svg>
          `;

          // Custom hover popup showing venue name and address
          const popup = new mapboxgl.Popup({
            offset: 38,
            closeButton: false,
            className: `preset-venue-popup ${isSelected ? "selected-venue-popup" : ""}`,
          }).setHTML(`
            <div class="preset-venue-popup-box text-left font-sans" style="padding: 10px; max-width: 190px; box-sizing: border-box;">
              <h5 style="font-weight: 800; font-size: 0.82rem; margin: 0 0 4px 0; color: #1e1e24; line-height: 1.2;">
                📍 ${venue.name}
              </h5>
              <p style="font-size: 0.72rem; font-weight: 600; margin: 0; color: #2d3748; line-height: 1.35;">
                ${venue.address}
              </p>
            </div>
          `);

          const marker = new mapboxgl.Marker({
            element: el,
            anchor: "bottom",
          })
            .setLngLat([venue.lng, venue.lat])
            .setPopup(popup)
            .addTo(map.current!);

          // Bind click event
          el.addEventListener("click", (evt) => {
            evt.stopPropagation(); // Ngăn sự kiện click của map chính kích hoạt
            if (onSelectCoordinates) {
              onSelectCoordinates(venue.lat, venue.lng, venue.name, venue.address);
            }
          });

          // Show popup on hover
          el.addEventListener("mouseenter", () => popup.addTo(map.current!));
          el.addEventListener("mouseleave", () => {
            if (selectedLat !== venue.lat || selectedLng !== venue.lng) {
              popup.remove();
            }
          });

          // Nếu địa điểm này trùng khớp với toạ độ được chọn hiện tại, tự động bật popup lên
          if (
            selectedLat !== null &&
            selectedLng !== null &&
            Math.abs(venue.lat - selectedLat) < 0.0001 &&
            Math.abs(venue.lng - selectedLng) < 0.0001
          ) {
            popup.addTo(map.current!);
          }

          presetMarkers.current.push(marker);
        });
      }

      return () => {
        presetMarkers.current.forEach((m) => m.remove());
        presetMarkers.current = [];
      };
    }, [presetVenues, mode, onSelectCoordinates, selectedLat, selectedLng]);

    // Sync meetup pins (in view mode)
    useEffect(() => {
      if (!map.current || mode !== "view") return;

      // Clear obsolete markers
      Object.keys(markers.current).forEach((id) => {
        if (!meetups.some((m) => m.id === id)) {
          markers.current[id].remove();
          delete markers.current[id];
        }
      });

      // Add or update markers
      meetups.forEach((m) => {
        const isHighlighted = meetupId === m.id;

        if (!markers.current[m.id]) {
          // Create meeple marker element
          const el = document.createElement("div");
          el.className = `map-meeple-marker ${isHighlighted ? "highlighted" : ""}`;
          el.style.width = "40px";
          el.style.height = "40px";
          el.style.cursor = "pointer";
          el.style.display = "flex";
          el.style.justifyContent = "center";
          el.style.alignItems = "center";
          el.style.filter = "drop-shadow(2px 2px 0px #1e1e24)";

          // Cartoon style meeple SVG
          el.innerHTML = `
            <svg viewBox="0 0 24 24" width="36" height="36" stroke="#1e1e24" stroke-width="2.5" fill="${m.color || "#bca0f5"}">
              <path d="M12 2.5a3.5 3.5 0 0 1 3.5 3.5c0 1.25-.66 2.35-1.65 3C17.15 10 19.5 12.7 19.5 16v6h-4v-4.5c0-.8-.7-1.5-1.5-1.5h-4c-.8 0-1.5.7-1.5 1.5V22h-4v-6c0-3.3 2.35-6 5.65-7A3.5 3.5 0 0 1 12 2.5z" />
            </svg>
          `;

          // Generate popup content
          const count = m.playersCount || m.players_count || 1;
          const needed = m.playersNeeded || m.players_needed || 4;
          const hostName = m.hostName || m.host_name || "Host";

          const popupHtml = `
            <div class="map-popup-box text-left font-sans" style="padding: 12px; max-width: 210px; box-sizing: border-box;">
              <h4 style="font-weight: 800; font-size: 0.95rem; margin: 0 0 6px 0; color: #1e1e24; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${m.title}</h4>
              <p style="font-size: 0.78rem; font-weight: 700; margin: 0 0 3px 0; color: #555555;">Game: <strong>${m.game}</strong></p>
              <p style="font-size: 0.78rem; font-weight: 700; margin: 0 0 3px 0; color: #555555;">Sĩ số: <strong>${count}/${needed}</strong></p>
              <p style="font-size: 0.78rem; font-weight: 700; margin: 0 0 8px 0; color: #555555;">Giờ chơi: <strong>${formatTime(m.time)}</strong></p>
              <div style="border-top: 2px dashed #1e1e24; padding-top: 8px; margin-top: 4px; display: flex; justify-content: space-between; align-items: center; gap: 8px;">
                <span style="font-size: 0.72rem; font-weight: 800; color: #1e1e24; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 90px;">Host: ${hostName}</span>
                <a href="#/chat/${m.id}" style="font-size: 0.72rem; font-weight: 800; text-decoration: none; color: #1e1e24; background-color: #ffa4b2; border: 2px solid #1e1e24; padding: 2.5px 7.5px; border-radius: 6px; box-shadow: 1.5px 1.5px 0 #1e1e24; display: inline-block; transition: all 0.1s;">Nhắn tin</a>
              </div>
            </div>
          `;

          const popup = new mapboxgl.Popup({
            offset: 44,
            closeButton: false,
            className: "cartoon-mapbox-popup",
          }).setHTML(popupHtml);

          markers.current[m.id] = new mapboxgl.Marker({
            element: el,
            anchor: "bottom",
          })
            .setLngLat([m.lng, m.lat])
            .setPopup(popup)
            .addTo(map.current!);
        } else {
          // Update meeple color/position
          const marker = markers.current[m.id];
          marker.setLngLat([m.lng, m.lat]);

          const el = marker.getElement();
          if (isHighlighted) {
            el.classList.add("highlighted");
          } else {
            el.classList.remove("highlighted");
          }
        }
      });
    }, [meetups, meetupId, mode]);

    return (
      <div className="map-component-container relative w-full h-full rounded-2xl overflow-hidden border-3 border-[#1e1e24] shadow-neo min-h-[300px]">
        {mapError ? (
          <div className="map-error-screen absolute inset-0 flex flex-col items-center justify-center bg-[#fff2f2] p-5 text-center">
            <Icon name="alert-triangle" size={36} className="text-[#ef4444] mb-3" />
            <h4 className="font-bold text-lg text-[#1e1e24] mb-1">Lỗi Bản Đồ</h4>
            <p className="text-sm font-semibold text-[#666666] max-w-[340px] leading-relaxed">
              {mapError}
            </p>
          </div>
        ) : (
          <div ref={mapContainer} className="mapbox-map-div w-full h-full" style={{ position: "absolute", inset: 0 }} />
        )}
      </div>
    );
  }
);

Map.displayName = "Map";

export default Map;
