import React, { useState, useEffect } from "react";
import { goBack } from "../libs/router";
import Icon from "../components/Icon";

interface Props {
  selectedCities: ("HCM" | "HN" | "OTHER")[];
  selectedDistance: string;
  userLat: number | null;
  isTrackingGPS: boolean;
  gpsError: boolean;
  onApply: (cities: ("HCM" | "HN" | "OTHER")[], distance: string) => void;
}

export default function FilterRoute({
  selectedCities = [],
  selectedDistance = "all",
  userLat,
  isTrackingGPS,
  gpsError,
  onApply,
}: Props) {
  const [tempCities, setTempCities] =
    useState<("HCM" | "HN" | "OTHER")[]>(selectedCities);
  const [tempDistance, setTempDistance] = useState<string>(selectedDistance);

  useEffect(() => {
    setTempCities(selectedCities);
    setTempDistance(selectedDistance);
  }, [selectedCities, selectedDistance]);

  function handleApply() {
    onApply(tempCities, tempDistance);
    goBack();
  }

  function toggleCity(city: "HCM" | "HN" | "OTHER") {
    setTempCities((prev) =>
      prev.includes(city) ? prev.filter((c) => c !== city) : [...prev, city],
    );
  }

  return (
    <div className="fullscreen-route-view filter-route w-full flex flex-col gap-4 pb-10 max-w-[580px] mx-auto">
      {/* Top Navigation */}
      <div className="cartoon-card route-top-nav bg-pastelYellow flex items-center gap-3 p-3 rounded-lg shadow-neo text-left">
        <button
          type="button"
          className="btn btn-secondary back-btn py-1.5 px-3 text-xs whitespace-nowrap"
          onClick={goBack}
        >
          ← Quay lại
        </button>
        <div className="nav-title-group">
          <h2 className="text-[1.5rem] font-bold flex items-center gap-1.5 m-0">
            <Icon name="filter" size={24} /> Tùy Chỉnh
          </h2>
        </div>
      </div>

      {/* Compact Body Content */}
      <div className="cartoon-card filter-content-card bg-[#fffefb] p-6 text-left border-3 border-[#1e1e24] rounded-2xl shadow-neo">
        {/* City Selection Row - CHECKBOXES */}
        <div className="filter-section flex flex-col gap-3">
          <h3 className="section-title-label text-sm font-bold text-[#1e1e24] flex items-center gap-1.5 m-0">
            <Icon name="building" size={16} /> Khu Vực Chơi (Chọn nhiều):
          </h3>
          <div className="flex flex-col gap-2.5 mt-1">
            {[
              { id: "HN", name: "Hà Nội", icon: "landmark" },
              { id: "HCM", name: "Hồ Chí Minh", icon: "building" },
              { id: "OTHER", name: "Khác", icon: "compass" },
            ].map((city) => {
              const isSelected = tempCities.includes(city.id as any);
              return (
                <div
                  key={city.id}
                  className={`flex items-center gap-3 p-3.5 rounded-lg border-3 border-[#1e1e24] cursor-pointer transition-all duration-100 ${
                    isSelected
                      ? "bg-[#ffdf7a] translate-x-[2px] translate-y-[2px] shadow-[1px_1px_0px_#1e1e24]"
                      : "bg-white shadow-[4px_4px_0px_#1e1e24] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[5px_5px_0px_#1e1e24]"
                  }`}
                  onClick={() => toggleCity(city.id as any)}
                >
                  {/* Custom Checkbox Square */}
                  <div className="w-5 h-5 border-3 border-[#1e1e24] bg-white rounded flex items-center justify-center shrink-0">
                    {isSelected && (
                      <Icon
                        name="check"
                        size={12}
                        className="text-[#1e1e24] font-bold"
                      />
                    )}
                  </div>
                  <Icon name={city.icon} size={16} />
                  <span className="font-extrabold text-sm text-[#1e1e24]">
                    {city.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Distance Selection Row - RADIOS */}
        <div className="filter-section mt-6 flex flex-col gap-3">
          <h3 className="section-title-label text-sm font-bold text-[#1e1e24] flex items-center gap-1.5 m-0">
            <Icon name="target" size={16} /> Bán Kính Lọc Địa Lý:
          </h3>
          <div className="flex flex-col gap-2.5 mt-1">
            {[
              { id: "2", name: "Trong vòng 2 km" },
              { id: "5", name: "Trong vòng 5 km" },
              { id: "10", name: "Trong vòng 10 km" },
              { id: "20", name: "Trong vòng 20 km" },
              { id: "all", name: "Không giới hạn" },
            ].map((opt) => {
              const isSelected = tempDistance === opt.id;
              const isDisabled = opt.id !== "all" && userLat === null;
              return (
                <div
                  key={opt.id}
                  className={`flex items-center gap-3 p-3.5 rounded-lg border-3 border-[#1e1e24] transition-all duration-100 ${
                    isDisabled
                      ? "bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed shadow-none"
                      : isSelected
                        ? "bg-[#9ee3b2] translate-x-[2px] translate-y-[2px] shadow-[1px_1px_0px_#1e1e24] cursor-pointer"
                        : "bg-white shadow-[4px_4px_0px_#1e1e24] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[5px_5px_0px_#1e1e24] cursor-pointer"
                  }`}
                  onClick={() => !isDisabled && setTempDistance(opt.id)}
                >
                  {/* Custom Radio Circle */}
                  <div
                    className={`w-5 h-5 border-3 rounded-full bg-white flex items-center justify-center shrink-0 ${
                      isDisabled ? "border-gray-300" : "border-[#1e1e24]"
                    }`}
                  >
                    {isSelected && (
                      <div className="w-2.5 h-2.5 rounded-full bg-[#1e1e24]" />
                    )}
                  </div>
                  <span className="font-extrabold text-sm">{opt.name}</span>
                </div>
              );
            })}
          </div>

          {userLat === null && (
            <p className="gps-warning-hint text-xs font-bold text-[#dc2626] mt-1 flex items-center gap-1.5">
              <Icon name="alert-triangle" size={14} /> Cần bật vị trí (GPS) để
              lọc theo bán kính km.
            </p>
          )}
        </div>

        {/* GPS Status bar */}
        <div className="gps-status-pill mt-6 p-2.5 bg-bgCream border-2 border-[#1e1e24] rounded-md flex items-center gap-2">
          {isTrackingGPS ? (
            <>
              <span className="gps-dot pulsing w-2 h-2 rounded-full border border-[#1e1e24] bg-[#eab308] animate-pulse"></span>
              <span className="gps-text text-xs font-bold text-[#1e1e24]">
                Đang lấy vị trí GPS...
              </span>
            </>
          ) : userLat !== null ? (
            <>
              <span className="gps-dot success w-2 h-2 rounded-full border border-[#1e1e24] bg-[#10b981]"></span>
              <span className="gps-text text-xs font-bold text-[#1e1e24]">
                Đã định vị thành công
              </span>
            </>
          ) : (
            <>
              <span className="gps-dot warning w-2 h-2 rounded-full border border-[#1e1e24] bg-[#ef4444]"></span>
              <span className="gps-text text-xs font-bold text-[#1e1e24]">
                Chưa bật định vị GPS
              </span>
            </>
          )}
        </div>

        <div className="apply-action-bar mt-5">
          <button
            type="button"
            className="btn btn-primary btn-apply-full w-full py-3 text-[0.98rem] flex items-center justify-center gap-1.5"
            onClick={handleApply}
          >
            <Icon name="check-circle" size={18} /> Áp Dụng Bộ Lọc
          </button>
        </div>
      </div>
    </div>
  );
}
