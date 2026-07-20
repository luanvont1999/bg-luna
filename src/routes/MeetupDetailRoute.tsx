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
import { deleteDoc, doc } from "firebase/firestore";
import { db } from "../libs/firebase";
import { notifyMeetupCancellation } from "../api/notificationService";

import JoinRequestModal from "../components/JoinRequestModal";
import ManageMembersModal from "../components/ManageMembersModal";

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
  isLoading?: boolean;
}

export default function MeetupDetailRoute({
  meetup,
  currentUser,
  isLoading = false,
}: Props) {
  const [requests, setRequests] = useState<MeetupRequest[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState<boolean>(false);
  const [isManageModalOpen, setIsManageModalOpen] = useState<boolean>(false);

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
  const confirmedRequests = requests.filter(
    (r) => r.status === "approved" && approvedUids.includes(r.uid),
  );

  // Approved pending members (host accepted but player has not confirmed yet)
  const approvedPendingRequests = requests.filter(
    (r) => r.status === "approved" && approvedPendingUids.includes(r.uid),
  );

  // Status variables
  const count = meetup?.playersCount || meetup?.players_count || 1;
  const needed = meetup?.playersNeeded || meetup?.players_needed || 4;
  const isFull = count >= needed;

  const isApproved = isApprovedMember(meetup, currentUser?.uid);
  const isApprovedPending = currentUser
    ? approvedPendingUids.includes(currentUser.uid)
    : false;

  const myRequest = currentUser
    ? requests.find((r) => r.uid === currentUser.uid) || null
    : null;
  const isPending = myRequest?.status === "pending";

  async function handleJoinRequestSubmit(
    participantCount: number,
    message: string,
  ) {
    if (!meetup?.id || !currentUser || isProcessing) return;
    setIsProcessing(true);
    try {
      await requestToJoin(meetup.id, currentUser, participantCount, message);
    } catch (e: any) {
      alert(e.message || "Không thể gửi yêu cầu tham gia!");
      throw e;
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

  async function handleDeleteMeetup() {
    if (!meetup?.id || !currentUser || isProcessing) return;
    if (
      !window.confirm(
        "CẢNH BÁO: Bạn có chắc chắn muốn hủy kèo chơi này? Hành động này sẽ xoá hoàn toàn kèo và gửi thông báo đẩy đến tất cả người chơi!",
      )
    )
      return;

    setIsProcessing(true);
    try {
      // Thu thập tất cả các UIDs của người chơi liên quan
      const playerUids = Array.from(
        new Set([
          ...(meetup.approvedUids || []),
          ...(meetup.approvedPendingUids || []),
          ...(meetup.pendingUids || []),
          ...requests.map((r) => r.uid),
        ]),
      );

      const hostName = currentUser.displayName || currentUser.email || "Host";
      // Gửi thông báo đẩy hủy kèo
      await notifyMeetupCancellation(
        meetup.title,
        meetup.game,
        playerUids,
        currentUser.uid,
        hostName,
      );

      // Xoá tài liệu khỏi Firestore
      await deleteDoc(doc(db, "meetups", meetup.id));

      alert("Hủy kèo chơi thành công! Đã gửi thông báo đẩy tới người chơi.");
      goBack();
    } catch (e: any) {
      alert(e.message || "Không thể hủy kèo chơi!");
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

  return (
    <div className="fullscreen-route-view meetup-detail-route w-full flex flex-col gap-5 pb-10">
      {isLoading ? (
        <>
          {/* Skeleton Top Navigation */}
          <div className="cartoon-card route-top-nav bg-pastelYellow/70 flex items-center gap-4 p-[16px_24px] rounded-lg shadow-neo text-left animate-pulse">
            <button
              type="button"
              className="btn btn-secondary back-btn py-2 px-4 text-[0.95rem] whitespace-nowrap cursor-not-allowed opacity-50"
              disabled
            >
              ← Quay lại
            </button>
            <div className="nav-title-group flex justify-end flex-1">
              <div className="w-32 h-6 bg-[#1e1e24]/10 rounded-md"></div>
            </div>
          </div>

          {/* Skeleton Body Card */}
          <div className="cartoon-card manage-body-card bg-[#fffefb] p-[28px_24px] text-left flex flex-col gap-6 border-3 border-[#1e1e24] rounded-2xl shadow-neo">
            {/* Title / Summary Bar */}
            <div className="summary-bar flex flex-col bg-pastelCyan/50 p-[12px_20px] border-3 border-[#1e1e24] rounded-md shadow-neo gap-2.5 animate-pulse">
              <div className="h-5 bg-[#1e1e24]/10 rounded w-1/2"></div>
            </div>

            {/* Action Section */}
            <div className="user-action-block border-3 border-dashed border-[#1e1e24] p-5 rounded-lg bg-[#fbf7ed] flex flex-col gap-3 animate-pulse">
              <div className="h-4 bg-[#1e1e24]/10 rounded w-1/3"></div>
              <div className="h-10 bg-[#1e1e24]/10 rounded w-48 mt-1"></div>
            </div>

            {/* Meetup Information Details */}
            <div className="meetup-info-details flex flex-col gap-4 border-3 border-[#1e1e24] p-5 rounded-lg bg-white shadow-neo animate-pulse">
              <div className="h-4 bg-[#1e1e24]/10 rounded w-3/4"></div>
              <div className="h-4 bg-[#1e1e24]/10 rounded w-2/3"></div>
              <div className="h-4 bg-[#1e1e24]/10 rounded w-1/2"></div>
            </div>

            {/* Members Section */}
            <div className="members-block flex flex-col gap-3 mt-2 animate-pulse">
              <div className="h-5 bg-[#1e1e24]/10 rounded w-1/4"></div>
              <div className="members-grid grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                {[1, 2].map((n) => (
                  <div
                    className="member-item-card flex items-center gap-3 p-3.5 bg-white border-3 border-[#1e1e24] rounded-md shadow-neo"
                    key={n}
                  >
                    <div className="w-8 h-8 bg-[#1e1e24]/10 rounded-full shrink-0"></div>
                    <div className="h-4 bg-[#1e1e24]/10 rounded w-24"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : !meetup ? (
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
            <div className="nav-title-group flex justify-end flex-1">
              <h2 className="text-[1.5rem] font-extrabold m-0 flex items-center gap-2">
                Buổi chơi <Icon name="users" size={24} className="inline" />
              </h2>
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
                        <div className="flex flex-col gap-1.5">
                          <div className="user-profile-row flex items-center gap-2 flex-wrap">
                            <span className="user-icon flex items-center justify-center">
                              <Icon name="user" size={18} />
                            </span>
                            <span
                              className="user-name text-[1rem] font-extrabold hover:underline cursor-pointer"
                              onClick={() =>
                                navigate({
                                  name: "user-profile",
                                  userId: req.uid,
                                })
                              }
                            >
                              {req.name}
                            </span>
                            {req.participantCount &&
                              req.participantCount > 1 && (
                                <span className="text-xs font-bold bg-[#e0e7ff] text-[#3730a3] border border-[#3730a3] px-2 py-0.5 rounded-full">
                                  👥 {req.participantCount} người
                                </span>
                              )}
                          </div>
                          {req.message && (
                            <p className="text-xs font-semibold italic text-[#4b5563] bg-[#f9fafb] p-2 rounded-md border border-[#e5e7eb] m-0 text-left">
                              💬 "{req.message}"
                            </p>
                          )}
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
                chơi đã tham gia ({count}/
                {meetup.playersNeeded || meetup.players_needed}):
              </h3>

              <div className="members-grid grid grid-cols-1 md:grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
                {/* 1. Host Card */}
                <div className="member-item-card host-card flex justify-between items-center p-[14px_16px] bg-white border-3 border-[#1e1e24] rounded-md shadow-neo gap-3">
                  <div className="user-profile-row flex items-center gap-2.5 flex-wrap">
                    <span className="user-icon flex items-center justify-center">
                      <Icon name="user" size={18} />
                    </span>
                    <span
                      className="user-name text-[0.98rem] font-extrabold hover:underline cursor-pointer"
                      onClick={() =>
                        hostUid &&
                        navigate({ name: "user-profile", userId: hostUid })
                      }
                    >
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
                    <div className="user-profile-row flex items-center gap-2.5 flex-wrap">
                      <span className="user-icon flex items-center justify-center">
                        <Icon name="user" size={18} />
                      </span>
                      <span
                        className="user-name text-[0.98rem] font-extrabold hover:underline cursor-pointer"
                        onClick={() =>
                          navigate({ name: "user-profile", userId: req.uid })
                        }
                      >
                        {req.name}
                      </span>
                      {req.participantCount && req.participantCount > 1 && (
                        <span className="text-xs font-bold bg-[#e0e7ff] text-[#3730a3] border border-[#3730a3] px-2 py-0.5 rounded-full">
                          👥 {req.participantCount} người
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Approved Pending Members (Waiting to confirm) */}
            {approvedPendingRequests.length > 0 && (
              <div className="members-block flex flex-col gap-3 mt-4">
                <h3 className="block-title text-[1.1rem] font-extrabold text-[#d97706] flex items-center gap-2">
                  <Icon
                    name="clock"
                    size={18}
                    className="inline text-[#d97706]"
                  />{" "}
                  Đang chờ người chơi xác nhận ({approvedPendingRequests.length}
                  ):
                </h3>

                <div className="members-grid grid grid-cols-1 md:grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
                  {approvedPendingRequests.map((req) => (
                    <div
                      className="member-item-card pending-confirm-item flex justify-between items-center p-[14px_16px] bg-[#fffbeb] border-3 border-[#1e1e24] rounded-md shadow-neo gap-3"
                      key={req.uid}
                    >
                      <div className="user-profile-row flex items-center gap-2.5 flex-wrap">
                        <span className="user-icon flex items-center justify-center text-[#d97706]">
                          <Icon name="user" size={18} />
                        </span>
                        <span
                          className="user-name text-[0.98rem] font-extrabold hover:underline cursor-pointer"
                          onClick={() =>
                            navigate({ name: "user-profile", userId: req.uid })
                          }
                        >
                          {req.name}
                        </span>
                        {req.participantCount && req.participantCount > 1 && (
                          <span className="text-xs font-bold bg-[#fef3c7] text-[#92400e] border border-[#92400e] px-2 py-0.5 rounded-full">
                            👥 {req.participantCount} người
                          </span>
                        )}
                      </div>

                      <span className="text-xs font-bold text-[#d97706] italic bg-white border border-[#d97706] p-[2px_8px] rounded shrink-0">
                        Chờ xác nhận
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bottom Actions Bar */}
            <div className="bottom-actions-block border-t-3 border-[#1e1e24] pt-5 mt-4">
              {!currentUser ? (
                <button
                  type="button"
                  className="btn btn-primary font-extrabold w-full flex items-center justify-center gap-2 py-3 px-4 text-sm"
                  onClick={() => navigate({ name: "profile" })}
                >
                  <Icon name="user" size={16} /> Đăng nhập để tham gia
                </button>
              ) : isHost ? (
                <div className="flex w-full gap-2.5 sm:gap-3">
                  <button
                    type="button"
                    className="btn btn-secondary action-sm-btn  font-extrabold flex-1 flex items-center justify-center gap-1.5 py-3 px-2 sm:px-4 text-xs sm:text-sm bg-pastelYellow text-[#1e1e24]"
                    onClick={() => setIsManageModalOpen(true)}
                  >
                    <Icon name="users" size={16} /> Lời mời
                    {pendingRequests.length > 0 && (
                      <span className="bg-[#ef4444] text-white px-2 py-0.5 rounded-full text-xs font-bold border border-[#1e1e24]">
                        {pendingRequests.length}
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    className="btn btn-success action-sm-btn font-extrabold flex-1 flex items-center justify-center gap-1.5 py-3 px-2 sm:px-4 text-xs sm:text-sm bg-[#9ee3b2] text-[#1e1e24]"
                    onClick={() =>
                      navigate({ name: "chat", meetupId: meetup.id })
                    }
                  >
                    <Icon name="chat" size={16} /> Chat
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary action-sm-btn font-extrabold flex-1 flex items-center justify-center gap-1.5 py-3 px-2 sm:px-4 text-xs sm:text-sm bg-[#ffa4b2] text-[#1e1e24]"
                    onClick={handleDeleteMeetup}
                    disabled={isProcessing}
                  >
                    <Icon name="trash-2" size={16} /> Hủy kèo
                  </button>
                </div>
              ) : isApproved ? (
                <div className="flex w-full gap-3">
                  <button
                    type="button"
                    className="btn btn-success font-extrabold flex-1 flex items-center justify-center gap-1.5 py-3 px-4 text-sm bg-[#9ee3b2] text-[#1e1e24]"
                    onClick={() =>
                      navigate({ name: "chat", meetupId: meetup.id })
                    }
                  >
                    <Icon name="chat" size={16} /> Chat
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary font-extrabold flex-1 flex items-center justify-center gap-1.5 py-3 px-4 text-sm bg-[#ffa4b2] text-[#1e1e24]"
                    onClick={handleLeaveVoluntarily}
                    disabled={isProcessing}
                  >
                    <Icon name="log-out" size={16} /> Rời kèo
                  </button>
                </div>
              ) : isApprovedPending ? (
                <div className="flex w-full gap-3">
                  <button
                    type="button"
                    className="btn btn-primary font-extrabold flex-1 flex items-center justify-center gap-1.5 py-3 px-4 text-sm bg-pastelYellow text-[#1e1e24]"
                    onClick={handleConfirmParticipation}
                    disabled={isProcessing}
                  >
                    <Icon name="check" size={16} /> Xác nhận tham gia
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary font-extrabold flex-1 flex items-center justify-center gap-1.5 py-3 px-4 text-sm bg-[#e5e7eb] text-[#1e1e24]"
                    onClick={handleCancelRequest}
                    disabled={isProcessing}
                  >
                    <Icon name="x" size={16} /> Hủy yêu cầu
                  </button>
                </div>
              ) : isPending ? (
                <button
                  type="button"
                  className="btn btn-secondary font-extrabold w-full flex items-center justify-center gap-1.5 py-3 px-4 text-sm bg-[#e5e7eb] text-[#1e1e24]"
                  onClick={handleCancelRequest}
                  disabled={isProcessing}
                >
                  <Icon name="x" size={16} /> Hủy yêu cầu tham gia (
                  {myRequest?.participantCount || 1} người)
                </button>
              ) : (
                <button
                  type="button"
                  className={`btn font-extrabold w-full flex items-center justify-center gap-1.5 py-3 px-4 text-sm ${
                    isFull
                      ? "bg-gray-200 text-gray-500 cursor-not-allowed border-gray-400 shadow-none"
                      : "btn-success bg-[#9ee3b2] text-[#1e1e24]"
                  }`}
                  onClick={() => setIsJoinModalOpen(true)}
                  disabled={isProcessing || isFull}
                >
                  <Icon name={isFull ? "slash" : "plus"} size={16} />
                  <span>
                    {isFull ? "Kèo đã đầy sĩ số" : "Gửi yêu cầu tham gia"}
                  </span>
                </button>
              )}
            </div>
          </div>
        </>
      )}

      <JoinRequestModal
        meetup={meetup}
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
        onSubmit={handleJoinRequestSubmit}
        isProcessing={isProcessing}
      />

      <ManageMembersModal
        meetup={meetup}
        isOpen={isManageModalOpen}
        onClose={() => setIsManageModalOpen(false)}
      />
    </div>
  );
}
