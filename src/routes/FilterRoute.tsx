import React, { useState, useEffect } from "react";
import { goBack } from "../libs/router";
import Icon from "../components/Icon";

interface Props {
  selectedCity: "all" | "HCM" | "HN";
  selectedDistance: "all" | "5" | "10";
  userLat: number | null;
  isTrackingGPS: boolean;
  gpsError: boolean;
  onApply: (city: "all" | "HCM" | "HN", distance: "all" | "5" | "10") => void;
}

export default function FilterRoute({
  selectedCity = "all",
  selectedDistance = "all",
  userLat,
  isTrackingGPS,
  gpsError,
  onApply,
}: Props) {
  const [tempCity, setTempCity] = useState<"all" | "HCM" | "HN">(selectedCity);
  const [tempDistance, setTempDistance] = useState<"all" | "5" | "10">(selectedDistance);

  useEffect(() => {
    setTempCity(selectedCity);
    setTempDistance(selectedDistance);
  }, [selectedCity, selectedDistance]);

  function handleApply() {
    onApply(tempCity, tempDistance);
    goBack();
  }

  return (
    <div className="fullscreen-route-view filter-route w-full flex flex-col gap-4 pb-10 max-w-[580px] mx-auto">
      {/* Top Navigation */}
      <div className="cartoon-card route-top-nav bg-pastelYellow flex items-center gap-3 p-3 rounded-lg shadow-neo text-left">
        <button type="button" className="btn btn-secondary back-btn py-1.5 px-3 text-xs whitespace-nowrap" onClick={goBack}>
          ← Quay lại
        </button>
        <div className="nav-title-group">
          <h2 className="text-lg font-bold flex items-center gap-1.5 m-0"><Icon name="filter" size={20} /> Tùy Chỉnh Bộ Lọc Tìm Kiếm</h2>
          <span className="sub-title text-xs font-semibold text-[#1e1e24]">Chọn khu vực thành phố và bán kính vị trí</span>
        </div>
      </div>

      {/* Compact Body Content */}
      <div className="cartoon-card filter-content-card bg-[#fffefb] p-6 text-left border-3 border-[#1e1e24] rounded-2xl shadow-neo">
        {/* City Selection Row */}
        <div className="filter-section">
          <h3 className="section-title-label text-sm font-bold mb-2.5 text-[#1e1e24] flex items-center gap-1.5">
            <Icon name="building" size={16} /> Khu Vực:
          </h3>
          <div className="options-row flex gap-2 w-full">
            <button
              type="button"
              className={`option-chip-btn flex-1 flex items-center justify-center gap-1.5 p-2.5 rounded-md border-3 border-[#1e1e24] bg-white cursor-pointer shadow-[2.5px_2.5px_0_#1e1e24] font-bold text-xs whitespace-nowrap transition-all duration-100 hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3.5px_3.5px_0_#1e1e24] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_#1e1e24] ${
                tempCity === "all" ? "bg-pastelYellow" : ""
              }`}
              onClick={() => setTempCity("all")}
            >
              <Icon name="map" size={15} />
              <span>Tất Cả</span>
            </button>

            <button
              type="button"
              className={`option-chip-btn flex-1 flex items-center justify-center gap-1.5 p-2.5 rounded-md border-3 border-[#1e1e24] bg-white cursor-pointer shadow-[2.5px_2.5px_0_#1e1e24] font-bold text-xs whitespace-nowrap transition-all duration-100 hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3.5px_3.5px_0_#1e1e24] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_#1e1e24] ${
                tempCity === "HCM" ? "bg-pastelYellow" : ""
              }`}
              onClick={() => setTempCity("HCM")}
            >
              <Icon name="building" size={15} />
              <span>Hồ Chí Minh</span>
            </button>

            <button
              type="button"
              className={`option-chip-btn flex-1 flex items-center justify-center gap-1.5 p-2.5 rounded-md border-3 border-[#1e1e24] bg-white cursor-pointer shadow-[2.5px_2.5px_0_#1e1e24] font-bold text-xs whitespace-nowrap transition-all duration-100 hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3.5px_3.5px_0_#1e1e24] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_#1e1e24] ${
                tempCity === "HN" ? "bg-pastelYellow" : ""
              }`}
              onClick={() => setTempCity("HN")}
            >
              <Icon name="landmark" size={15} />
              <span>Hà Nội</span>
            </button>
          </div>
        </div>

        {/* Distance Selection Row */}
        <div className="filter-section mt-5">
          <h3 className="section-title-label text-sm font-bold mb-2.5 text-[#1e1e24] flex items-center gap-1.5">
            <Icon name="target" size={16} /> Bán Kính (GPS):
          </h3>
          <div className="options-row flex gap-2 w-full">
            <button
              type="button"
              className={`option-chip-btn flex-1 flex items-center justify-center gap-1.5 p-2.5 rounded-md border-3 border-[#1e1e24] bg-white cursor-pointer shadow-[2.5px_2.5px_0_#1e1e24] font-bold text-xs whitespace-nowrap transition-all duration-100 hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3.5px_3.5px_0_#1e1e24] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_#1e1e24] ${
                tempDistance === "all" ? "bg-pastelYellow" : ""
              }`}
              onClick={() => setTempDistance("all")}
            >
              <Icon name="pin" size={15} />
              <span>Tất Cả</span>
            </button>

            <button
              type="button"
              className={`option-chip-btn flex-1 flex items-center justify-center gap-1.5 p-2.5 rounded-md border-3 border-[#1e1e24] bg-white cursor-pointer shadow-[2.5px_2.5px_0_#1e1e24] font-bold text-xs whitespace-nowrap transition-all duration-100 hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3.5px_3.5px_0_#1e1e24] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_#1e1e24] disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-300 disabled:cursor-not-allowed disabled:shadow-[1.5px_1.5px_0_#d1d5db] ${
                tempDistance === "5" ? "bg-pastelYellow" : ""
              }`}
              disabled={userLat === null}
              onClick={() => setTempDistance("5")}
            >
              <Icon name="zap" size={15} />
              <span>&lt; 5 km</span>
            </button>

            <button
              type="button"
              className={`option-chip-btn flex-1 flex items-center justify-center gap-1.5 p-2.5 rounded-md border-3 border-[#1e1e24] bg-white cursor-pointer shadow-[2.5px_2.5px_0_#1e1e24] font-bold text-xs whitespace-nowrap transition-all duration-100 hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3.5px_3.5px_0_#1e1e24] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_#1e1e24] disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-300 disabled:cursor-not-allowed disabled:shadow-[1.5px_1.5px_0_#d1d5db] ${
                tempDistance === "10" ? "bg-pastelYellow" : ""
              }`}
              disabled={userLat === null}
              onClick={() => setTempDistance("10")}
            >
              <Icon name="rocket" size={15} />
              <span>&lt; 10 km</span>
            </button>
          </div>

          {userLat === null && (
            <p className="gps-warning-hint text-xs font-bold text-[#dc2626] mt-2 flex items-center gap-1.5">
              <Icon name="alert-triangle" size={14} /> Cần bật vị trí (GPS) để xem bán kính theo km.
            </p>
          )}
        </div>

        {/* GPS Status bar */}
        <div className="gps-status-pill mt-5 p-2.5 bg-bgCream border-2 border-[#1e1e24] rounded-md flex items-center gap-2">
          {isTrackingGPS ? (
            <>
              <span className="gps-dot pulsing w-2 h-2 rounded-full border border-[#1e1e24] bg-[#eab308] animate-pulse"></span>
              <span className="gps-text text-xs font-bold text-[#1e1e24]">Đang lấy vị trí GPS...</span>
            </>
          ) : userLat !== null ? (
            <>
              <span className="gps-dot success w-2 h-2 rounded-full border border-[#1e1e24] bg-[#10b981]"></span>
              <span className="gps-text text-xs font-bold text-[#1e1e24]">Đã định vị thành công</span>
            </>
          ) : (
            <>
              <span className="gps-dot warning w-2 h-2 rounded-full border border-[#1e1e24] bg-[#ef4444]"></span>
              <span className="gps-text text-xs font-bold text-[#1e1e24]">Chưa bật định vị GPS</span>
            </>
          )}
        </div>

        <div className="apply-action-bar mt-5">
          <button type="button" className="btn btn-primary btn-apply-full w-full py-3 text-[0.98rem] flex items-center justify-center gap-1.5" onClick={handleApply}>
            <Icon name="check-circle" size={18} /> Áp Dụng Bộ Lọc
          </button>
        </div>
      </div>
    </div>
  );
}
