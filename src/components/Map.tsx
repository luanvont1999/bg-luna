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

interface Props {
  meetups?: Meetup[];
  selectedLat: number | null;
  selectedLng: number | null;
  mode?: "view" | "select";
  meetupId?: string; // highlight specific meetup if in view mode
  userLat?: number | null;
  userLng?: number | null;
  onSelectCoordinates?: (lat: number, lng: number) => void;
}

export interface MapRef {
  flyTo: (lat: number, lng: number, zoom?: number) => void;
}

const Map = forwardRef<MapRef, Props>(
  (
    {
      meetups = [],
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
          cooperativeGestures: true, // mobile-friendly scroll
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

      if (mode === "select" && selectedLat !== null && selectedLng !== null) {
        if (!selectionMarker.current) {
          const el = document.createElement("div");
          el.className = "map-selection-marker";
          el.innerHTML = `<svg viewBox="0 0 24 24" width="38" height="38" fill="#ef4444" stroke="#1e1e24" stroke-width="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3" fill="#fff"/></svg>`;

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
    }, [selectedLat, selectedLng, mode]);

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
              <path d="M12,2A3.5,3.5,0,1,0,15.5,5.5,3.5,3.5,0,0,0,12,2ZM18,22V16.5A1.5,1.5,0,0,0,16.5,15h-9A1.5,1.5,0,0,0,6,16.5V22l3-2,3,2,3-2Z" />
            </svg>
          `;

          // Generate popup content
          const count = m.playersCount || m.players_count || 1;
          const needed = m.playersNeeded || m.players_needed || 4;
          const hostName = m.hostName || m.host_name || "Host";

          const popupHtml = `
            <div class="cartoon-card map-popup-box text-left font-sans" style="border: 2px solid #1e1e24; box-shadow: 2px 2px 0 #1e1e24; padding: 10px; border-radius: 8px; background-color: #fffdfb; max-width: 220px;">
              <h4 style="font-weight: 800; font-size: 0.9rem; margin: 0 0 4px 0; color: #1e1e24; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${m.title}</h4>
              <p style="font-size: 0.75rem; font-weight: 700; margin: 0 0 2px 0; color: #666666;">Game: <strong>${m.game}</strong></p>
              <p style="font-size: 0.75rem; font-weight: 700; margin: 0 0 2px 0; color: #666666;">Sĩ số: <strong>${count}/${needed}</strong></p>
              <p style="font-size: 0.75rem; font-weight: 700; margin: 0 0 6px 0; color: #666666;">Giờ chơi: <strong>${formatTime(m.time)}</strong></p>
              <div style="border-top: 1.5px dashed #1e1e24; padding-top: 6px; display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 0.7rem; font-weight: 800; color: #1e1e24;">Host: ${hostName}</span>
                <a href="#/chat/${m.id}" style="font-size: 0.7rem; font-weight: 800; text-decoration: none; color: #1e1e24; background-color: #ffa4b2; border: 1.5px solid #1e1e24; padding: 2px 6px; border-radius: 4px; box-shadow: 1px 1px 0 #1e1e24; display: inline-block;">Nhắn tin</a>
              </div>
            </div>
          `;

          const popup = new mapboxgl.Popup({
            offset: 20,
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
