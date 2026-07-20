import React, { useState, useEffect } from "react";
import {
  subscribeToMeetupRequests,
  approveMember,
  rejectMember,
  kickOrLeaveMember,
  type MeetupRequest,
} from "../api/meetupService";
import Icon from "./Icon";

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
}

interface Props {
  meetup: Meetup | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ManageMembersModal({ meetup, isOpen, onClose }: Props) {
  const [requests, setRequests] = useState<MeetupRequest[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && meetup?.id) {
      const unsubscribe = subscribeToMeetupRequests(meetup.id, (list) => {
        setRequests(list);
      });
      return unsubscribe;
    } else {
      setRequests([]);
    }
  }, [isOpen, meetup?.id]);

  const pendingRequests = requests.filter((r) => r.status === "pending");
  const approvedRequests = requests.filter((r) => r.status === "approved");

  async function handleApprove(playerUid: string) {
    if (!meetup?.id || isProcessing) return;
    setIsProcessing(true);
    try {
      await approveMember(meetup.id, playerUid);
    } catch (e) {
      console.error(e);
      alert("Lỗi duyệt thành viên: " + (e as Error).message);
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleReject(playerUid: string) {
    if (!meetup?.id || isProcessing) return;
    setIsProcessing(true);
    try {
      await rejectMember(meetup.id, playerUid);
    } catch (e) {
      console.error(e);
      alert("Lỗi từ chối thành viên: " + (e as Error).message);
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleKick(playerUid: string, playerName: string) {
    if (!meetup?.id || isProcessing) return;
    const confirmKick = window.confirm(`Bạn có chắc chắn muốn kick ${playerName} ra khỏi kèo chơi?`);
    if (!confirmKick) return;

    setIsProcessing(true);
    try {
      await kickOrLeaveMember(meetup.id, playerUid, playerName, true);
    } catch (e) {
      console.error(e);
      alert("Lỗi kick thành viên: " + (e as Error).message);
    } finally {
      setIsProcessing(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="members-modal-backdrop fixed top-0 left-0 w-screen h-screen bg-[rgba(30,30,36,0.6)] z-[9999] flex items-center justify-center p-5">
      <div className="cartoon-card members-modal-content w-full max-w-[480px] bg-white p-6 border-3 border-[#1e1e24] shadow-neo rounded-2xl flex flex-col gap-5 max-h-[85vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="modal-header flex items-center justify-between border-b-3 border-[#1e1e24] pb-3 shrink-0">
          <h3 className="modal-title font-extrabold text-[1.25rem] text-[#1e1e24] leading-tight">
            Quản Lý Thành Viên
          </h3>
          <button type="button" className="btn btn-secondary close-btn p-1 text-xs shrink-0" onClick={onClose}>
            <Icon name="x" size={16} />
          </button>
        </div>

        {/* Meetup summary details */}
        {meetup && (
          <div className="meetup-summary-block p-3 bg-pastelYellow border-2 border-[#1e1e24] rounded-lg text-left shadow-[2px_2px_0_#1e1e24] shrink-0">
            <h4 className="meetup-summary-title font-extrabold text-[0.98rem] text-[#1e1e24] truncate">
              {meetup.title}
            </h4>
            <span className="meetup-summary-game text-[0.82rem] font-bold text-[#666666]">
              Game: {meetup.game} — Sĩ số: {meetup.playersCount || meetup.players_count || 1}/
              {meetup.playersNeeded || meetup.players_needed || 4}
            </span>
          </div>
        )}

        {/* Modal Body Scroll Area */}
        <div className="modal-body-scroll flex-1 overflow-y-auto pr-1 flex flex-col gap-5">
          {/* Pending Members Group */}
          <div className="requests-group flex flex-col gap-3">
            <h4 className="group-heading font-extrabold text-[0.92rem] text-[#666666] uppercase text-left flex items-center gap-1">
              <Icon name="clock" size={14} /> Yêu cầu đang chờ duyệt ({pendingRequests.length})
            </h4>

            {pendingRequests.length === 0 ? (
              <p className="empty-text text-sm font-semibold text-[#888888] text-center my-2 italic">
                Chưa có yêu cầu mới nào.
              </p>
            ) : (
              <div className="requests-list flex flex-col gap-2.5">
                {pendingRequests.map((req) => (
                  <div
                    className="member-item p-3 border-2 border-[#1e1e24] rounded-lg flex flex-col gap-2 text-left shadow-[2px_2px_0px_#1e1e24] bg-[#fffdfa]"
                    key={req.uid}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="member-name font-bold text-sm text-[#1e1e24] truncate">
                          {req.name}
                        </span>
                        {req.participantCount && req.participantCount > 1 && (
                          <span className="text-[0.7rem] font-bold bg-[#e0e7ff] text-[#3730a3] border border-[#3730a3] px-1.5 py-0.5 rounded-full shrink-0">
                            👥 {req.participantCount} người
                          </span>
                        )}
                      </div>
                      <div className="member-item-actions flex gap-2 shrink-0">
                        <button
                          type="button"
                          className="btn btn-success action-pill-btn p-[5px_12px] text-[0.75rem] border-2 shadow-[1.5px_1.5px_0_#1e1e24]"
                          onClick={() => handleApprove(req.uid)}
                          disabled={isProcessing}
                        >
                          Duyệt
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary action-pill-btn p-[5px_12px] text-[0.75rem] border-2 shadow-[1.5px_1.5px_0_#1e1e24]"
                          onClick={() => handleReject(req.uid)}
                          disabled={isProcessing}
                        >
                          Từ chối
                        </button>
                      </div>
                    </div>
                    {req.message && (
                      <p className="text-xs italic text-[#4b5563] bg-[#f9fafb] p-2 rounded border border-[#e5e7eb] m-0">
                        💬 "{req.message}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Approved Members Group */}
          <div className="requests-group flex flex-col gap-3">
            <h4 className="group-heading font-extrabold text-[0.92rem] text-[#666666] uppercase text-left flex items-center gap-1">
              <Icon name="users" size={14} /> Thành viên đã tham gia ({approvedRequests.length})
            </h4>

            {approvedRequests.length === 0 ? (
              <p className="empty-text text-sm font-semibold text-[#888888] text-center my-2 italic">
                Chưa có thành viên nào tham gia.
              </p>
            ) : (
              <div className="requests-list flex flex-col gap-2.5">
                {approvedRequests.map((member) => {
                  const isUserHost = meetup && (meetup.hostUid || meetup.host_uid) === member.uid;
                  return (
                    <div
                      className="member-item p-3 border-2 border-[#1e1e24] rounded-lg flex items-center justify-between gap-3 text-left shadow-[2px_2px_0px_#1e1e24] bg-[#fffdfa]"
                      key={member.uid}
                    >
                      <div className="member-name-badge flex items-center gap-2 flex-1 min-w-0">
                        <span className="member-name font-bold text-sm text-[#1e1e24] truncate">
                          {member.name}
                        </span>
                        {isUserHost && (
                          <span className="host-badge text-[0.7rem] font-extrabold bg-pastelYellow border-[1.5px] border-[#1e1e24] p-[1px_6px] rounded-full shrink-0 flex items-center gap-0.5">
                            <Icon name="crown" size={10} /> Host
                          </span>
                        )}
                      </div>
                      {!isUserHost && (
                        <button
                          type="button"
                          className="btn btn-secondary action-pill-btn p-[5px_12px] text-[0.75rem] border-2 shadow-[1.5px_1.5px_0_#1e1e24] text-[#b91c1c] border-[#b91c1c] hover:bg-[#ffeef0] shrink-0"
                          onClick={() => handleKick(member.uid, member.name)}
                          disabled={isProcessing}
                        >
                          Kick
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
