import React, { useState, useEffect } from "react";
import { formatChatListTime } from "../utils/time";
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
} from "firebase/firestore";
import { onAuthStateChanged, type User } from "firebase/auth";
import { db, auth } from "../libs/firebase";
import { navigate } from "../libs/router";
import Icon from "../components/Icon";

interface Meetup {
  id: string;
  title: string;
  game: string;
  hostUid?: string;
  host_uid?: string;
  approvedUids?: string[];
  color?: string;
  createdAt?: any;
}

interface Props {
  meetups: Meetup[];
}

export default function ChatsListRoute({ meetups = [] }: Props) {
  const [currentUser, setCurrentUser] = useState<User | null>(auth.currentUser);
  const [latestMessages, setLatestMessages] = useState<
    Record<string, { text: string; senderName: string; createdAt: any }>
  >({});

  // Auth subscriber
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setCurrentUser(u);
    });
    return unsubscribe;
  }, []);

  // Filter meetups where currentUser is Host or Approved Member
  const myMeetups = currentUser
    ? meetups.filter(
        (m) =>
          m.hostUid === currentUser.uid ||
          m.host_uid === currentUser.uid ||
          (Array.isArray(m.approvedUids) && m.approvedUids.includes(currentUser.uid))
      )
    : [];

  // Subscribe to latest message for each joined meetup
  useEffect(() => {
    const unsubscribes: (() => void)[] = [];

    myMeetups.forEach((meetup) => {
      const messagesRef = collection(db, "meetups", meetup.id, "messages");
      const q = query(messagesRef, orderBy("createdAt", "desc"), limit(1));

      const unsub = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const data = snapshot.docs[0].data();
            setLatestMessages((prev) => ({
              ...prev,
              [meetup.id]: {
                text: data.text || "",
                senderName: data.senderName || "Thành viên",
                createdAt: data.createdAt,
              },
            }));
          }
        },
        (err) =>
          console.error(`[ChatsList] Error fetching message for ${meetup.id}:`, err)
      );
      unsubscribes.push(unsub);
    });

    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }, [myMeetups.map((m) => m.id).join(",")]);

  // Sort joined chatboxes by latest message timestamp descending (Mới nhất lên đầu)
  const sortedChats = [...myMeetups].sort((a, b) => {
    const msgA = latestMessages[a.id];
    const msgB = latestMessages[b.id];

    const timeA = msgA?.createdAt?.seconds
      ? msgA.createdAt.seconds * 1000
      : a.createdAt?.seconds
        ? a.createdAt.seconds * 1000
        : 0;

    const timeB = msgB?.createdAt?.seconds
      ? msgB.createdAt.seconds * 1000
      : b.createdAt?.seconds
        ? b.createdAt.seconds * 1000
        : 0;

    return timeB - timeA;
  });



  function openChat(meetupId: string) {
    navigate({ name: "chat", meetupId });
  }

  return (
    <div className="chats-list-route w-full flex flex-col gap-4 pb-[30px] max-w-[768px] mx-auto">
      {/* Route Header */}
      <div className="cartoon-card route-header bg-pastelPink p-[16px_20px] text-left">
        <h2 className="text-[1.25rem] font-extrabold m-0 mb-1 flex items-center gap-2">
          <Icon name="chat" size={24} className="inline" /> Trò Chuyện Kèo Chơi
        </h2>
        <p className="sub-title text-[0.82rem] font-semibold text-[#1e1e24] m-0">
          Tất cả các phòng chat của hội nhóm bạn đang tham gia (sắp xếp từ mới nhất)
        </p>
      </div>

      {!currentUser ? (
        <div className="cartoon-card empty-card bg-[#fffefb] p-[32px_20px] text-center flex flex-col items-center gap-2">
          <Icon name="user" size={32} />
          <h3 className="text-[1.1rem] font-extrabold m-0">Chưa Đăng Nhập</h3>
          <p className="text-sm text-[#666666] m-0">Vui lòng đăng nhập để xem danh sách phòng chat của các kèo chơi.</p>
        </div>
      ) : sortedChats.length === 0 ? (
        <div className="cartoon-card empty-card bg-[#fffefb] p-[32px_20px] text-center flex flex-col items-center gap-2">
          <Icon name="chat" size={36} />
          <h3 className="text-[1.1rem] font-extrabold m-0">Chưa Có Phòng Chat Nào</h3>
          <p className="text-sm text-[#666666] m-0">
            Bạn chưa tham gia kèo chơi nào. Hãy ra trang <strong>Tìm Kèo</strong> hoặc <strong>Lên Kèo</strong> mới để tham gia trò chuyện!
          </p>
        </div>
      ) : (
        <div className="chats-list flex flex-col gap-3">
          {sortedChats.map((meetup) => {
            const latest = latestMessages[meetup.id];
            const isHost =
              meetup.hostUid === currentUser?.uid || meetup.host_uid === currentUser?.uid;

            return (
              <button
                key={meetup.id}
                type="button"
                className="cartoon-card chat-item-card bg-[#fffefb] p-[14px_16px] flex items-center gap-[14px] text-left cursor-pointer transition-all duration-120 border-3 border-[#1e1e24] shadow-[3.5px_3.5px_0_#1e1e24] rounded-2xl hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[5px_5px_0_#1e1e24] hover:bg-white active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1.5px_1.5px_0_#1e1e24]"
                onClick={() => openChat(meetup.id)}
              >
                <div
                  className="chat-avatar w-11 h-11 rounded-full border-2 border-[#1e1e24] flex items-center justify-center shadow-[2px_2px_0_#1e1e24] shrink-0"
                  style={{ backgroundColor: meetup.color || "#a4f0fd" }}
                >
                  <svg viewBox="0 0 24 24" width="22" height="22">
                    <path
                      d="M12 2a2.5 2.5 0 0 0-2.5 2.5c0 1.6 1.2 2.5 2.5 2.5s2.5-.9 2.5-2.5A2.5 2.5 0 0 0 12 2z"
                      fill="#1e1e24"
                    />
                    <path
                      d="M17 12V10c0-1.2-1.2-2-2.8-2.4H9.8C8.2 8 7 8.8 7 10v2c0 .4.4.8.8.8h.8v6c0 .4.4.8.8.8h5.2c.4 0 .8-.4.8-.8v-6h.8c.4 0 .8-.4.8-.8z"
                      fill="#1e1e24"
                    />
                  </svg>
                </div>

                <div className="chat-info flex-1 min-w-0">
                  <div className="chat-header-row flex justify-between items-center gap-2">
                    <h4 className="chat-title text-[0.98rem] font-extrabold m-0 truncate text-[#1e1e24]">{meetup.title}</h4>
                    {latest?.createdAt && (
                      <span className="chat-time text-[0.75rem] font-bold text-[#666666] whitespace-nowrap">{formatChatListTime(latest.createdAt)}</span>
                    )}
                  </div>

                  <div className="chat-sub-row flex items-center gap-1.5 mt-0.5">
                    <span className="game-badge text-[0.75rem] font-bold text-[#1e1e24] opacity-85">🎲 {meetup.game}</span>
                    {isHost && (
                      <span className="host-chip text-[0.7rem] font-extrabold bg-pastelYellow p-[1px_6px] rounded-full border border-[#1e1e24]">👑 Host</span>
                    )}
                  </div>

                  {latest ? (
                    <p className="chat-snippet text-[0.85rem] text-[#1e1e24] m-0 mt-1 truncate">
                      <strong>{latest.senderName}:</strong> {latest.text}
                    </p>
                  ) : (
                    <p className="chat-snippet no-msg-text text-[0.85rem] text-[#666666] m-0 mt-1 truncate italic">Chưa có tin nhắn nào trong phòng chat...</p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
