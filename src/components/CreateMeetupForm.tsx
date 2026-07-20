import React, { useState, useEffect, useRef } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../libs/firebase";
import { navigate } from "../libs/router";
import Icon from "./Icon";
import { getMeetupCity } from "../utils/geo";

interface Props {
  selectedLat: number | null;
  selectedLng: number | null;
  userLat?: number | null;
  userLng?: number | null;
  addressText?: string;
  onCreateSuccess: () => void;
  setSelectedLat: (lat: number | null) => void;
  setSelectedLng: (lng: number | null) => void;
  setAddressText: (text: string) => void;
}

export default function CreateMeetupForm({
  selectedLat,
  selectedLng,
  userLat = null,
  userLng = null,
  addressText = "",
  onCreateSuccess,
  setSelectedLat,
  setSelectedLng,
  setAddressText,
}: Props) {
  // State variables with draft recovery
  const [user, setUser] = useState<User | null>(null);
  const [title, setTitle] = useState<string>(localStorage.getItem("draft_meetup_title") || "");
  const [game, setGame] = useState<string>(localStorage.getItem("draft_meetup_game") || "");
  const [time, setTime] = useState<string>(localStorage.getItem("draft_meetup_time") || ""); // datetime-local format
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);

  // New detailed fields
  const [existingPlayers, setExistingPlayers] = useState<number>(
    Number(localStorage.getItem("draft_meetup_existingPlayers")) || 1
  );
  const [playersNeeded, setPlayersNeeded] = useState<number>(
    Number(localStorage.getItem("draft_meetup_playersNeeded")) || 4
  );
  const [estimatedDuration, setEstimatedDuration] = useState<string>(
    localStorage.getItem("draft_meetup_estimatedDuration") || "2 - 3 tiếng"
  );
  const [notes, setNotes] = useState<string>(localStorage.getItem("draft_meetup_notes") || "");

  // Address Geocoding states
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [isSearchingAddress, setIsSearchingAddress] = useState<boolean>(false);
  const debounceTimer = useRef<any>(null);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");

  // Auto-save form drafts to localStorage
  useEffect(() => {
    localStorage.setItem("draft_meetup_title", title);
    localStorage.setItem("draft_meetup_game", game);
    localStorage.setItem("draft_meetup_time", time);
    localStorage.setItem("draft_meetup_existingPlayers", String(existingPlayers));
    localStorage.setItem("draft_meetup_playersNeeded", String(playersNeeded));
    localStorage.setItem("draft_meetup_estimatedDuration", estimatedDuration);
    localStorage.setItem("draft_meetup_notes", notes);
  }, [title, game, time, existingPlayers, playersNeeded, estimatedDuration, notes]);

  function clearDraft() {
    localStorage.removeItem("draft_meetup_title");
    localStorage.removeItem("draft_meetup_game");
    localStorage.removeItem("draft_meetup_time");
    localStorage.removeItem("draft_meetup_existingPlayers");
    localStorage.removeItem("draft_meetup_playersNeeded");
    localStorage.removeItem("draft_meetup_estimatedDuration");
    localStorage.removeItem("draft_meetup_notes");
  }

  async function reverseGeocode(targetLat: number, targetLng: number) {
    const token = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
    if (!token) return;

    setIsSearchingAddress(true);
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${targetLng},${targetLat}.json?access_token=${token}&country=vn&limit=1&language=vi`;

    try {
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.features && data.features.length > 0) {
          setAddressText(data.features[0].place_name);
        } else {
          setAddressText(`Tọa độ: ${targetLat.toFixed(5)}, ${targetLng.toFixed(5)}`);
        }
      } else {
        setAddressText(`Tọa độ: ${targetLat.toFixed(5)}, ${targetLng.toFixed(5)}`);
      }
    } catch (err) {
      console.error("Reverse geocoding failed:", err);
      setAddressText(`Tọa độ: ${targetLat.toFixed(5)}, ${targetLng.toFixed(5)}`);
    } finally {
      setIsSearchingAddress(false);
    }
  }

  // Sync selected location from Map click prop
  useEffect(() => {
    if (selectedLat !== null && selectedLng !== null) {
      if (lat !== selectedLat || lng !== selectedLng) {
        setLat(selectedLat);
        setLng(selectedLng);
        reverseGeocode(selectedLat, selectedLng);
      }
    } else {
      if (lat !== null || lng !== null) {
        setLat(null);
        setLng(null);
        setAddressText("");
      }
    }
  }, [selectedLat, selectedLng]);

  // Auth state listener and click outside handling
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const isInsideSearch =
        target.closest(".location-input-container") ||
        target.closest(".autocomplete-dropdown-list");
      if (!isInsideSearch) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("click", handleGlobalClick);

    return () => {
      unsubscribe();
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      document.removeEventListener("click", handleGlobalClick);
    };
  }, []);

  async function searchAddress(query: string) {
    if (query.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    const token = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
    if (!token) return;

    setIsSearchingAddress(true);

    let proximityQuery = "";
    if (userLat !== null && userLng !== null) {
      proximityQuery = `&proximity=${userLng},${userLat}`;
    }

    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${token}&country=vn&limit=5&language=vi&types=poi,address${proximityQuery}`;

    try {
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (query.trim().length >= 3) {
          setSuggestions(data.features || []);
        }
      }
    } catch (err) {
      console.error("Geocoding lookup failed:", err);
    } finally {
      setIsSearchingAddress(false);
    }
  }

  function handleAddressInput(val: string) {
    setAddressText(val);
    setShowDropdown(true);

    setLat(null);
    setLng(null);
    setSelectedLat(null);
    setSelectedLng(null);

    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      searchAddress(val);
    }, 400);
  }

  function selectSuggestion(item: any) {
    const [itemLng, itemLat] = item.center;

    setLat(itemLat);
    setLng(itemLng);

    setSelectedLat(itemLat);
    setSelectedLng(itemLng);

    setAddressText(item.place_name);
    setSuggestions([]);
    setShowDropdown(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      setErrorMessage("Bạn phải đăng nhập để lên kèo chơi!");
      return;
    }

    if (!title || !game || !time || lat === null || lng === null) {
      setErrorMessage("Vui lòng điền đầy đủ thông tin và nhập/chọn địa chỉ!");
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");
    setIsSubmitting(true);

    try {
      const colors = [
        "#bca0f5",
        "#ffa4b2",
        "#ffe869",
        "#ffb875",
        "#9ee3b2",
        "#a4f0fd",
      ];
      const color = colors[Math.floor(Math.random() * colors.length)];
      const hostName = user.displayName || user.email || "Ẩn danh";

      await addDoc(collection(db, "meetups"), {
        title,
        game,
        hostName,
        hostUid: user.uid,
        lat,
        lng,
        city: getMeetupCity({ lat, lng }),
        playersCount: Math.max(1, Number(existingPlayers) || 1),
        playersNeeded: Number(playersNeeded) || 4,
        approvedUids: [user.uid],
        time,
        estimatedDuration: estimatedDuration.trim() || "2 - 3 tiếng",
        duration: estimatedDuration.trim() || "2 - 3 tiếng",
        notes: notes.trim(),
        description: notes.trim(),
        color,
        createdAt: serverTimestamp(),
      });

      setSuccessMessage(
        "Tạo kèo mới thành công! Quân meeple của bạn đã được ghim lên bản đồ."
      );

      setTitle("");
      setGame("");
      setTime("");
      setExistingPlayers(1);
      setPlayersNeeded(4);
      setEstimatedDuration("2 - 3 tiếng");
      setNotes("");
      setAddressText("");
      setLat(null);
      setLng(null);
      setSelectedLat(null);
      setSelectedLng(null);

      clearDraft();

      onCreateSuccess();
    } catch (err: any) {
      console.error("[Firestore] Create meetup failed:", err);
      setErrorMessage(
        "Lỗi tạo kèo trên Firestore: " + (err.message || "Lỗi kết nối")
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="create-meetup-wrapper w-full max-w-[480px] mx-auto">
      {!user ? (
        <div className="cartoon-card locked-card bg-[#ffebd1] border-[#1e1e24] p-[30px_24px] text-center">
          <div className="lock-header flex items-center justify-center gap-[10px] mb-[15px] text-[#92400e] font-bold text-lg">
            <Icon name="lock" size={24} />
            <h3>Lên Kèo Đang Bị Khóa</h3>
          </div>
          <p className="mb-[15px] font-medium text-sm">
            Bạn cần đăng nhập tài khoản Firebase để có thể tự lên kèo chơi riêng và mời mọi người tham gia.
          </p>
          <a href="#/profile" className="btn btn-primary inline-block">Đi đến Đăng nhập ngay</a>
        </div>
      ) : (
        <div className="cartoon-card form-card bg-[#ffe869] p-6 text-left border-3 border-[#1e1e24] rounded-2xl shadow-neo">
          {errorMessage && (
            <div className="alert error-alert p-[10px_14px] rounded-md border-2 border-[#1e1e24] font-bold text-[0.9rem] mb-4 bg-[#ffccd3] text-[#b91c1c]">{errorMessage}</div>
          )}
          {successMessage && (
            <div className="alert success-alert p-[10px_14px] rounded-md border-2 border-[#1e1e24] font-bold text-[0.9rem] mb-4 bg-[#d1fae5] text-[#065f46]">{successMessage}</div>
          )}

          <form onSubmit={handleSubmit} className="meetup-form flex flex-col gap-4">
            <div className="form-group flex flex-col gap-[6px]">
              <label htmlFor="meetup-title" className="font-extrabold text-[0.95rem] text-[#1e1e24]">Tên Kèo Chơi:</label>
              <input
                type="text"
                id="meetup-title"
                placeholder="Ví dụ: Đại chiến Werewolf, Tìm chân Catan..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isSubmitting}
                className="p-[12px_14px] rounded-md border-3 border-[#1e1e24] text-[0.95rem] font-semibold shadow-[2px_2px_0_#1e1e24] outline-none bg-white transition-all duration-100 focus:translate-x-[-1px] focus:translate-y-[-1px] focus:shadow-[3px_3px_0_#1e1e24]"
                required
              />
            </div>

            <div className="form-group flex flex-col gap-[6px]">
              <label htmlFor="meetup-game" className="font-extrabold text-[0.95rem] text-[#1e1e24]">Các Boardgame Sẽ Chơi:</label>
              <input
                type="text"
                id="meetup-game"
                placeholder="Ví dụ: Catan, Ma sói, Avalon, Mèo nổ..."
                value={game}
                onChange={(e) => setGame(e.target.value)}
                disabled={isSubmitting}
                className="p-[12px_14px] rounded-md border-3 border-[#1e1e24] text-[0.95rem] font-semibold shadow-[2px_2px_0_#1e1e24] outline-none bg-white transition-all duration-100 focus:translate-x-[-1px] focus:translate-y-[-1px] focus:shadow-[3px_3px_0_#1e1e24]"
                required
              />
            </div>

            <div className="form-group flex flex-col gap-[6px]">
              <label htmlFor="meetup-time" className="font-extrabold text-[0.95rem] text-[#1e1e24]">Thời Gian Bắt Đầu:</label>
              <input
                type="datetime-local"
                id="meetup-time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                disabled={isSubmitting}
                className="p-[12px_14px] rounded-md border-3 border-[#1e1e24] text-[0.95rem] font-semibold shadow-[2px_2px_0_#1e1e24] outline-none bg-white transition-all duration-100 focus:translate-x-[-1px] focus:translate-y-[-1px] focus:shadow-[3px_3px_0_#1e1e24]"
                required
              />
            </div>

            <div className="short-inputs-row flex flex-row flex-wrap sm:flex-nowrap gap-2 w-full">
              <div className="form-group flex flex-col gap-[6px] flex-1 min-w-[110px]">
                <label htmlFor="existing-players" className="font-extrabold text-[0.88rem] text-[#1e1e24]">Đã có sẵn:</label>
                <input
                  type="number"
                  id="existing-players"
                  min="1"
                  max="30"
                  placeholder="1"
                  value={existingPlayers}
                  onChange={(e) => {
                    const val = Math.max(1, Number(e.target.value));
                    setExistingPlayers(val);
                    if (val > playersNeeded) setPlayersNeeded(val);
                  }}
                  disabled={isSubmitting}
                  className="p-[12px_14px] rounded-md border-3 border-[#1e1e24] text-[0.95rem] font-semibold shadow-[2px_2px_0_#1e1e24] outline-none bg-white transition-all duration-100 focus:translate-x-[-1px] focus:translate-y-[-1px] focus:shadow-[3px_3px_0_#1e1e24]"
                  required
                />
              </div>

              <div className="form-group flex flex-col gap-[6px] flex-1 min-w-[110px]">
                <label htmlFor="players-needed" className="font-extrabold text-[0.88rem] text-[#1e1e24]">Cần tối đa:</label>
                <input
                  type="number"
                  id="players-needed"
                  min={Math.max(2, existingPlayers)}
                  max="30"
                  placeholder="4"
                  value={playersNeeded}
                  onChange={(e) => setPlayersNeeded(Math.max(existingPlayers, Number(e.target.value)))}
                  disabled={isSubmitting}
                  className="p-[12px_14px] rounded-md border-3 border-[#1e1e24] text-[0.95rem] font-semibold shadow-[2px_2px_0_#1e1e24] outline-none bg-white transition-all duration-100 focus:translate-x-[-1px] focus:translate-y-[-1px] focus:shadow-[3px_3px_0_#1e1e24]"
                  required
                />
              </div>

              <div className="form-group flex flex-col gap-[6px] flex-1 min-w-[130px]">
                <label htmlFor="meetup-duration" className="font-extrabold text-[0.88rem] text-[#1e1e24]">Thời gian:</label>
                <select
                  id="meetup-duration"
                  value={estimatedDuration}
                  onChange={(e) => setEstimatedDuration(e.target.value)}
                  disabled={isSubmitting}
                  className="p-[12px_14px] rounded-md border-3 border-[#1e1e24] text-[0.95rem] font-semibold shadow-[2px_2px_0_#1e1e24] outline-none bg-white transition-all duration-100 focus:translate-x-[-1px] focus:translate-y-[-1px] focus:shadow-[3px_3px_0_#1e1e24]"
                >
                  <option value="1 - 2 tiếng">1 - 2 tiếng</option>
                  <option value="2 - 3 tiếng">2 - 3 tiếng</option>
                  <option value="3 - 5 tiếng">3 - 5 tiếng</option>
                  <option value="Cả buổi (~6 tiếng)">Cả buổi (~6 tiếng)</option>
                  <option value="Tùy hứng">Tùy hứng</option>
                </select>
              </div>
            </div>

            <div className="form-group flex flex-col gap-[6px]">
              <label htmlFor="meetup-notes" className="font-extrabold text-[0.95rem] text-[#1e1e24]">Thông Tin Thêm / Ghi Chú:</label>
              <textarea
                id="meetup-notes"
                placeholder="Ví dụ: Đã đặt trước bàn ở quán, bao hướng dẫn luật từ A-Z, tìm bạn chơi vui vẻ..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                disabled={isSubmitting}
                className="p-[12px_14px] rounded-md border-3 border-[#1e1e24] text-[0.95rem] font-semibold shadow-[2px_2px_0_#1e1e24] outline-none bg-white transition-all duration-100 focus:translate-x-[-1px] focus:translate-y-[-1px] focus:shadow-[3px_3px_0_#1e1e24]"
              ></textarea>
            </div>

            <div className="form-group flex flex-col gap-[6px] relative">
              <label htmlFor="meetup-location" className="font-extrabold text-[0.95rem] text-[#1e1e24]">Vị Trí Kèo Chơi:</label>
              <div className="location-input-container flex gap-2 w-full">
                <input
                  type="text"
                  id="meetup-location"
                  placeholder="Nhập địa chỉ hoặc bấm nút Bản đồ..."
                  value={addressText}
                  onChange={(e) => handleAddressInput(e.target.value)}
                  onFocus={() => setShowDropdown(true)}
                  disabled={isSubmitting}
                  autoComplete="off"
                  className="p-[12px_14px] rounded-md border-3 border-[#1e1e24] text-[0.95rem] font-semibold shadow-[2px_2px_0_#1e1e24] outline-none bg-white transition-all duration-100 focus:translate-x-[-1px] focus:translate-y-[-1px] focus:shadow-[3px_3px_0_#1e1e24] flex-1 min-w-0"
                  required
                />
                <button
                  type="button"
                  className="btn btn-secondary btn-map-select flex items-center gap-1 p-[10px_14px] text-sm whitespace-nowrap rounded-md border-3 border-[#1e1e24] shadow-[2px_2px_0_#1e1e24]"
                  onClick={() => navigate({ name: "map", mode: "select" })}
                  disabled={isSubmitting}
                >
                  <Icon name="map" size={15} />
                  <span>Bản đồ</span>
                </button>
              </div>

              {lat !== null && lng !== null ? (
                <span className="location-status-badge text-[#10b981] font-bold text-xs mt-1 flex items-center gap-1">
                  <Icon name="check" size={13} /> Đã nhận tọa độ
                </span>
              ) : isSearchingAddress ? (
                <span className="location-status-badge searching text-[#eab308] font-bold text-xs mt-1">
                  Đang quét địa điểm...
                </span>
              ) : null}

              {showDropdown && suggestions.length > 0 && (
                <ul className="autocomplete-dropdown-list absolute top-[calc(100%-4px)] left-0 right-0 z-[1100] bg-white border-3 border-[#1e1e24] rounded-md shadow-[4px_4px_0_#1e1e24] list-none m-[4px_0_0_0] p-[6px_0] max-h-[220px] overflow-y-auto">
                  {suggestions.map((item) => (
                    <li className="dropdown-item w-full" key={item.id}>
                      <button
                        type="button"
                        onClick={() => selectSuggestion(item)}
                        className="w-full text-left p-[10px_14px] font-bold text-xs border-none bg-none text-[#1e1e24] transition-colors duration-100 hover:bg-[#ffa4b2]"
                      >
                        <Icon name="pin" size={14} className="mr-1 inline" /> {item.place_name}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <button
              type="submit"
              className={`btn btn-primary w-full mt-[10px] ${isSubmitting ? "btn-loading" : ""}`}
              disabled={isSubmitting}
            >
              <Icon name="plus" size={18} className="mr-1 inline" />
              <span>{isSubmitting ? "Đang tạo kèo..." : "Lên kèo chơi ngay!"}</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
