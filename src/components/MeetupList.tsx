import React, { useState, useEffect } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "../libs/firebase";
import { navigate, navigateToTab } from "../libs/router";
import Icon from "./Icon";

import {
  isApprovedMember,
  isHost,
  requestToJoin,
  cancelJoinRequest,
  subscribeToMeetupRequests,
  confirmParticipation,
  type MeetupRequest,
} from "../api/meetupService";

import { calculateDistance, getMeetupCity } from "../utils/geo";
import { formatTime } from "../utils/time";

interface Meetup {
  id: string;
  title: string;
  game: string;
  hostName?: string;
  host_name?: string;
  hostUid?: string;
  host_uid?: string;
  playersCount?: number;
  players_count?: number;
  playersNeeded?: number;
  players_needed?: number;
  time: string;
  lat: number;
  lng: number;
  color?: string;
  approvedUids?: string[];
  confirmedUids?: string[];
}

interface Props {
  meetups: Meetup[];
  selectedCities: ("HCM" | "HN" | "OTHER")[];
  selectedDistance: string;
  userLat: number | null;
  userLng: number | null;
  isTrackingGPS: boolean;
  gpsError: boolean;
  onSelectMeetupOnMap?: (meetupId: string, lat: number, lng: number) => void;
  isLoading?: boolean;
}

export default function MeetupList({
  meetups,
  selectedCities,
  selectedDistance,
  userLat,
  userLng,
  isTrackingGPS,
  gpsError,
  onSelectMeetupOnMap,
  isLoading = false,
}: Props) {
  const [currentUser, setCurrentUser] = useState<User | null>(auth.currentUser);

  // Sync auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return unsubscribe;
  }, []);

  return (
    <div className="meetup-list-comp flex flex-col gap-4 text-left">
      {isLoading ? (
        <div className="skeleton-meetup-list flex flex-col gap-4">
          {[1, 2, 3].map((n) => (
            <div className="cartoon-card meetup-card skeleton-card bg-white p-4 border-3 border-[#1e1e24] rounded-2xl shadow-neo flex flex-col gap-3.5" key={n}>
              <div className="skeleton skeleton-line long h-5 bg-gray-200 rounded w-2/3"></div>
              <div className="skeleton skeleton-line medium h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="flex gap-2">
                <div className="skeleton skeleton-badge w-20 h-6 bg-gray-200 rounded-full"></div>
                <div className="skeleton skeleton-badge w-24 h-6 bg-gray-200 rounded-full"></div>
              </div>
            </div>
          ))}
        </div>
      ) : meetups.length === 0 ? (
        <div className="cartoon-card empty-card text-center p-10 bg-white border-3 border-[#1e1e24] rounded-2xl shadow-neo flex flex-col items-center gap-3">
          <div className="empty-state-icon text-[3.5rem]"><Icon name="dice" size={48} /></div>
          <h3 className="text-xl font-bold text-[#1e1e24]">Không tìm thấy kèo chơi phù hợp!</h3>
          <p className="text-sm font-semibold text-[#666666] max-w-[340px] leading-relaxed">
            Hiện tại không có kèo nào khớp với bộ lọc thành phố hoặc khoảng cách của bạn. Bạn hãy đổi bộ lọc hoặc tự mình lên kèo mới nhé!
          </p>
          <button className="btn btn-primary mt-2" onClick={() => navigateToTab("create")}>
            <Icon name="plus" size={16} className="mr-1 inline" /> Tự lên kèo chơi mới
          </button>
        </div>
      ) : (
        <div className="meetups-list-grid flex flex-col gap-4">
          {meetups.map((m) => (
            <MeetupCard
              key={m.id}
              meetup={m}
              currentUser={currentUser}
              userLat={userLat}
              userLng={userLng}
              onSelectOnMap={onSelectMeetupOnMap}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── INNER COMPONENT: MeetupCard (Subscribes to its own requests state) ──────
function MeetupCard({
  meetup,
  currentUser,
  userLat,
  userLng,
  onSelectOnMap,
}: {
  meetup: Meetup;
  currentUser: User | null;
  userLat: number | null;
  userLng: number | null;
  onSelectOnMap?: (meetupId: string, lat: number, lng: number) => void;
}) {
  const [requests, setRequests] = useState<MeetupRequest[]>([]);
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false);

  useEffect(() => {
    if (meetup.id) {
      const unsubscribe = subscribeToMeetupRequests(meetup.id, (list) => {
        setRequests(list);
      });
      return unsubscribe;
    }
  }, [meetup.id]);

  const count = meetup.playersCount || meetup.players_count || 1;
  const needed = meetup.playersNeeded || meetup.players_needed || 4;
  const hostName = meetup.hostName || meetup.host_name || "Ẩn danh";
  const hostUid = meetup.hostUid || meetup.host_uid;

  const isUserHost = isHost(meetup, currentUser?.uid);
  const isApproved = isApprovedMember(meetup, currentUser?.uid);

  // Check if player is approved but pending confirmation
  const approvedPendingUids = meetup.approvedPendingUids || [];
  const isApprovedPending = currentUser ? approvedPendingUids.includes(currentUser.uid) : false;

  // Check if player has sent request
  const myRequest = currentUser ? requests.find((r) => r.uid === currentUser.uid) || null : null;
  const isPending = myRequest?.status === "pending";

  const isFull = count >= needed;

  // Calculate distance
  const distance =
    userLat !== null && userLng !== null
      ? calculateDistance(userLat, userLng, meetup.lat, meetup.lng)
      : null;

  async function handleJoinRequest() {
    if (!currentUser || isActionLoading) return;
    setIsActionLoading(true);
    try {
      await requestToJoin(meetup.id, currentUser);
    } catch (e: any) {
      alert(e.message || "Không thể gửi yêu cầu tham gia!");
    } finally {
      setIsActionLoading(false);
    }
  }

  async function handleCancelRequest() {
    if (!currentUser || isActionLoading) return;
    setIsActionLoading(true);
    try {
      await cancelJoinRequest(meetup.id, currentUser.uid);
    } catch (e: any) {
      alert(e.message || "Không thể hủy yêu cầu!");
    } finally {
      setIsActionLoading(false);
    }
  }

  async function handleConfirmParticipation() {
    if (!currentUser || isActionLoading) return;
    setIsActionLoading(true);
    try {
      const name = currentUser.displayName || currentUser.email || "Thành viên";
      await confirmParticipation(meetup.id, currentUser.uid, name);
    } catch (e: any) {
      alert(e.message || "Xác nhận tham gia kèo thất bại!");
    } finally {
      setIsActionLoading(false);
    }
  }

  return (
    <div
      className="cartoon-card meetup-card bg-white p-4 border-3 border-[#1e1e24] rounded-2xl shadow-neo flex flex-col gap-3.5 text-left transition-all duration-100 hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[6px_6px_0px_#1e1e24]"
      style={{ borderLeft: `8px solid ${meetup.color || "#bca0f5"}` }}
    >
      <div className="card-top-header flex justify-between items-start gap-3 w-full">
        <div className="card-title-block flex-1 min-w-0">
          <h3 
            className="meetup-title-text font-extrabold text-[1.3rem] text-[#1e1e24] m-0 mb-1 leading-snug line-clamp-2 hover:underline cursor-pointer hover:text-pastelPurple transition-colors"
            onClick={() => currentUser && navigate({ name: "meetup-detail", meetupId: meetup.id })}
            title={currentUser ? "Bấm để xem chi tiết" : "Đăng nhập để xem chi tiết"}
          >
            {meetup.title}
          </h3>
          <span className="meetup-game flex items-center gap-1.5 text-xs font-bold text-[#666666]">
            <Icon name="dice" size={13} className="inline" /> Game: <strong>{meetup.game}</strong>
          </span>
        </div>
        {distance !== null && (
          <span className="distance-badge font-extrabold text-[0.72rem] bg-pastelCyan border-2 border-[#1e1e24] p-[3px_8px] rounded-full shadow-[1.5px_1.5px_0_#1e1e24] flex items-center gap-1 shrink-0">
            <Icon name="distance" size={11} className="inline" /> {distance.toFixed(1)} km
          </span>
        )}
      </div>

      <div className="meetup-card-body flex flex-col gap-2 border-t-2 border-b-2 border-dashed border-[#1e1e24] py-3 text-xs font-semibold text-[#1e1e24]">
        <div className="meetup-info-row flex items-center gap-1.5">
          <Icon name="clock" size={13} className="inline text-[#666666]" />
          <span>Giờ chơi: <strong>{formatTime(meetup.time)}</strong></span>
        </div>
        <div className="meetup-info-row flex items-center gap-1.5">
          <Icon name="users" size={13} className="inline text-[#666666]" />
          <span>Sĩ số kèo: <strong>{count}/{needed} người</strong></span>
        </div>
        <div className="meetup-info-row flex items-center gap-1.5">
          <Icon name="user" size={13} className="inline text-[#666666]" />
          <span>Host của kèo: <strong>{hostName}</strong></span>
        </div>
      </div>

      <div className="card-actions flex flex-wrap gap-2.5 items-center justify-between mt-1">
        <div className="left-side-actions flex gap-2 flex-wrap items-center">
          {currentUser ? (
            <>
              {/* Status Badges */}
              {isUserHost && (
                <span className="text-[0.7rem] font-bold text-pastelPurple flex items-center gap-0.5 bg-[#f3e8ff] border border-pastelPurple p-[2px_8px] rounded">
                  ★ Host
                </span>
              )}
              {isApproved && (
                <span className="text-[0.7rem] font-bold text-[#10b981] flex items-center gap-0.5 bg-[#e6fcf5] border border-[#10b981] p-[2px_8px] rounded">
                  ✓ Đã tham gia
                </span>
              )}
              {isApprovedPending && (
                <span className="text-[0.7rem] font-bold text-[#f59e0b] flex items-center gap-0.5 bg-[#fffbeb] border border-[#f59e0b] p-[2px_8px] rounded">
                  ⚠ Chờ xác nhận
                </span>
              )}
              {isPending && (
                <span className="text-[0.7rem] font-bold text-[#3b82f6] flex items-center gap-0.5 bg-[#eff6ff] border border-[#3b82f6] p-[2px_8px] rounded">
                  ✉ Đang chờ duyệt
                </span>
              )}
            </>
          ) : (
            <span className="text-[0.7rem] font-bold text-[#666666] italic bg-[#fbf7ed] p-[4px_8px] rounded border border-gray-300">
              Đăng nhập để xem chi tiết
            </span>
          )}
        </div>

        {onSelectOnMap && (
          <button
            type="button"
            className="btn btn-secondary text-xs py-2 px-3 inline-flex items-center gap-1 self-end whitespace-nowrap bg-white border-[#1e1e24]"
            onClick={() => onSelectOnMap(meetup.id, meetup.lat, meetup.lng)}
          >
            <Icon name="map-pin" size={13} className="inline" /> Nhìn bản đồ
          </button>
        )}
      </div>
    </div>
  );
}
