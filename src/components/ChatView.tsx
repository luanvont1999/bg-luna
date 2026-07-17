import React, { useState, useEffect, useRef } from "react";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { onAuthStateChanged, type User } from "firebase/auth";
import { db, auth } from "../libs/firebase";
import Icon from "./Icon";

import {
  isApprovedMember,
  requestToJoin,
  cancelJoinRequest,
  confirmParticipation,
  subscribeToMeetupRequests,
  type MeetupRequest,
} from "../api/meetupService";
import { notifyMeetupChatMembers } from "../api/notificationService";
import { formatMessageTime } from "../utils/time";

interface Meetup {
  id: string;
  title: string;
  game: string;
  host_name?: string;
  hostName?: string;
  host_uid?: string;
  hostUid?: string;
  approvedUids?: string[];
  approvedPendingUids?: string[];
  color?: string;
}

interface ChatMessage {
  id: string;
  text: string;
  senderUid: string;
  senderName: string;
  createdAt?: any;
}

interface Props {
  meetup: Meetup | null;
  onBack: () => void;
}

export default function ChatView({ meetup, onBack }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [requests, setRequests] = useState<MeetupRequest[]>([]);
  const [newMessageText, setNewMessageText] = useState<string>("");
  const [isSending, setIsSending] = useState<boolean>(false);
  const [isRequesting, setIsRequesting] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<User | null>(auth.currentUser);

  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const hasChatAccess = isApprovedMember(meetup, currentUser?.uid);

  // Check if player is approved but pending confirmation
  const approvedPendingUids = meetup?.approvedPendingUids || [];
  const isApprovedPending = currentUser
    ? approvedPendingUids.includes(currentUser.uid)
    : false;

  const myRequest = currentUser
    ? requests.find((r) => r.uid === currentUser.uid) || null
    : null;

  // Listen to Auth State Changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return unsubscribe;
  }, []);

  // Listen to Meetup Requests (For access control checking)
  useEffect(() => {
    if (meetup?.id && currentUser) {
      const unsubscribe = subscribeToMeetupRequests(meetup.id, (list) => {
        setRequests(list);
      });
      return unsubscribe;
    } else {
      setRequests([]);
    }
  }, [meetup?.id, currentUser]);

  // Listen to Chat Messages
  useEffect(() => {
    if (!meetup?.id || !hasChatAccess) {
      setMessages([]);
      return;
    }

    const messagesRef = collection(db, "meetups", meetup.id, "messages");
    const q = query(messagesRef, orderBy("createdAt", "asc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as ChatMessage[];
        setMessages(list);
      },
      (error) => {
        console.error("[Firestore Chat] Subscription error:", error);
      },
    );

    return unsubscribe;
  }, [meetup?.id, hasChatAccess]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  async function handleSendMessage(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!newMessageText.trim() || !meetup?.id || !currentUser || isSending)
      return;

    const text = newMessageText.trim();
    setNewMessageText("");
    setIsSending(true);

    try {
      const senderName =
        currentUser.displayName || currentUser.email || "Thành viên";
      await addDoc(collection(db, "meetups", meetup.id, "messages"), {
        text,
        senderUid: currentUser.uid,
        senderName,
        createdAt: serverTimestamp(),
      });

      const allMembers = [
        ...(meetup.approvedUids || []),
        meetup.hostUid || meetup.host_uid || "",
      ].filter(Boolean);

      notifyMeetupChatMembers(
        meetup.id,
        meetup.title,
        allMembers,
        currentUser.uid,
        senderName,
        text,
      );
    } catch (err) {
      console.error("[Firestore Chat] Send error:", err);
    } finally {
      setIsSending(false);
    }
  }

  async function handleSendJoinRequest() {
    if (!meetup?.id || !currentUser || isRequesting) return;
    setIsRequesting(true);
    try {
      await requestToJoin(meetup.id, currentUser);
    } catch (err) {
      console.error("Request join failed:", err);
    } finally {
      setIsRequesting(false);
    }
  }

  async function handleCancelRequest() {
    if (!meetup?.id || !currentUser || isRequesting) return;
    setIsRequesting(true);
    try {
      await cancelJoinRequest(meetup.id, currentUser.uid);
    } catch (err) {
      console.error("Cancel request failed:", err);
    } finally {
      setIsRequesting(false);
    }
  }

  async function handleConfirmParticipation() {
    if (!meetup?.id || !currentUser || isRequesting) return;
    setIsRequesting(true);
    try {
      const name = currentUser.displayName || currentUser.email || "Thành viên";
      await confirmParticipation(meetup.id, currentUser.uid, name);
    } catch (err) {
      console.error("Confirm participation failed:", err);
    } finally {
      setIsRequesting(false);
    }
  }

  return (
    <div className="fullscreen-chat-view flex flex-col h-full gap-4 w-full">
      {!meetup ? (
        <div className="cartoon-card no-chat-card m-auto text-center p-10 bg-white">
          <h3 className="text-xl font-bold mb-4">Chưa chọn kèo chơi nào!</h3>
          <button className="btn btn-primary" onClick={onBack}>
            Quay lại danh sách kèo
          </button>
        </div>
      ) : !hasChatAccess ? (
        <>
          {/* Top Fullscreen Header */}
          <div className="chat-top-nav cartoon-card bg-pastelCyan flex items-center gap-4 p-[14px_20px] rounded-lg shadow-neo shrink-0">
            <button
              type="button"
              className="btn btn-secondary back-btn py-2 px-4 text-[0.95rem] whitespace-nowrap"
              onClick={onBack}
            >
              ← Quay lại
            </button>

            <div className="chat-nav-details flex flex-col gap-[2px] text-left flex-1 min-w-0">
              <div className="chat-title-row flex items-center gap-[10px] flex-wrap">
                <h2 className="chat-meetup-title text-[1.3rem] font-extrabold m-0 truncate text-[#1e1e24]"></h2>
                <span className="game-badge text-[0.82rem] font-extrabold bg-pastelYellow p-[2px_10px] border-2 border-[#1e1e24] rounded shadow-[1.5px_1.5px_0_#1e1e24] flex items-center gap-1">
                  <Icon name="dice" size={13} className="inline" />{" "}
                  {meetup.game}
                </span>
              </div>
              <span className="host-info text-[0.85rem] font-semibold text-[#1e1e24]">
                <Icon name="crown" size={13} className="mr-1 inline" /> Host:{" "}
                <strong>
                  {meetup.host_name || meetup.hostName || "Ẩn danh"}
                </strong>
              </span>
            </div>
          </div>

          {/* Access Denied Private Lock Screen */}
          <div className="cartoon-card access-denied-card m-auto text-center p-[40px_24px] bg-[#fffefb] max-w-[480px] flex flex-col items-center gap-4 border-3 border-[#1e1e24] shadow-neo rounded-2xl">
            <div className="lock-big-icon text-[3.5rem]">
              <Icon name="lock" size={48} />
            </div>
            <h3 className="text-[1.5rem] font-bold">Phòng Chat Riêng Tư</h3>
            <p className="text-[0.95rem] font-semibold text-[#666666] leading-normal">
              Chỉ những người chơi đã được Host phê duyệt vào kèo mới có quyền
              xem và nhắn tin trong phòng chat này.
            </p>

            <div className="access-action-box mt-3 flex flex-col items-center gap-[14px] w-full">
              {!currentUser ? (
                <>
                  <p className="prompt-text text-sm font-semibold text-[#666666]">
                    <Icon name="sparkles" size={16} className="mr-1 inline" />{" "}
                    Hãy đăng nhập ở tab <strong>Hồ sơ</strong> để gửi yêu cầu
                    tham gia kèo.
                  </p>
                  <button className="btn btn-primary" onClick={onBack}>
                    Quay lại danh sách kèo
                  </button>
                </>
              ) : myRequest?.status === "pending" ? (
                <>
                  <div className="pending-status-pill p-[10px_16px] bg-pastelYellow border-3 border-[#1e1e24] rounded-md font-extrabold text-[0.9rem] shadow-[3px_3px_0_#1e1e24]">
                    <Icon name="clock" size={16} className="mr-1 inline" /> Yêu
                    cầu của bạn đang chờ Host xét duyệt...
                  </div>
                  <div className="action-btn-group flex gap-3 w-full justify-center">
                    <button
                      className="btn btn-secondary flex-1"
                      onClick={handleCancelRequest}
                      disabled={isRequesting}
                    >
                      <Icon name="x" size={15} className="mr-1 inline" />
                      <span>{isRequesting ? "..." : "Hủy yêu cầu"}</span>
                    </button>
                    <button className="btn btn-primary flex-1" onClick={onBack}>
                      Quay lại danh sách
                    </button>
                  </div>
                </>
              ) : isApprovedPending ? (
                <>
                  <div className="pending-status-pill p-[10px_16px] bg-[#9ee3b2] border-3 border-[#1e1e24] rounded-md font-extrabold text-[0.9rem] shadow-[3px_3px_0_#1e1e24] mb-2 text-[#1e1e24]">
                    <Icon
                      name="check-circle"
                      size={16}
                      className="mr-1 inline"
                    />{" "}
                    Bạn đã được duyệt! Hãy xác nhận tham gia.
                  </div>
                  <div className="action-btn-group flex gap-3 w-full justify-center">
                    <button
                      className="btn btn-primary flex-1 bg-pastelYellow text-[#1e1e24]"
                      onClick={handleConfirmParticipation}
                      disabled={isRequesting}
                    >
                      <Icon name="check" size={15} className="mr-1 inline" />
                      <span>{isRequesting ? "..." : "Xác nhận tham gia"}</span>
                    </button>
                    <button
                      className="btn btn-secondary flex-grow-0 py-3 px-5 text-sm"
                      onClick={onBack}
                    >
                      Quay lại
                    </button>
                  </div>
                </>
              ) : (
                <div className="action-btn-group flex gap-3 w-full justify-center">
                  <button
                    className="btn btn-success flex-1"
                    onClick={handleSendJoinRequest}
                    disabled={isRequesting}
                  >
                    <Icon name="handshake" size={15} className="mr-1 inline" />
                    <span>
                      {isRequesting
                        ? "Đang gửi..."
                        : "Gửi yêu cầu tham gia kèo"}
                    </span>
                  </button>
                  <button className="btn btn-primary flex-1" onClick={onBack}>
                    Quay lại danh sách
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Top Fullscreen Header */}
          <div className="chat-top-nav cartoon-card bg-pastelCyan flex items-center gap-4 p-[14px_20px] rounded-lg shadow-neo shrink-0">
            <button
              type="button"
              className="btn btn-secondary back-btn py-2 px-4 text-[0.95rem] whitespace-nowrap"
              onClick={onBack}
            >
              ← Quay lại
            </button>

            <div className="chat-nav-details flex flex-col gap-[2px] text-left flex-1 min-w-0">
              <div className="chat-title-row flex items-center gap-[10px] flex-wrap">
                <h2 className="chat-meetup-title text-[1.3rem] font-extrabold m-0 truncate text-[#1e1e24]">
                  Thảo luận
                </h2>
              </div>
            </div>
          </div>

          {/* Messages Container Area */}
          <div
            className="chat-feed-area cartoon-card flex-1 bg-white overflow-y-auto p-5 flex flex-col rounded-lg shadow-neo border-3 border-[#1e1e24]"
            ref={messagesContainerRef}
          >
            {messages.length === 0 ? (
              <div className="chat-empty-state m-auto text-center p-[40px_20px] text-[#666666]">
                <div className="empty-icon text-[3.5rem] mb-3">
                  <Icon name="chat" size={48} />
                </div>
                <h3 className="text-[1.3rem] font-bold mb-2 text-[#1e1e24]">
                  Chưa có tin nhắn nào trong kèo này!
                </h3>
                <p className="text-[0.95rem] font-semibold max-w-[360px] mx-auto">
                  Hãy mở lời gửi tin nhắn đầu tiên để thảo luận và hẹn giờ chơi
                  cùng mọi người nhé.
                </p>
              </div>
            ) : (
              <div className="messages-list flex flex-col gap-4 w-full">
                {messages.map((msg) => {
                  const isMine =
                    currentUser && msg.senderUid === currentUser.uid;
                  const isHost =
                    (meetup.host_uid || meetup.hostUid) === msg.senderUid;

                  return (
                    <div
                      className={`message-row flex w-full ${isMine ? "justify-end" : "justify-start"}`}
                      key={msg.id}
                    >
                      <div
                        className={`message-bubble max-w-[75%] p-4 rounded-2xl border-3 border-[#1e1e24] shadow-neo text-left flex flex-col gap-1 ${
                          isMine
                            ? "bg-pastelPurple rounded-br-sm"
                            : "bg-white rounded-bl-sm"
                        }`}
                      >
                        <div className="message-author flex items-center gap-2">
                          <span className="author-name text-[0.82rem] font-extrabold text-[#1e1e24]">
                            {msg.senderName}
                          </span>
                          {isHost && (
                            <span className="host-badge text-[0.7rem] font-extrabold bg-pastelYellow border-[1.5px] border-[#1e1e24] p-[1px_6px] rounded-full flex items-center gap-0.5">
                              <Icon name="crown" size={11} /> Host
                            </span>
                          )}
                        </div>
                        <div className="message-text text-base font-semibold text-[#1e1e24] break-words leading-relaxed">
                          {msg.text}
                        </div>
                        <div className="message-time text-[0.72rem] font-bold text-[#666666] self-end">
                          {formatMessageTime(msg.createdAt)}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Bottom Fullscreen Input Bar */}
          <div className="chat-bottom-bar cartoon-card bg-white p-[14px_20px] rounded-lg shadow-neo shrink-0 border-3 border-[#1e1e24]">
            {currentUser ? (
              <form
                className="chat-input-form flex w-full gap-3"
                onSubmit={handleSendMessage}
              >
                <input
                  type="text"
                  className="cartoon-chat-input flex-1 p-4 font-semibold text-base rounded-md border-3 border-[#1e1e24] bg-[#fbf7ed] outline-none shadow-[3px_3px_0_#1e1e24] transition-all duration-150 focus:bg-white focus:shadow-[4px_4px_0_#1e1e24]"
                  placeholder="Nhập tin nhắn..."
                  value={newMessageText}
                  onChange={(e) => setNewMessageText(e.target.value)}
                  disabled={isSending}
                />
                <button
                  type="submit"
                  className="btn btn-primary send-btn py-3 px-6 text-base whitespace-nowrap"
                  disabled={!newMessageText.trim() || isSending}
                >
                  <Icon name="rocket" size={16} className="mr-1 inline" />
                  <span>{isSending ? "..." : "Gửi"}</span>
                </button>
              </form>
            ) : (
              <div className="login-chat-prompt w-full text-center text-sm font-bold text-[#666666] py-[6px]">
                <span>
                  <Icon name="lock" size={14} className="mr-1 inline" /> Bạn cần
                  đăng nhập ở tab <strong>Hồ sơ</strong> để gửi tin nhắn chat.
                </span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
