import React, { useState, useEffect } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "../libs/firebase";
import MeetupList from "../components/MeetupList";
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
  hostFcmToken?: string;
  pendingUids?: string[];
  approvedPendingUids?: string[];
  approvedUids?: string[];
}

interface Props {
  meetups: Meetup[];
  userLat: number | null;
  userLng: number | null;
  selectedCities: ("HCM" | "HN" | "OTHER")[];
  selectedDistance: string;
  isTrackingGPS: boolean;
  gpsError: boolean;
  isLoading?: boolean;
}

export default function MyMeetupsRoute({
  meetups,
  userLat,
  userLng,
  selectedCities = [],
  selectedDistance = "all",
  isTrackingGPS,
  gpsError,
  isLoading = false,
}: Props) {
  const [currentUser, setCurrentUser] = useState<User | null>(auth.currentUser);
  const [selectedStatuses, setSelectedStatuses] = useState<("host" | "member" | "pending")[]>(
    ["host", "member", "pending"]
  );

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return unsub;
  }, []);

  const toggleStatus = (status: "host" | "member" | "pending") => {
    setSelectedStatuses((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
  };

  // Filter meetups related to current user
  const myMeetups = currentUser
    ? meetups.filter((m) => {
        const uid = currentUser.uid;
        const isUserHost = m.hostUid === uid || m.host_uid === uid;
        const isUserMember = Array.isArray(m.approvedUids) && m.approvedUids.includes(uid);
        const isUserPending =
          (Array.isArray(m.pendingUids) && m.pendingUids.includes(uid)) ||
          (Array.isArray(m.approvedPendingUids) && m.approvedPendingUids.includes(uid));

        if (isUserHost && selectedStatuses.includes("host")) return true;
        if (isUserMember && !isUserHost && selectedStatuses.includes("member")) return true;
        if (isUserPending && selectedStatuses.includes("pending")) return true;
        return false;
      })
    : [];

  return (
    <section id="my-meetups-route" className="pb-[60px]">
      <h2 className="section-title">Các Kèo Của Bạn</h2>

      {currentUser ? (
        <>
          {/* Tab Filter Bar (Neo-brutalist Checkbox Style) */}
          <div className="cartoon-card my-meetups-filter mb-6 p-[18px] bg-[#fffefb] flex flex-col md:flex-row gap-3 items-start md:items-center">
            <span className="filter-label font-extrabold text-[0.95rem] text-[#1e1e24] shrink-0">Lọc theo vai trò (Chọn nhiều):</span>
            <div className="tab-btn-group flex flex-wrap gap-3 w-full md:w-auto">
              {[
                { id: "host" as const, label: "Tôi làm Host", icon: "crown" },
                { id: "member" as const, label: "Đã tham gia", icon: "check-circle" },
                { id: "pending" as const, label: "Đang chờ duyệt", icon: "clock" },
              ].map((opt) => {
                const isSelected = selectedStatuses.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    className={`filter-checkbox-btn flex items-center gap-2 py-2 px-4 text-[0.85rem] font-bold border-3 border-[#1e1e24] rounded-lg cursor-pointer transition-all duration-100 outline-none ${
                      isSelected
                        ? "bg-pastelYellow translate-x-[2px] translate-y-[2px] shadow-[1px_1px_0_#1e1e24]"
                        : "bg-white shadow-[3px_3px_0_#1e1e24] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0_#1e1e24] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0_#1e1e24]"
                    }`}
                    onClick={() => toggleStatus(opt.id)}
                  >
                    {/* Custom Checkbox Square */}
                    <div className="w-4 h-4 border-2 border-[#1e1e24] bg-white rounded flex items-center justify-center shrink-0">
                      {isSelected && <Icon name="check" size={10} className="text-[#1e1e24] font-extrabold" />}
                    </div>
                    <Icon name={opt.icon} size={14} className="chip-icon inline" />
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Render filtered meetup cards */}
          <MeetupList
            meetups={myMeetups}
            userLat={userLat}
            userLng={userLng}
            selectedCities={selectedCities}
            selectedDistance={selectedDistance}
            isTrackingGPS={isTrackingGPS}
            gpsError={gpsError}
            isLoading={isLoading}
            showExpired={true}
          />
        </>
      ) : (
        <div className="cartoon-card locked-card p-10 bg-[#fffefb] text-center mt-5 border-3 border-[#1e1e24] shadow-neo rounded-2xl">
          <div className="locked-icon flex justify-center items-center mb-4 text-[#1e1e24]">
            <Icon name="lock" size={40} />
          </div>
          <h4 className="locked-title text-xl font-bold mb-2 text-[#1e1e24]">Cần Đăng Nhập Tài Khoản</h4>
          <p className="locked-description text-[0.95rem] font-semibold text-[#666666] max-w-[360px] mx-auto mb-6 leading-relaxed">
            Bạn cần đăng nhập để xem danh sách các kèo chơi boardgame mà bạn làm host hoặc đã đăng ký tham gia chơi!
          </p>
          <a href="#/profile" className="login-link-btn inline-flex items-center gap-2 py-3 px-7 text-[0.95rem] font-extrabold border-3 border-[#1e1e24] rounded-lg bg-pastelYellow text-[#1e1e24] shadow-neo no-underline">
            <Icon name="key" size={16} />
            <span>Đi tới trang Đăng nhập</span>
          </a>
        </div>
      )}
    </section>
  );
}
