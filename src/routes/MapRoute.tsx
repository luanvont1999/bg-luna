import React, { useState, useEffect, useRef } from "react";
import { calculateDistance } from "../utils/geo";
import Map, { MapRef } from "../components/Map";
import { goBack } from "../libs/router";
import Icon from "../components/Icon";

interface Meetup {
  id: string;
  title: string;
  game: string;
  host_name?: string;
  hostName?: string;
  host_uid?: string;
  hostUid?: string;
  lat: number;
  lng: number;
  players_count?: number;
  playersCount?: number;
  players_needed?: number;
  playersNeeded?: number;
  time: string;
  color: string;
}

interface PresetVenue {
  name: string;
  address: string;
  lat: number;
  lng: number;
  distance?: number | null;
}

interface Props {
  meetups: Meetup[];
  selectedLat: number | null;
  selectedLng: number | null;
  addressText: string;
  mode: "discover" | "select";
  meetupId?: string;
  userLat?: number | null;
  userLng?: number | null;
  setSelectedLat: (lat: number | null) => void;
  setSelectedLng: (lng: number | null) => void;
  setAddressText: (text: string) => void;
}

export default function MapRoute({
  meetups,
  selectedLat,
  selectedLng,
  addressText,
  mode,
  meetupId,
  userLat = null,
  userLng = null,
  setSelectedLat,
  setSelectedLng,
  setAddressText,
}: Props) {


  const singleMeetup = meetupId ? meetups.find((m) => m.id === meetupId) : null;

  const displayedMeetups =
    mode === "select" ? [] : meetupId ? (singleMeetup ? [singleMeetup] : []) : meetups;

  const PREDEFINED_VENUES = [
    {
      name: "Boardgame Station",
      address: "21 Cô Bắc, Quận 1, TP. HCM",
      lat: 10.7656,
      lng: 106.6961,
    },
    {
      name: "Cashflow Cafe",
      address: "7A/19 Thành Thái, Quận 10, TP. HCM",
      lat: 10.7712,
      lng: 106.6644,
    },
    {
      name: "The Guild Board Game",
      address: "188/1 Nguyễn Văn Hưởng, Thảo Điền, TP. Thủ Đức",
      lat: 10.8062,
      lng: 106.7325,
    },
    {
      name: "Meeple Den Cafe",
      address: "12 Vệ Hồ, Tây Hồ, Hà Nội",
      lat: 21.062,
      lng: 105.8155,
    },
    {
      name: "The Boardgame Hub",
      address: "45 Lương Ngọc Quyến, Hoàn Kiếm, Hà Nội",
      lat: 21.0345,
      lng: 105.8524,
    },
    {
      name: "The Nest Boardgame",
      address: "4A Tràng Thi, Hoàn Kiếm, Hà Nội",
      lat: 21.0288,
      lng: 105.8475,
    },
  ];

  const sortedVenues = (() => {
    if (userLat !== null && userLng !== null) {
      const withDistance = PREDEFINED_VENUES.map((v) => ({
        ...v,
        distance: calculateDistance(userLat, userLng, v.lat, v.lng),
      }));

      // Filter strictly venues < 10km away from user
      const under10km = withDistance
        .filter((v) => v.distance < 10)
        .sort((a, b) => a.distance - b.distance);

      if (under10km.length > 0) {
        return under10km;
      }

      // Fallback: If no venue is under 10km, return the top 3 closest venues
      return withDistance.sort((a, b) => a.distance - b.distance).slice(0, 3);
    }
    return PREDEFINED_VENUES.map((v) => ({ ...v, distance: null }));
  })();

  const mapRef = useRef<MapRef | null>(null);
  const [tempLat, setTempLat] = useState<number | null>(null);
  const [tempLng, setTempLng] = useState<number | null>(null);
  const [tempAddress, setTempAddress] = useState<string>("");
  const [isResolvingAddress, setIsResolvingAddress] = useState<boolean>(false);

  useEffect(() => {
    if (mode === "select" && selectedLat !== null) {
      setTempLat(selectedLat);
      setTempLng(selectedLng);
      setTempAddress(addressText);
    }
  }, [mode, selectedLat, selectedLng, addressText]);

  function handleMapClick(lat: number, lng: number, name?: string, address?: string) {
    setTempLat(lat);
    setTempLng(lng);
    if (mode === "select") {
      if (name && address) {
        setTempAddress(`${name} (${address})`);
      } else {
        reverseGeocode(lat, lng);
      }
    }
  }

  function selectPopularVenue(venue: PresetVenue) {
    setTempLat(venue.lat);
    setTempLng(venue.lng);
    setTempAddress(`${venue.name} (${venue.address})`);
  }

  async function reverseGeocode(lat: number, lng: number) {
    const token = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
    if (!token) return;
    setIsResolvingAddress(true);
    setTempAddress("Đang xác định địa chỉ...");
    try {
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${token}&country=vn&limit=1&language=vi`
      );
      if (res.ok) {
        const data = await res.json();
        setTempAddress(
          data.features?.[0]?.place_name ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`
        );
      }
    } catch {
      setTempAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    } finally {
      setIsResolvingAddress(false);
    }
  }

  function confirmLocation() {
    setSelectedLat(tempLat);
    setSelectedLng(tempLng);
    setAddressText(tempAddress);
    goBack();
  }

  return (
    <div className="fullscreen-route-view map-route w-full flex flex-col h-[calc(100vh-90px)] max-h-[calc(100vh-90px)] gap-2.5 mb-0">
      {/* Top Navigation */}
      <div className="cartoon-card route-top-nav bg-pastelCyan flex items-center gap-2.5 p-[8px_14px] rounded-md shadow-neo text-left shrink-0">
        <button type="button" className="btn btn-secondary back-btn py-1.5 px-3 text-xs whitespace-nowrap" onClick={goBack}>
          ← Quay lại
        </button>
        <div className="nav-title-group">
          <h2 className="text-[1.05rem] font-extrabold m-0 flex items-center gap-1.5">
            {mode === "select" ? (
              <>
                <Icon name="target" size={20} /> Chọn Vị Trí Lên Kèo
              </>
            ) : singleMeetup ? (
              <>
                <Icon name="map" size={20} /> Vị Trí Kèo: {singleMeetup.title}
              </>
            ) : (
              <>
                <Icon name="map" size={20} /> Bản Đồ Hội Nhóm Boardgame
              </>
            )}
          </h2>
          <span className="sub-title text-[0.78rem] font-semibold text-[#1e1e24] block leading-[1.2]">
            {mode === "select" ? (
              "Nhấn chọn 1 điểm bất kỳ trên bản đồ hoặc chọn điểm gợi ý bên dưới"
            ) : singleMeetup ? (
              <>
                Game: <strong>{singleMeetup.game}</strong> • Host:{" "}
                <strong>{singleMeetup.hostName || singleMeetup.host_name || "Ẩn danh"}</strong>
              </>
            ) : (
              "Xem vị trí trực quan của tất cả các kèo chơi trên bản đồ"
            )}
          </span>
        </div>
      </div>

      {/* Popular Venue Shortcuts for Location Selection Mode */}
      {mode === "select" && (
        <div className="cartoon-card venue-shortcuts-bar bg-[#fffefb] p-[8px_12px] flex flex-col md:flex-row md:items-center gap-2 shrink-0 text-left overflow-hidden">
          <p className="venue-shortcuts-title text-[0.8rem] font-extrabold text-[#1e1e24] inline-flex items-center gap-1 whitespace-nowrap shrink-0">
            <Icon name="sparkles" size={15} className="inline" /> Gợi ý điểm chơi (&lt; 10km):
          </p>
          <div className="venue-tags flex flex-nowrap overflow-x-auto gap-1.5 py-0.5 w-full scrollbar-none">
            {sortedVenues.map((venue, idx) => (
              <button
                key={idx}
                type="button"
                className={`venue-tag-btn text-[0.75rem] font-bold py-1 px-2.5 border-[1.5px] border-[#1e1e24] rounded-full bg-white shadow-[1.5px_1.5px_0px_#1e1e24] cursor-pointer transition-all duration-100 inline-flex items-center gap-1 shrink-0 whitespace-nowrap hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[2px_2px_0px_#1e1e24] hover:bg-pastelYellow ${
                  tempLat === venue.lat && tempLng === venue.lng ? "active bg-pastelYellow shadow-[1px_1px_0px_#1e1e24] translate-x-[1px] translate-y-[1px]" : ""
                }`}
                onClick={() => selectPopularVenue(venue)}
              >
                <Icon name="store" size={13} className="inline" />
                <span>{venue.name}</span>
                {venue.distance !== null && (
                  <span className="venue-dist-tag text-[0.7rem] opacity-85">
                    • {venue.distance < 1
                      ? `${Math.round(venue.distance * 1000)}m`
                      : `${venue.distance.toFixed(1)}km`}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Interactive Map Canvas */}
      <Map
        ref={mapRef}
        meetups={displayedMeetups}
        presetVenues={mode === "select" ? sortedVenues : []}
        selectedLat={tempLat}
        selectedLng={tempLng}
        mode={mode}
        onSelectCoordinates={handleMapClick}
      />

      {/* Bottom Control Bar */}
      <div className="cartoon-card map-bottom-bar bg-white flex items-center justify-between p-[8px_14px] rounded-md shadow-neo shrink-0 gap-3">
        {mode === "select" ? (
          <>
            <div className="location-picker-info text-left text-[0.82rem] font-bold text-[#1e1e24] flex-1 whitespace-nowrap overflow-hidden truncate">
              {tempLat && tempLng ? (
                <span>
                  <Icon name="pin" size={16} className="mr-1 inline" /> Địa chỉ đã chọn:{" "}
                  <strong>{isResolvingAddress ? "Đang xác định..." : tempAddress}</strong>
                </span>
              ) : (
                <span>Vui lòng chọn 1 điểm gợi ý trên hoặc chạm vào bản đồ.</span>
              )}
            </div>
            <button
              type="button"
              className="btn btn-primary btn-confirm py-2 px-4 text-xs whitespace-nowrap inline-flex items-center gap-1.5"
              disabled={tempLat === null || isResolvingAddress}
              onClick={confirmLocation}
            >
              <Icon name="check-circle" size={16} /> Xác nhận vị trí này
            </button>
          </>
        ) : (
          <>
            <span className="map-hint-text text-[0.82rem] font-bold text-[#666666] text-left flex items-center gap-1.5">
              <Icon name="sparkles" size={16} /> Bấm vào quân cờ Meeple màu sắc trên bản đồ để xem chi tiết kèo.
            </span>
            <button type="button" className="btn btn-primary" onClick={goBack}>
              Xong / Trở về
            </button>
          </>
        )}
      </div>
    </div>
  );
}
