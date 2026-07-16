import React, { useState, useEffect } from "react";
import {
  subscribeToMeetupRequests,
  approveMember,
  rejectMember,
  kickOrLeaveMember,
  requestToJoin,
  cancelJoinRequest,
  confirmParticipation,
  isApprovedMember,
  type MeetupRequest,
} from "../api/meetupService";
import { goBack, navigate } from "../libs/router";
import Icon from "../components/Icon";

import { type User } from "firebase/auth";

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
  approvedPendingUids?: string[];
  approvedUids?: string[];
}

interface Props {
  meetup: Meetup | null;
  currentUser: User | null;
}

export default function MeetupDetailRoute({ meetup, currentUser }: Props) {
  const [requests, setRequests] = useState<MeetupRequest[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const hostUid = meetup?.hostUid || meetup?.host_uid;
  const isHost = currentUser && hostUid && currentUser.uid === hostUid;

  useEffect(() => {
    if (meetup?.id) {
      const unsubscribe = subscribeToMeetupRequests(meetup.id, (list) => {
        setRequests(list);
      });
      return unsubscribe;
    } else {
      setRequests([]);
    }
  }, [meetup?.id]);

  const pendingRequests = requests.filter((r) => r.status === "pending");
  
  const approvedUids = meetup?.approvedUids || [];
  const approvedPendingUids = meetup?.approvedPendingUids || [];
  
  // Confirmed members (both host accepted & player confirmed)
  const confirmedRequests = requests.filter((r) => r.status === "approved" && approvedUids.includes(r.uid));
  
  // Approved pending members (host accepted but player has not confirmed yet)
  const approvedPendingRequests = requests.filter((r) => r.status === "approved" && approvedPendingUids.includes(r.uid));

  // Status variables
  const count = meetup?.playersCount || meetup?.players_count || 1;
  const needed = meetup?.playersNeeded || meetup?.players_needed || 4;
  const isFull = count >= needed;

  const isApproved = isApprovedMember(meetup, currentUser?.uid);
  const isApprovedPending = currentUser ? approvedPendingUids.includes(currentUser.uid) : false;

  const myRequest = currentUser ? requests.find((r) => r.uid === currentUser.uid) || null : null;
  const isPending = myRequest?.status === "pending";

  async function handleJoinRequest() {
    if (!meetup?.id || !currentUser || isProcessing) return;
    setIsProcessing(true);
    try {
      await requestToJoin(meetup.id, currentUser);
    } catch (e: any) {
      alert(e.message || "Không thể gửi yêu cầu tham gia!");
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleCancelRequest() {
    if (!meetup?.id || !currentUser || isProcessing) return;
    setIsProcessing(true);
    try {
      await cancelJoinRequest(meetup.id, currentUser.uid);
    } catch (e: any) {
      alert(e.message || "Không thể hủy yêu cầu!");
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleConfirmParticipation() {
    if (!meetup?.id || !currentUser || isProcessing) return;
    setIsProcessing(true);
    try {
      const name = currentUser.displayName || currentUser.email || "Thành viên";
      await confirmParticipation(meetup.id, currentUser.uid, name);
    } catch (e: any) {
      alert(e.message || "Xác nhận tham gia kèo thất bại!");
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleLeaveVoluntarily() {
    if (!meetup?.id || !currentUser || isProcessing) return;
    if (!window.confirm("Bạn có chắc chắn muốn rời khỏi kèo chơi này?")) return;
    setIsProcessing(true);
    try {
      const name = currentUser.displayName || currentUser.email || "Thành viên";
      // kickOrLeaveMember calls with isKick = false
      await kickOrLeaveMember(meetup.id, currentUser.uid, name, false);
      alert("Đã rời kèo chơi thành công.");
    } catch (e: any) {
      alert(e.message || "Không thể rời kèo!");
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleApprove(playerUid: string) {
    if (!meetup?.id || isProcessing) return;
    setIsProcessing(true);
    try {
      await approveMember(meetup.id, playerUid);
    } catch (err) {
      console.error("Approve error:", err);
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleReject(playerUid: string) {
    if (!meetup?.id || isProcessing) return;
    setIsProcessing(true);
    try {
      await rejectMember(meetup.id, playerUid);
    } catch (err) {
      console.error("Reject error:", err);
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleKick(playerUid: string) {
    if (!meetup?.id || isProcessing) return;
    setIsProcessing(true);
    try {
      const playerReq = requests.find((r) => r.uid === playerUid);
      const playerName = playerReq ? playerReq.name : "Thành viên";
      await kickOrLeaveMember(meetup.id, playerUid, playerName, true);
    } catch (err) {
      console.error("Kick error:", err);
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <div className="fullscreen-route-view meetup-detail-route w-full flex flex-col gap-5 pb-10">
      {!meetup ? (
        <div className="cartoon-card no-meetup-card m-auto text-center p-10 bg-white border-3 border-[#1e1e24] shadow-neo rounded-2xl">
          <h3 className="text-xl font-bold mb-4">
            Chưa chọn kèo chơi để xem chi tiết!
          </h3>
          <button className="btn btn-primary" onClick={goBack}>
            Quay lại danh sách kèo
          </button>
        </div>
      ) : (
        <>
          {/* Top Navigation */}
          <div className="cartoon-card route-top-nav bg-pastelYellow flex items-center gap-4 p-[16px_24px] rounded-lg shadow-neo text-left">
            <button
              type="button"
              className="btn btn-secondary back-btn py-2 px-4 text-[0.95rem] whitespace-nowrap"
              onClick={goBack}
            >
              ← Quay lại
            </button>
            <div className="nav-title-group">
              <h2 className="text-[1.3rem] font-extrabold m-0 flex items-center gap-2">
                <Icon name="users" size={22} className="inline" />{" "}
                {isHost
                  ? "Bảng Quản Lý Thành Viên Kèo"
                  : "Thông Tin Thành Viên Kèo"}
              </h2>
              <span className="sub-title text-[0.85rem] font-semibold text-[#1e1e24]">
                Host: {meetup.hostName || meetup.host_name || "Ẩn danh"} • Kèo:{" "}
                {meetup.title}
              </span>
            </div>
          </div>

          {/* Body Card */}
          <div className="cartoon-card manage-body-card bg-[#fffefb] p-[28px_24px] text-left flex flex-col gap-5 border-3 border-[#1e1e24] rounded-2xl shadow-neo animate-[bubble-pop_0.15s_ease-out]">
            <div className="summary-bar flex flex-col justify-between bg-pastelCyan p-[12px_20px] border-3 border-[#1e1e24] rounded-md shadow-neo text-[0.95rem] flex-wrap gap-3">
              <p className="meetup-name-badge inline-flex items-center gap-1.5">
                <Icon name="dice" size={16} className="inline" /> Game:{" "}
                <strong>{meetup.game}</strong>
              </p>
            </div>

            {/* User Action Section */}
            <div className="user-action-block border-3 border-dashed border-[#1e1e24] p-5 rounded-lg bg-[#fbf7ed] flex flex-col gap-3">
              <h4 className="font-extrabold text-[0.95rem] text-[#1e1e24] flex items-center gap-1.5 m-0">
                <Icon name="settings" size={16} className="inline" /> Hành động của bạn:
              </h4>

              <div className="flex flex-wrap gap-3 items-center mt-1">
                {!currentUser ? (
                  <span className="text-sm font-bold text-[#666666] italic">
                    Vui lòng đăng nhập ở tab Hồ sơ để xin tham gia kèo chơi.
                  </span>
                ) : isHost ? (
                  <>
                    <button
                      type="button"
                      className="btn btn-success py-2.5 px-5 font-bold"
                      onClick={() => navigate({ name: "chat", meetupId: meetup.id })}
                    >
                      <Icon name="chat" size={15} className="inline" /> Vào chat box thảo luận
                    </button>
                    <span className="text-xs font-extrabold text-pastelPurple bg-[#f3e8ff] border-2 border-pastelPurple p-[4px_10px] rounded">
                      ★ Bạn đang quản lý kèo này với tư cách Host
                    </span>
                  </>
                ) : isApproved ? (
                  <>
                    <button
                      type="button"
                      className="btn btn-success py-2.5 px-5 font-bold"
                      onClick={() => navigate({ name: "chat", meetupId: meetup.id })}
                    >
                      <Icon name="chat" size={15} className="inline" /> Vào chat box thảo luận
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary py-2.5 px-5 font-bold bg-pastelPink text-[#1e1e24]"
                      onClick={handleLeaveVoluntarily}
                      disabled={isProcessing}
                    >
                      <Icon name="log-out" size={15} className="inline" /> Rời khỏi kèo
                    </button>
                  </>
                ) : isApprovedPending ? (
                  <div className="flex flex-col gap-3 w-full text-left">
                    <p className="text-sm font-extrabold text-[#d97706] flex items-center gap-1.5 m-0">
                      <Icon name="alert-triangle" size={16} className="inline" /> Host đã duyệt yêu cầu! Hãy xác nhận tham gia để vào phòng chơi.
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        className="btn btn-primary py-2.5 px-5 font-bold bg-pastelYellow text-[#1e1e24]"
                        onClick={handleConfirmParticipation}
                        disabled={isProcessing}
                      >
                        <Icon name="check" size={15} className="inline" /> Xác nhận tham gia
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary py-2.5 px-5 font-bold"
                        onClick={handleCancelRequest}
                        disabled={isProcessing}
                      >
                        <Icon name="x" size={15} className="inline" /> Hủy yêu cầu
                      </button>
                    </div>
                  </div>
                ) : isPending ? (
                  <div className="flex flex-col gap-3 w-full text-left">
                    <p className="text-sm font-extrabold text-[#2563eb] flex items-center gap-1.5 m-0">
                      <Icon name="clock" size={16} className="inline" /> Yêu cầu tham gia của bạn đang chờ Host xét duyệt...
                    </p>
                    <button
                      type="button"
                      className="btn btn-secondary py-2.5 px-5 font-bold self-start"
                      onClick={handleCancelRequest}
                      disabled={isProcessing}
                    >
                      <Icon name="x" size={15} className="inline" /> Hủy yêu cầu tham gia
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className={`btn py-2.5 px-5 font-bold ${
                      isFull ? "bg-gray-100 text-gray-400 cursor-not-allowed shadow-none border-gray-300" : "btn-success bg-[#9ee3b2]"
                    }`}
                    onClick={handleJoinRequest}
                    disabled={isProcessing || isFull}
                  >
                    <Icon name="plus" size={15} className="inline" />
                    <span>{isFull ? "Kèo đã đầy sĩ số" : isProcessing ? "Đang gửi..." : "Gửi yêu cầu tham gia"}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Pending Section (Only for Host) */}
            {isHost && (
              <div className="members-block flex flex-col gap-3">
                <h3 className="block-title text-[1.1rem] font-extrabold text-[#1e1e24] flex items-center gap-2">
                  <Icon name="clock" size={18} className="inline" /> Yêu cầu
                  tham gia mới ({pendingRequests.length}):
                </h3>

                {pendingRequests.length === 0 ? (
                  <div className="empty-list-box p-[16px_20px] bg-bgCream border-3 border-dashed border-[#1e1e24] rounded-md text-sm font-semibold text-[#666666]">
                    <span>
                      Chưa có yêu cầu tham gia mới nào đang chờ duyệt.
                    </span>
                  </div>
                ) : (
                  <div className="members-grid grid grid-cols-1 md:grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
                    {pendingRequests.map((req) => (
                      <div
                        className="member-item-card pending-item flex flex-col justify-between p-[14px_16px] bg-white border-3 border-[#1e1e24] rounded-md shadow-neo gap-3"
                        key={req.uid}
                      >
                        <div className="user-profile-row flex items-center gap-2.5">
                          <span className="user-icon flex items-center justify-center">
                            <Icon name="user" size={18} />
                          </span>
                          <span className="user-name text-[1rem] font-extrabold">
                            {req.name}
                          </span>
                        </div>

                        <div className="item-actions flex gap-2">
                          <button
                            className="btn btn-success action-sm-btn flex items-center gap-1 p-[8px_14px] text-[0.85rem] rounded-md"
                            onClick={() => handleApprove(req.uid)}
                            disabled={isProcessing}
                          >
                            <Icon name="check" size={14} className="inline" />{" "}
                            Duyệt vào kèo
                          </button>
                          <button
                            className="btn btn-secondary action-sm-btn flex items-center gap-1 p-[8px_14px] text-[0.85rem] rounded-md"
                            onClick={() => handleReject(req.uid)}
                            disabled={isProcessing}
                          >
                            <Icon name="x" size={14} className="inline" /> Từ
                            chối
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Approved Members Section */}
            <div className="members-block flex flex-col gap-3 mt-4">
              <h3 className="block-title text-[1.1rem] font-extrabold text-[#1e1e24] flex items-center gap-2">
                <Icon name="check-circle" size={18} className="inline" /> Người
                chơi đã tham gia ({1 + confirmedRequests.length}/
                {meetup.playersNeeded || meetup.players_needed}):
              </h3>

              <div className="members-grid grid grid-cols-1 md:grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
                {/* 1. Host Card */}
                <div className="member-item-card host-card flex justify-between items-center p-[14px_16px] bg-white border-3 border-[#1e1e24] rounded-md shadow-neo gap-3">
                  <div className="user-profile-row flex items-center gap-2.5">
                    <span className="user-icon flex items-center justify-center">
                      <Icon name="user" size={18} />
                    </span>
                    <span className="user-name text-[0.98rem] font-extrabold">
                      {meetup.hostName || meetup.host_name || "Ẩn danh"}
                    </span>
                    <span className="text-xs text-pastelPurple font-bold">
                      (Host)
                    </span>
                  </div>
                </div>

                {/* 2. Confirmed Members */}
                {confirmedRequests.map((req) => (
                  <div
                    className="member-item-card approved-item flex justify-between items-center p-[14px_16px] bg-white border-3 border-[#1e1e24] rounded-md shadow-neo gap-3"
                    key={req.uid}
                  >
                    <div className="user-profile-row flex items-center gap-2.5">
                      <span className="user-icon flex items-center justify-center">
                        <Icon name="user" size={18} />
                      </span>
                      <span className="user-name text-[0.98rem] font-extrabold">
                        {req.name}
                      </span>
                    </div>

                    {isHost && (
                      <button
                        className="btn btn-secondary action-sm-btn kick-btn bg-pastelPink flex items-center gap-1 p-[8px_14px] text-[0.85rem] rounded-md"
                        onClick={() => handleKick(req.uid)}
                        disabled={isProcessing}
                      >
                        <Icon name="log-out" size={14} className="inline" />
                        Đuổi
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Approved Pending Members (Waiting to confirm) */}
            {approvedPendingRequests.length > 0 && (
              <div className="members-block flex flex-col gap-3 mt-4">
                <h3 className="block-title text-[1.1rem] font-extrabold text-[#d97706] flex items-center gap-2">
                  <Icon name="clock" size={18} className="inline text-[#d97706]" /> Đang chờ người chơi xác nhận ({approvedPendingRequests.length}):
                </h3>

                <div className="members-grid grid grid-cols-1 md:grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
                  {approvedPendingRequests.map((req) => (
                    <div
                      className="member-item-card pending-confirm-item flex justify-between items-center p-[14px_16px] bg-[#fffbeb] border-3 border-[#1e1e24] rounded-md shadow-neo gap-3"
                      key={req.uid}
                    >
                      <div className="user-profile-row flex items-center gap-2.5">
                        <span className="user-icon flex items-center justify-center text-[#d97706]">
                          <Icon name="user" size={18} />
                        </span>
                        <span className="user-name text-[0.98rem] font-extrabold">
                          {req.name}
                        </span>
                      </div>

                      <span className="text-xs font-bold text-[#d97706] italic bg-white border border-[#d97706] p-[2px_8px] rounded shrink-0">
                        Chờ xác nhận
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
