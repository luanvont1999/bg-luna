import React, { useState, useEffect } from "react";
import { auth } from "../libs/firebase";
import { onAuthStateChanged, type User } from "firebase/auth";
import CreateMeetupForm from "../components/CreateMeetupForm";
import { navigateToTab } from "../libs/router";
import Icon from "../components/Icon";

interface Props {
  selectedLat: number | null;
  selectedLng: number | null;
  addressText: string;
  userLat: number | null;
  userLng: number | null;
  setSelectedLat: (lat: number | null) => void;
  setSelectedLng: (lng: number | null) => void;
  setAddressText: (text: string) => void;
}

export default function CreateRoute({
  selectedLat,
  selectedLng,
  addressText,
  userLat,
  userLng,
  setSelectedLat,
  setSelectedLng,
  setAddressText,
}: Props) {
  const [currentUser, setCurrentUser] = useState<User | null>(auth.currentUser);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return unsub;
  }, []);

  function handleCreateSuccess() {
    setSelectedLat(null);
    setSelectedLng(null);
    setAddressText("");
    navigateToTab("my-meetups");
  }

  return (
    <section id="create-route" className="pb-20">
      <h2 className="section-title">Lên Kèo Chơi Mới</h2>
      {currentUser ? (
        <CreateMeetupForm
          selectedLat={selectedLat}
          selectedLng={selectedLng}
          addressText={addressText}
          userLat={userLat}
          userLng={userLng}
          setSelectedLat={setSelectedLat}
          setSelectedLng={setSelectedLng}
          setAddressText={setAddressText}
          onCreateSuccess={handleCreateSuccess}
        />
      ) : (
        <div className="cartoon-card locked-card p-10 bg-[#fffefb] text-center mt-5 border-3 border-[#1e1e24] shadow-neo rounded-2xl">
          <div className="locked-icon flex justify-center items-center mb-4 text-[#1e1e24]">
            <Icon name="lock" size={40} />
          </div>
          <h4 className="locked-title text-xl font-bold mb-2 text-[#1e1e24]">Cần Đăng Nhập Tài Khoản</h4>
          <p className="locked-description text-[0.95rem] font-semibold text-[#666666] max-w-[360px] mx-auto mb-6 leading-relaxed">
            Bạn cần đăng nhập tài khoản trước khi có thể tự thiết lập và lên kèo chơi boardgame mới nhé!
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
