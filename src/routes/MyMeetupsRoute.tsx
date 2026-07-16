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
  selectedCity: "all" | "HCM" | "HN";
  selectedDistance: "all" | "5" | "10";
  isTrackingGPS: boolean;
  gpsError: boolean;
  isLoading?: boolean;
}

export default function MyMeetupsRoute({
  meetups,
  userLat,
  userLng,
  selectedCity = "all",
  selectedDistance = "all",
  isTrackingGPS,
  gpsError,
  isLoading = false,
}: Props) {
  const [currentUser, setCurrentUser] = useState<User | null>(auth.currentUser);
  const [activeTab, setActiveTab] = useState<"all" | "host" | "member" | "pending">("all");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return unsub;
  }, []);

  // Filter meetups related to current user
  const myMeetups = currentUser
    ? meetups.filter((m) => {
        const uid = currentUser.uid;
        const isUserHost = m.hostUid === uid || m.host_uid === uid;
        const isUserMember = Array.isArray(m.approvedUids) && m.approvedUids.includes(uid);
        const isUserPending =
          (Array.isArray(m.pendingUids) && m.pendingUids.includes(uid)) ||
          (Array.isArray(m.approvedPendingUids) && m.approvedPendingUids.includes(uid));

        if (activeTab === "all") {
          return isUserHost || isUserMember || isUserPending;
        }
        if (activeTab === "host") {
          return isUserHost;
        }
        if (activeTab === "member") {
          return isUserMember && !isUserHost;
        }
        if (activeTab === "pending") {
          return isUserPending;
        }
        return false;
      })
    : [];

  return (
    <section id="my-meetups-route" className="pb-[60px]">
      <h2 className="section-title">Các Kèo Của Bạn</h2>

      {currentUser ? (
        <>
          {/* Tab Filter Bar (Neo-brutalist Style) */}
          <div className="cartoon-card my-meetups-filter mb-6 p-[15px] bg-[#fffefb] flex flex-wrap gap-2.5 justify-center items-center">
            <span className="filter-label font-extrabold text-[0.95rem] mr-2 text-[#1e1e24]">Lọc kèo:</span>
            <div className="tab-btn-group flex flex-wrap gap-2">
              <button
                type="button"
                className={`tab-btn-pill py-2 px-4 text-[0.85rem] font-bold border-3 border-[#1e1e24] rounded-full cursor-pointer transition-all duration-100 outline-none bg-white shadow-[3px_3px_0_#1e1e24] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0_#1e1e24] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none ${
                  activeTab === "all" ? "bg-pastelYellow shadow-[2px_2px_0_#1e1e24] translate-x-[1px] translate-y-[1px]" : ""
                }`}
                onClick={() => setActiveTab("all")}
              >
                <Icon name="dice" size={15} className="mr-1 inline" />
                <span>Tất cả kèo</span>
              </button>
              <button
                type="button"
                className={`tab-btn-pill py-2 px-4 text-[0.85rem] font-bold border-3 border-[#1e1e24] rounded-full cursor-pointer transition-all duration-100 outline-none bg-white shadow-[3px_3px_0_#1e1e24] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0_#1e1e24] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none ${
                  activeTab === "host" ? "bg-pastelYellow shadow-[2px_2px_0_#1e1e24] translate-x-[1px] translate-y-[1px]" : ""
                }`}
                onClick={() => setActiveTab("host")}
              >
                <Icon name="crown" size={15} className="mr-1 inline" />
                <span>Tôi làm Host</span>
              </button>
              <button
                type="button"
                className={`tab-btn-pill py-2 px-4 text-[0.85rem] font-bold border-3 border-[#1e1e24] rounded-full cursor-pointer transition-all duration-100 outline-none bg-white shadow-[3px_3px_0_#1e1e24] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0_#1e1e24] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none ${
                  activeTab === "member" ? "bg-pastelYellow shadow-[2px_2px_0_#1e1e24] translate-x-[1px] translate-y-[1px]" : ""
                }`}
                onClick={() => setActiveTab("member")}
              >
                <Icon name="check-circle" size={15} className="mr-1 inline" />
                <span>Đã tham gia</span>
              </button>
              <button
                type="button"
                className={`tab-btn-pill py-2 px-4 text-[0.85rem] font-bold border-3 border-[#1e1e24] rounded-full cursor-pointer transition-all duration-100 outline-none bg-white shadow-[3px_3px_0_#1e1e24] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0_#1e1e24] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none ${
                  activeTab === "pending" ? "bg-pastelYellow shadow-[2px_2px_0_#1e1e24] translate-x-[1px] translate-y-[1px]" : ""
                }`}
                onClick={() => setActiveTab("pending")}
              >
                <Icon name="clock" size={15} className="mr-1 inline" />
                <span>Đang chờ duyệt</span>
              </button>
            </div>
          </div>

          {/* Render filtered meetup cards */}
          <MeetupList
            meetups={myMeetups}
            userLat={userLat}
            userLng={userLng}
            selectedCity={selectedCity}
            selectedDistance={selectedDistance}
            isTrackingGPS={isTrackingGPS}
            gpsError={gpsError}
            showFilterBar={false}
            isLoading={isLoading}
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
