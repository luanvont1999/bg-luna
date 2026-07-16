import React, { useState, useEffect } from "react";
import {
  subscribeToMeetupRequests,
  approveMember,
  rejectMember,
  kickOrLeaveMember,
  type MeetupRequest,
} from "../api/meetupService";
import { goBack } from "../libs/router";
import Icon from "../components/Icon";

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
}

export default function ManageRoute({ meetup }: Props) {
  const [requests, setRequests] = useState<MeetupRequest[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

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
  const approvedRequests = requests.filter((r) => r.status === "approved");

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
    <div className="fullscreen-route-view manage-route w-full flex flex-col gap-5 pb-10">
      {!meetup ? (
        <div className="cartoon-card no-meetup-card m-auto text-center p-10 bg-white border-3 border-[#1e1e24] shadow-neo rounded-2xl">
          <h3 className="text-xl font-bold mb-4">Chưa chọn kèo chơi để quản lý!</h3>
          <button className="btn btn-primary" onClick={goBack}>
            Quay lại danh sách kèo
          </button>
        </div>
      ) : (
        <>
          {/* Top Navigation */}
          <div className="cartoon-card route-top-nav bg-pastelYellow flex items-center gap-4 p-[16px_24px] rounded-lg shadow-neo text-left">
            <button type="button" className="btn btn-secondary back-btn py-2 px-4 text-[0.95rem] whitespace-nowrap" onClick={goBack}>
              ← Quay lại
            </button>
            <div className="nav-title-group">
              <h2 className="text-[1.3rem] font-extrabold m-0 flex items-center gap-2">
                <Icon name="users" size={22} className="inline" /> Bảng Quản Lý Thành Viên Kèo
              </h2>
              <span className="sub-title text-[0.85rem] font-semibold text-[#1e1e24]">
                Host: {meetup.hostName || meetup.host_name || "Ẩn danh"} • Kèo: {meetup.title}
              </span>
            </div>
          </div>

          {/* Manage Body Card */}
          <div className="cartoon-card manage-body-card bg-[#fffefb] p-[28px_24px] text-left flex flex-col gap-5 border-3 border-[#1e1e24] rounded-2xl shadow-neo animate-[bubble-pop_0.15s_ease-out]">
            <div className="summary-bar flex justify-between items-center bg-pastelCyan p-[12px_20px] border-3 border-[#1e1e24] rounded-md shadow-neo text-[0.95rem] flex-wrap gap-3">
              <span className="meetup-name-badge inline-flex items-center gap-1.5">
                <Icon name="dice" size={16} className="inline" /> Game: <strong>{meetup.game}</strong>
              </span>
              <span className="player-count-badge inline-flex items-center gap-1.5 bg-white p-[4px_12px] border-2 border-[#1e1e24] rounded-full font-extrabold">
                <Icon name="users" size={16} className="inline" /> Sĩ số:{" "}
                <strong>
                  {1 + approvedRequests.length} / {meetup.playersNeeded || meetup.players_needed || 4} người
                </strong>
              </span>
            </div>

            {/* Pending Section */}
            <div className="members-block flex flex-col gap-3">
              <h3 className="block-title text-[1.1rem] font-extrabold text-[#1e1e24] flex items-center gap-2">
                <Icon name="clock" size={18} className="inline" /> Yêu cầu tham gia mới ({pendingRequests.length}):
              </h3>

              {pendingRequests.length === 0 ? (
                <div className="empty-list-box p-[16px_20px] bg-bgCream border-3 border-dashed border-[#1e1e24] rounded-md text-sm font-semibold text-[#666666]">
                  <span>Chưa có yêu cầu tham gia mới nào đang chờ duyệt.</span>
                </div>
              ) : (
                <div className="members-grid grid grid-cols-1 md:grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
                  {pendingRequests.map((req) => (
                    <div className="member-item-card pending-item flex justify-between items-center p-[14px_16px] bg-white border-3 border-[#1e1e24] rounded-md shadow-neo gap-3" key={req.uid}>
                      <div className="user-profile-row flex items-center gap-2.5">
                        <span className="user-icon flex items-center justify-center">
                          <Icon name="user" size={18} />
                        </span>
                        <span className="user-name text-[0.98rem] font-extrabold">{req.name}</span>
                      </div>

                      <div className="item-actions flex gap-2">
                        <button
                          className="btn btn-success action-sm-btn flex items-center gap-1 p-[8px_14px] text-[0.85rem] rounded-md"
                          onClick={() => handleApprove(req.uid)}
                          disabled={isProcessing}
                        >
                          <Icon name="check" size={14} className="inline" /> Duyệt vào kèo
                        </button>
                        <button
                          className="btn btn-secondary action-sm-btn flex items-center gap-1 p-[8px_14px] text-[0.85rem] rounded-md"
                          onClick={() => handleReject(req.uid)}
                          disabled={isProcessing}
                        >
                          <Icon name="x" size={14} className="inline" /> Từ chối
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Approved Members Section */}
            <div className="members-block flex flex-col gap-3 mt-8">
              <h3 className="block-title text-[1.1rem] font-extrabold text-[#1e1e24] flex items-center gap-2">
                <Icon name="check-circle" size={18} className="inline" /> Thành viên đã được duyệt ({approvedRequests.length}):
              </h3>

              {approvedRequests.length === 0 ? (
                <div className="empty-list-box p-[16px_20px] bg-bgCream border-3 border-dashed border-[#1e1e24] rounded-md text-sm font-semibold text-[#666666]">
                  <span>Chưa có thành viên nào khác tham gia kèo này.</span>
                </div>
              ) : (
                <div className="members-grid grid grid-cols-1 md:grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
                  {approvedRequests.map((req) => (
                    <div className="member-item-card approved-item flex justify-between items-center p-[14px_16px] bg-white border-3 border-[#1e1e24] rounded-md shadow-neo gap-3" key={req.uid}>
                      <div className="user-profile-row flex items-center gap-2.5">
                        <span className="user-icon flex items-center justify-center">
                          <Icon name="user" size={18} />
                        </span>
                        <span className="user-name text-[0.98rem] font-extrabold">{req.name}</span>
                      </div>

                      <button
                        className="btn btn-secondary action-sm-btn kick-btn bg-pastelPink flex items-center gap-1 p-[8px_14px] text-[0.85rem] rounded-md"
                        onClick={() => handleKick(req.uid)}
                        disabled={isProcessing}
                      >
                        <Icon name="log-out" size={14} className="inline" /> Đuổi khỏi kèo
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
