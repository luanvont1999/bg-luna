import React, { useState, useEffect } from "react";
import Icon from "./Icon";

interface Meetup {
  id: string;
  title: string;
  game: string;
  playersCount?: number;
  players_count?: number;
  playersNeeded?: number;
  players_needed?: number;
}

interface Props {
  meetup: Meetup | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (participantCount: number, message: string) => Promise<void>;
  isProcessing?: boolean;
}

export default function JoinRequestModal({
  meetup,
  isOpen,
  onClose,
  onSubmit,
  isProcessing = false,
}: Props) {
  const [participantCount, setParticipantCount] = useState<number>(1);
  const [message, setMessage] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      setParticipantCount(1);
      setMessage("");
      setErrorMsg("");
    }
  }, [isOpen]);

  if (!isOpen || !meetup) return null;

  const currentCount = meetup.playersCount || meetup.players_count || 1;
  const totalNeeded = meetup.playersNeeded || meetup.players_needed || 4;
  const maxAvailable = Math.max(1, totalNeeded - currentCount);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (participantCount < 1) {
      setErrorMsg("Số lượng tham gia tối thiểu là 1 người.");
      return;
    }
    if (participantCount > maxAvailable) {
      setErrorMsg(`Chỉ còn trống tối đa ${maxAvailable} chỗ trong kèo.`);
      return;
    }

    setErrorMsg("");
    try {
      await onSubmit(participantCount, message.trim());
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Gửi yêu cầu thất bại.");
    }
  }

  return (
    <div className="join-modal-backdrop fixed top-0 left-0 w-screen h-screen bg-[rgba(30,30,36,0.6)] z-[9999] flex items-center justify-center p-4">
      <div className="cartoon-card join-modal-content w-full max-w-[440px] bg-white p-6 border-3 border-[#1e1e24] shadow-neo rounded-2xl flex flex-col gap-4 animate-[bubble-pop_0.15s_ease-out]">
        {/* Header */}
        <div className="modal-header flex items-center justify-between border-b-3 border-[#1e1e24] pb-3">
          <h3 className="modal-title font-extrabold text-[1.2rem] text-[#1e1e24] flex items-center gap-2">
            <Icon name="plus" size={20} />
            Gửi Lời Tham Gia Kèo
          </h3>
          <button
            type="button"
            className="btn btn-secondary close-btn p-1 text-xs shrink-0"
            onClick={onClose}
            disabled={isProcessing}
          >
            <Icon name="x" size={16} />
          </button>
        </div>

        {/* Meetup Info Badge */}
        <div className="p-3 bg-pastelYellow border-2 border-[#1e1e24] rounded-lg text-left shadow-[2px_2px_0_#1e1e24]">
          <h4 className="font-extrabold text-sm text-[#1e1e24] truncate">
            {meetup.title}
          </h4>
          <p className="text-xs font-bold text-[#555] mt-0.5">
            Game: {meetup.game} — Hiện có: {currentCount}/{totalNeeded} người (Trống {maxAvailable} chỗ)
          </p>
        </div>

        {errorMsg && (
          <div className="alert error-alert p-2.5 rounded-md border-2 border-[#1e1e24] font-bold text-xs bg-[#ffccd3] text-[#b91c1c] text-left">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-left">
          {/* Number of participants */}
          <div className="form-group flex flex-col gap-1.5">
            <label htmlFor="participant-count" className="font-extrabold text-sm text-[#1e1e24]">
              Số lượng người muốn tham gia:
            </label>
            <input
              type="number"
              id="participant-count"
              min="1"
              max={maxAvailable}
              value={participantCount}
              onChange={(e) => setParticipantCount(Math.max(1, Number(e.target.value)))}
              disabled={isProcessing}
              className="p-2.5 rounded-md border-3 border-[#1e1e24] text-sm font-semibold shadow-[2px_2px_0_#1e1e24] outline-none bg-white"
              required
            />
            <span className="text-[0.75rem] font-semibold text-[#666]">
              * Đi 1 mình chọn 1. Rủ thêm bạn cùng đi chọn số lượng tương ứng.
            </span>
          </div>

          {/* Message for host */}
          <div className="form-group flex flex-col gap-1.5">
            <label htmlFor="join-message" className="font-extrabold text-sm text-[#1e1e24]">
              Lời nhắn gửi Host (không bắt buộc):
            </label>
            <textarea
              id="join-message"
              rows={3}
              placeholder="Ví dụ: Mình xin 2 suất cho mình và bạn mình, bọn mình có thể đến đúng giờ..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={isProcessing}
              className="p-2.5 rounded-md border-3 border-[#1e1e24] text-sm font-semibold shadow-[2px_2px_0_#1e1e24] outline-none bg-white"
            ></textarea>
          </div>

          {/* Submit buttons */}
          <div className="flex gap-2 justify-end mt-2">
            <button
              type="button"
              className="btn btn-secondary py-2 px-4 text-sm font-bold"
              onClick={onClose}
              disabled={isProcessing}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="btn btn-success py-2 px-5 text-sm font-bold bg-[#9ee3b2]"
              disabled={isProcessing}
            >
              {isProcessing ? "Đang gửi..." : "Gửi yêu cầu"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
