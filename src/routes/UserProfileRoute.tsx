import React, { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../libs/firebase";
import { goBack } from "../libs/router";
import Icon from "../components/Icon";

interface PresetCategory {
  id: string;
  label: string;
  icon: string;
}

const BOARDGAME_CATEGORIES: PresetCategory[] = [
  { id: "strategy", label: "Strategy (Chiến thuật)", icon: "strategy" },
  { id: "party", label: "Party Game (Vui nhộn)", icon: "party" },
  { id: "family", label: "Family (Gia đình)", icon: "family" },
  { id: "coop", label: "Co-op (Hợp tác)", icon: "coop" },
  { id: "bluffing", label: "Bluffing (Ẩn vai)", icon: "bluffing" },
  { id: "rpg", label: "RPG (Nhập vai)", icon: "rpg" },
  { id: "economic", label: "Economic (Kinh tế)", icon: "economic" },
  { id: "engine", label: "Engine Building (Xây dựng)", icon: "building-cog" },
];

interface Props {
  userId: string;
}

interface UserProfileData {
  displayName: string;
  bio: string;
  favoriteCategories: string[];
}

export default function UserProfileRoute({ userId }: Props) {
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    async function loadUserProfile() {
      if (!userId) return;
      setLoading(true);
      setError("");
      try {
        const docRef = doc(db, "users", userId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setProfile({
            displayName: data.displayName || "Thành viên ẩn danh",
            bio: data.bio || "",
            favoriteCategories: data.favoriteCategories || [],
          });
        } else {
          setError(
            "Không tìm thấy thông tin của người chơi này trên hệ thống.",
          );
        }
      } catch (err: any) {
        console.error("Error loading user profile:", err);
        setError("Không thể kết nối cơ sở dữ liệu: " + err.message);
      } finally {
        setLoading(false);
      }
    }

    loadUserProfile();
  }, [userId]);

  const initials = profile?.displayName
    ? profile.displayName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "?";

  // Generate a friendly visual color based on the username string
  const getAvatarBg = (name: string) => {
    const colors = [
      "#ffa4b2",
      "#a4f0fd",
      "#ffe869",
      "#bca0f5",
      "#a7f3d0",
      "#fed7aa",
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const avatarBg = profile ? getAvatarBg(profile.displayName) : "#e2e8f0";

  return (
    <section
      id="user-profile-route"
      className="pb-[60px] flex flex-col gap-4 text-left"
    >
      {/* Top Header */}
      <div className="cartoon-card route-top-nav bg-pastelYellow flex items-center gap-4 p-[16px_24px] rounded-lg shadow-neo text-left shrink-0">
        <button
          type="button"
          className="btn btn-secondary back-btn py-2 px-4 text-[0.95rem] whitespace-nowrap"
          onClick={goBack}
        >
          ← Quay lại
        </button>
        <div className="nav-title-group flex justify-end flex-1">
          <h2 className="text-[1.5rem] font-extrabold m-0 flex items-center gap-2">
            Thông tin
            <Icon name="user" size={24} className="inline" />
          </h2>
        </div>
      </div>

      {loading ? (
        <div className="cartoon-card profile-details-card bg-[#fffefb] p-[28px_24px] flex flex-col items-center gap-5 border-3 border-[#1e1e24] rounded-2xl shadow-neo animate-pulse">
          <div className="w-24 h-24 rounded-full border-3 border-[#1e1e24] bg-gray-200"></div>
          <div className="h-6 bg-gray-200 rounded w-1/3 mt-2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 mt-1"></div>
          <div className="w-full h-[1.5px] bg-[#1e1e24] my-2 opacity-15"></div>
          <div className="w-full flex flex-col gap-2">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-12 bg-gray-200 rounded w-full"></div>
          </div>
        </div>
      ) : error ? (
        <div className="cartoon-card error-card m-auto text-center p-10 bg-white border-3 border-[#1e1e24] shadow-neo rounded-2xl max-w-[420px] flex flex-col items-center gap-3">
          <Icon name="alert-triangle" size={40} className="text-[#ef4444]" />
          <h3 className="text-xl font-bold text-[#1e1e24] m-0">Lỗi Hồ Sơ</h3>
          <p className="text-sm font-semibold text-[#666666] leading-relaxed">
            {error}
          </p>
          <button className="btn btn-primary mt-2" onClick={goBack}>
            Quay lại trang trước
          </button>
        </div>
      ) : profile ? (
        <div className="cartoon-card profile-details-card bg-[#fffefb] p-[28px_24px] flex flex-col items-center gap-5 border-3 border-[#1e1e24] rounded-2xl shadow-neo animate-[bubble-pop_0.15s_ease-out]">
          {/* Custom cartoonish avatar */}
          <div
            className="w-24 h-24 rounded-full border-3 border-[#1e1e24] flex items-center justify-center font-extrabold text-[2.5rem] shadow-neo text-[#1e1e24] select-none"
            style={{ backgroundColor: avatarBg }}
          >
            {initials}
          </div>

          <div className="text-center w-full">
            <h3 className="text-2xl font-extrabold text-[#1e1e24] m-0">
              {profile.displayName}
            </h3>
            {profile.bio && (
              <p className="text-[0.95rem] font-semibold text-[#555555] italic mt-2.5 max-w-[450px] mx-auto leading-relaxed">
                "{profile.bio}"
              </p>
            )}
          </div>

          <div className="w-full h-[2px] border-t-2 border-dashed border-[#1e1e24] my-2"></div>

          {/* Favorite Genres block */}
          <div className="w-full flex flex-col gap-3">
            <h4 className="text-[1.05rem] font-extrabold text-[#1e1e24] m-0 flex items-center gap-2">
              <Icon name="sparkles" size={18} /> Thể loại boardgame yêu thích:
            </h4>

            {profile.favoriteCategories.length === 0 ? (
              <p className="text-sm font-semibold text-[#888888] italic m-0">
                Người chơi này chưa chọn thể loại game yêu thích nào.
              </p>
            ) : (
              <div className="categories-chips-grid flex flex-wrap gap-2.5 mt-1">
                {BOARDGAME_CATEGORIES.filter((cat) =>
                  profile.favoriteCategories.includes(cat.id),
                ).map((cat) => (
                  <span
                    key={cat.id}
                    className="category-chip-btn flex items-center gap-2 py-1.5 px-3 text-[0.82rem] font-bold border-2 border-[#1e1e24] rounded-lg bg-pastelYellow shadow-[2px_2px_0_#1e1e24]"
                  >
                    <Icon
                      name={cat.icon}
                      size={13}
                      className="chip-icon inline"
                    />
                    <span>{cat.label}</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}
