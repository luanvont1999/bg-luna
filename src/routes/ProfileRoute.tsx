import React, { useState, useEffect } from "react";
import Auth from "../components/Auth";
import Icon from "../components/Icon";
import { auth, db } from "../libs/firebase";
import { onAuthStateChanged, updateProfile, type User } from "firebase/auth";
import { doc, updateDoc, deleteField } from "firebase/firestore";
import { useUserProfile, userProfileState } from "../libs/userProfile";
import { initNotifications, removeNotificationToken } from "../api/notificationService";



interface Props {
  addToast: (msg: string, type: "success" | "error" | "info") => void;
  deferredPrompt: any;
  isIOS: boolean;
  isStandalone: boolean;
  onTriggerInstall: () => void;
}

export default function ProfileRoute({
  addToast,
  deferredPrompt,
  isIOS,
  isStandalone,
  onTriggerInstall,
}: Props) {
  const BOARDGAME_CATEGORIES = [
    { id: "strategy", label: "Strategy (Chiến thuật)", icon: "strategy" },
    { id: "party", label: "Party Game (Vui nhộn)", icon: "party" },
    { id: "family", label: "Family (Gia đình)", icon: "family" },
    { id: "coop", label: "Co-op (Hợp tác)", icon: "coop" },
    { id: "bluffing", label: "Bluffing (Ẩn vai)", icon: "bluffing" },
    { id: "rpg", label: "RPG (Nhập vai)", icon: "rpg" },
    { id: "economic", label: "Economic (Kinh tế)", icon: "economic" },
    { id: "engine", label: "Engine Building (Xây dựng)", icon: "building-cog" },
  ];

  const [currentUser, setCurrentUser] = useState<User | null>(auth.currentUser);
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [favoriteCategories, setFavoriteCategories] = useState<string[]>([]);

  // Hook subscription to global profile state
  const { profile, isLoading } = useUserProfile();

  useEffect(() => {
    if (profile.loaded) {
      setDisplayName(profile.displayName);
      setBio(profile.bio);
      setFavoriteCategories(profile.favoriteCategories);
    }
  }, [profile.loaded, profile.displayName, profile.bio, profile.favoriteCategories]);

  // Notification toggle state
  const [isNotifEnabled, setIsNotifEnabled] = useState<boolean>(false);
  const [isNotifLoading, setIsNotifLoading] = useState<boolean>(false);

  useEffect(() => {
    if (currentUser) {
      const hasToken = Boolean(localStorage.getItem("fcmToken"));
      const isGranted = typeof Notification !== "undefined" && Notification.permission === "granted";
      setIsNotifEnabled(hasToken && isGranted);
    } else {
      setIsNotifEnabled(false);
    }
  }, [currentUser]);

  async function handleToggleNotification() {
    if (!currentUser || isNotifLoading) return;
    setIsNotifLoading(true);

    try {
      if (!isNotifEnabled) {
        // Turn ON notification
        const token = await initNotifications(currentUser.uid);
        if (token) {
          setIsNotifEnabled(true);
          addToast("Đã bật thông báo đẩy thành công!", "success");
        } else {
          setIsNotifEnabled(false);
          addToast("Không thể bật thông báo. Vui lòng kiểm tra quyền trên trình duyệt!", "error");
        }
      } else {
        // Turn OFF notification
        await removeNotificationToken(currentUser.uid);
        setIsNotifEnabled(false);
        addToast("Đã tắt nhận thông báo đẩy trên thiết bị này.", "info");
      }
    } catch (err: any) {
      console.error("Lỗi toggle thông báo:", err);
      addToast("Lỗi thay đổi trạng thái thông báo: " + err.message, "error");
    } finally {
      setIsNotifLoading(false);
    }
  }

  function toggleCategory(catId: string) {
    if (favoriteCategories.includes(catId)) {
      setFavoriteCategories((prev) => prev.filter((id) => id !== catId));
    } else {
      setFavoriteCategories((prev) => [...prev, catId]);
    }
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!currentUser) return;
    setIsSaving(true);

    try {
      await updateProfile(currentUser, {
        displayName: displayName,
      });

      await userProfileState.updateProfile({
        displayName,
        bio,
        favoriteCategories,
      });

      addToast("Cập nhật thông tin cá nhân thành công!", "success");
    } catch (err: any) {
      console.error("Lỗi cập nhật profile:", err);
      addToast("Không thể cập nhật hồ sơ: " + err.message, "error");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section id="profile-route" className="pb-[60px]">
      <h2 className="section-title">Hồ Sơ Của Bạn</h2>
      <Auth />

      {/* PWA Install Section */}
      {(deferredPrompt || (isIOS && !isStandalone)) && (
        <div className="cartoon-card install-pwa-card bg-[#fffefb] p-5 text-left border-3 border-[#1e1e24] rounded-2xl shadow-neo mb-6">
          <h3 className="pwa-title text-xl font-bold mb-2 text-[#1e1e24] flex items-center gap-2">
            <Icon name="smartphone" size={20} className="inline" /> Cài đặt Ứng dụng PWA
          </h3>
          <p className="pwa-description text-sm font-semibold text-[#666666] mb-4 leading-relaxed">
            Cài đặt Boardgame Luna về màn hình chính điện thoại của bạn để trải nghiệm tốc độ mượt mà hơn và nhận thông báo đẩy tức thì như một ứng dụng di động thực thụ!
          </p>
          <button type="button" className="btn install-pwa-btn inline-flex items-center gap-2 py-2.5 px-5 font-extrabold border-3 border-[#1e1e24] bg-pastelYellow text-[#1e1e24] shadow-neo" onClick={onTriggerInstall}>
            <Icon name="rocket" size={18} className="inline" /> Cài đặt ứng dụng ngay
          </button>
        </div>
      )}

      {/* Profile Edit Section */}
      <div className="profile-edit-section mt-5">
        <h3 className="profile-section-heading text-lg font-bold text-[#666666] mb-4 uppercase flex items-center gap-2">
          <Icon name="settings" size={18} className="inline" /> Thiết lập hồ sơ cá nhân
        </h3>

        {isLoading ? (
          <div className="cartoon-card profile-edit-form skeleton-profile-form bg-[#fffefb] p-6 text-left flex flex-col gap-5 border-3 border-[#1e1e24] rounded-2xl shadow-neo">
            {/* Skeleton: Display Name */}
            <div className="form-group flex flex-col gap-2">
              <div className="skeleton skeleton-line short h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="skeleton skeleton-input h-10 bg-gray-200 rounded"></div>
            </div>
            {/* Skeleton: Bio */}
            <div className="form-group flex flex-col gap-2">
              <div className="skeleton skeleton-line short h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="skeleton skeleton-textarea h-20 bg-gray-200 rounded"></div>
            </div>
            {/* Skeleton: Categories */}
            <div className="form-group flex flex-col gap-2">
              <div className="skeleton skeleton-line medium h-4 bg-gray-200 rounded w-1/3"></div>
              <div className="categories-chips-grid flex flex-wrap gap-2.5 mt-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <div className="skeleton skeleton-badge bg-gray-200 rounded-full h-8 w-[120px]" key={n}></div>
                ))}
              </div>
            </div>
            {/* Skeleton: Save Button */}
            <div className="skeleton skeleton-btn h-12 bg-gray-200 rounded w-[200px]"></div>
          </div>
        ) : currentUser ? (
          <form onSubmit={handleSaveProfile} className="cartoon-card profile-edit-form bg-[#fffefb] p-6 text-left flex flex-col gap-5 border-3 border-[#1e1e24] rounded-2xl shadow-neo">
            <div className="form-group flex flex-col gap-2">
              <label htmlFor="displayName" className="font-bold text-[0.95rem] text-[#1e1e24]">Tên hiển thị:</label>
              <input
                type="text"
                id="displayName"
                placeholder="Tên của bạn chơi..."
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="p-3 font-semibold text-base rounded-md border-3 border-[#1e1e24] bg-white outline-none shadow-[3px_3px_0_#1e1e24]"
                required
              />
            </div>

            <div className="form-group flex flex-col gap-2">
              <label htmlFor="bio" className="font-bold text-[0.95rem] text-[#1e1e24]">Giới thiệu:</label>
              <textarea
                id="bio"
                placeholder="Kinh nghiệm chơi, câu nói ưa thích hoặc nhóm boardgame đang hoạt động..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                className="p-3 font-semibold text-base rounded-md border-3 border-[#1e1e24] bg-white outline-none shadow-[3px_3px_0_#1e1e24] resize-y"
              ></textarea>
            </div>

            {/* Push Notification Toggle Switch */}
            <div className="form-group flex items-center justify-between p-4 bg-[#fbf7ed] border-3 border-[#1e1e24] rounded-xl shadow-[3px_3px_0_#1e1e24] gap-4">
              <div className="flex flex-col gap-1 text-left">
                <span className="font-extrabold text-[0.98rem] text-[#1e1e24] flex items-center gap-2">
                  <Icon name="bell" size={18} className="inline text-[#1e1e24]" /> Thông báo đẩy (Push Notifications)
                </span>
                <span className="text-xs font-bold text-[#646473]">
                  {isNotifEnabled
                    ? "Đang bật nhận thông báo về kèo mới, lời nhắn chat & cập nhật lượt chơi"
                    : "Đã tắt. Bật lại để không bỏ lỡ thông báo từ nhóm chơi!"}
                </span>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={isNotifEnabled}
                onClick={handleToggleNotification}
                disabled={isNotifLoading}
                className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-3 border-[#1e1e24] transition-colors duration-200 ease-in-out outline-none shadow-[2px_2px_0_#1e1e24] ${
                  isNotifEnabled ? "bg-[#9ee3b2]" : "bg-[#e5e7eb]"
                } ${isNotifLoading ? "opacity-60 cursor-not-allowed" : ""}`}
              >
                <span
                  className={`pointer-events-none inline-block h-6 w-6 transform rounded-full border-2 border-[#1e1e24] shadow-md transition duration-200 ease-in-out mt-[1px] ${
                    isNotifEnabled ? "translate-x-6 bg.pastelYellow bg-[#fef08a]" : "translate-x-0.5 bg-white"
                  }`}
                />
              </button>
            </div>

            <div className="form-group flex flex-col gap-2">
              <span className="form-label font-bold text-[0.95rem] text-[#1e1e24]">Thể loại boardgame yêu thích (Chọn nhiều):</span>
              <div className="categories-chips-grid flex flex-wrap gap-2.5 mt-1">
                {BOARDGAME_CATEGORIES.map((cat) => {
                  const isSelected = favoriteCategories.includes(cat.id);
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      className={`category-chip-btn flex items-center gap-2 py-2 px-3.5 text-[0.85rem] font-bold border-3 border-[#1e1e24] rounded-lg cursor-pointer transition-all duration-100 outline-none ${
                        isSelected
                          ? "bg-pastelYellow translate-x-[2px] translate-y-[2px] shadow-[1px_1px_0_#1e1e24]"
                          : "bg-white shadow-[3px_3px_0_#1e1e24] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0_#1e1e24] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0_#1e1e24]"
                      }`}
                      onClick={() => toggleCategory(cat.id)}
                    >
                      {/* Custom Checkbox Indicator */}
                      <div className="w-4 h-4 border-2 border-[#1e1e24] bg-white rounded flex items-center justify-center shrink-0">
                        {isSelected && <Icon name="check" size={10} className="text-[#1e1e24] font-extrabold" />}
                      </div>
                      <Icon name={cat.icon} size={14} className="chip-icon inline" />
                      <span>{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              className={`btn save-profile-btn self-start py-3 px-6 text-[0.95rem] font-extrabold border-3 border-[#1e1e24] rounded-lg bg-[#9ee3b2] text-[#1e1e24] shadow-neo cursor-pointer inline-flex items-center gap-2 ${
                isSaving ? "btn-loading" : ""
              }`}
              disabled={isSaving}
            >
              <Icon name="save" size={18} className="inline" />
              <span>{isSaving ? "Đang lưu..." : "Lưu thông tin hồ sơ"}</span>
            </button>
          </form>
        ) : (
          <div className="cartoon-card locked-card p-8 bg-[#fffefb] text-center border-3 border-[#1e1e24] rounded-2xl shadow-neo">
            <div className="locked-icon flex justify-center items-center mb-3 text-[#1e1e24]">
              <Icon name="lock" size={40} />
            </div>
            <h4 className="locked-title text-[1.15rem] font-bold mb-2 text-[#1e1e24]">Hồ Sơ Chưa Được Kích Hoạt</h4>
            <p className="locked-description text-sm font-semibold text-[#666666] max-w-[320px] mx-auto leading-relaxed">
              Vui lòng đăng nhập hoặc tạo tài khoản mới ở trên để bắt đầu tùy chỉnh thông tin cá nhân của bạn chơi!
            </p>
          </div>
        )}
      </div>

    </section>
  );
}

