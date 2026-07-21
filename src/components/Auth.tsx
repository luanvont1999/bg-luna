import React, { useState, useEffect } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  getIdToken,
  User,
} from "firebase/auth";
import { auth, googleProvider, db } from "../libs/firebase";
import { doc, updateDoc, deleteField } from "firebase/firestore";
import Icon from "./Icon";
import { userProfileState } from "../libs/userProfile";
import { translateError } from "../utils/error";
import { initNotifications, removeNotificationToken } from "../api/notificationService";
import { syncLoginOrRegisterApi, syncLogoutApi } from "../api/authService";

export default function Auth() {
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [idToken, setIdToken] = useState<string>("");
  const [isLoginMode, setIsLoginMode] = useState<boolean>(true);
  const [email, setEmail] = useState<string>("luanvont1999@gmail.com");
  const [password, setPassword] = useState<string>("123456");

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");

  // Check if Firebase keys are placeholders
  const [isConfigMissing, setIsConfigMissing] = useState<boolean>(false);

  useEffect(() => {
    // Basic verification of API Key config
    if (auth.config?.apiKey === "PLACEHOLDER_API_KEY") {
      setIsConfigMissing(true);
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const token = await getIdToken(currentUser, true);
          setIdToken(token);
        } catch (err) {
          console.error("Failed to get ID Token", err);
        }
      } else {
        setIdToken("");
      }
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage("Vui lòng nhập đầy đủ Email và Mật khẩu!");
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");
    setIsSubmitting(true);

    try {
      if (isLoginMode) {
        await signInWithEmailAndPassword(auth, email, password);
        setSuccessMessage("Đăng nhập thành công!");
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
        setSuccessMessage("Đăng ký tài khoản thành công!");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(translateError(err.code || err.message));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGoogleLogin() {
    setErrorMessage("");
    setSuccessMessage("");
    setIsSubmitting(true);

    try {
      await signInWithPopup(auth, googleProvider);
      setSuccessMessage("Đăng nhập Google thành công!");
    } catch (err: any) {
      console.error(err);
      setErrorMessage(translateError(err.code || err.message));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSignOut() {
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        const token = localStorage.getItem("fcmToken");
        await syncLogoutApi(currentUser.uid, token);
        await removeNotificationToken(currentUser.uid);
      } else {
        localStorage.removeItem('fcmToken');
      }

      await signOut(auth);
      setSuccessMessage("Đã đăng xuất thành công.");
    } catch (err: any) {
      setErrorMessage("Lỗi đăng xuất: " + err.message);
    }
  }

  return (
    <div className="mx-auto mb-5 w-full max-w-[520px]" id="auth-section">
      {isConfigMissing && (
        <div className="cartoon-card warning-card mb-6 bg-[#ffccd3] border-[#ef4444] text-left p-6">
          <div className="flex items-center gap-2 mb-3 text-[#b91c1c] font-bold text-lg">
            <Icon name="alert-triangle" size={24} />
            <h3>Firebase Chưa Được Cấu Hình!</h3>
          </div>
          <p className="mb-3 text-sm">
            Bạn cần cấu hình các biến môi trường Firebase. Đối với local dev, hãy tạo file <code>.env</code> (hoặc <code>.env.development</code>) ở thư mục gốc của dự án. Đối với Vercel, hãy cấu hình các biến này trong phần <strong>Settings &gt; Environment Variables</strong> trên Vercel Dashboard. Các khóa cần cấu hình:
          </p>
          <pre className="bg-[rgba(255,255,255,0.5)] border-2 border-[#ef4444] p-3 rounded-md font-mono text-[0.85rem] my-3 overflow-x-auto">
            <code>
{`VITE_FIREBASE_API_KEY=YOUR_KEY
VITE_FIREBASE_AUTH_DOMAIN=YOUR_DOMAIN
VITE_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET=YOUR_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID=YOUR_SENDER_ID
VITE_FIREBASE_APP_ID=YOUR_APP_ID`}
            </code>
          </pre>
          <p className="mt-3 text-[0.85rem] text-[#666666]">
            * Bạn có thể lấy các thông tin này bằng cách tạo Project trên{" "}
            <a
              href="https://console.firebase.google.com/"
              target="_blank"
              rel="noreferrer"
              className="underline font-bold"
            >
              Firebase Console
            </a>.
          </p>
        </div>
      )}

      {isLoading ? (
        <div className="cartoon-card profile-card bg-white text-left p-6 skeleton-auth-card">
          <div className="flex items-center gap-4 mb-6">
            <div className="skeleton profile-avatar-placeholder w-16 h-16 rounded-full border-3 border-[#e8e2d6]"></div>
            <div className="skeleton-auth-info flex-1 flex flex-col gap-2">
              <div className="skeleton skeleton-line long h-4 bg-gray-200 rounded"></div>
              <div className="skeleton skeleton-line medium h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
          <div className="skeleton skeleton-btn w-[160px] h-[42px] bg-gray-200 rounded"></div>
        </div>
      ) : user ? (
        <div className="cartoon-card profile-card bg-white text-left p-6">
          <div className="flex items-center gap-4 mb-6">
            {user.photoURL ? (
              <img src={user.photoURL} alt="Avatar" className="profile-avatar w-16 h-16 rounded-full border-3 border-[#1e1e24] shadow-[2px_2px_0_#1e1e24]" />
            ) : (
              <div className="profile-avatar-placeholder w-16 h-16 rounded-full border-3 border-[#1e1e24] bg-[#a4f0fd] flex items-center justify-center text-[1.8rem] font-bold shadow-[2px_2px_0_#1e1e24]">
                {user.email ? user.email[0].toUpperCase() : "U"}
              </div>
            )}
            <div className="profile-info">
              <h3 className="text-xl font-bold text-[#1e1e24]">Chào mừng, {user.displayName || "Thành viên"}!</h3>
              <p className="user-email text-[#646473] font-medium">{user.email}</p>
            </div>
          </div>

          <div className="auth-actions">
            <button className="btn btn-secondary" onClick={handleSignOut}>
              Đăng xuất tài khoản
            </button>
          </div>
        </div>
      ) : (
        <div className="cartoon-card auth-card bg-white p-6">
          <div className="flex border-b-3 border-[#1e1e24] mb-6">
            <button
              className={`flex-1 py-3 text-lg font-bold bg-none border-none cursor-pointer text-[#666666] transition-all duration-150 ${
                isLoginMode ? "text-[#1e1e24] bg-[#bca0f5] border-t-3 border-l-3 border-r-3 border-[#1e1e24] rounded-t-md translate-y-[3px] shadow-[2px_-2px_0_#1e1e24]" : ""
              }`}
              onClick={() => {
                setIsLoginMode(true);
                setErrorMessage("");
              }}
            >
              Đăng nhập
            </button>
            <button
              className={`flex-1 py-3 text-lg font-bold bg-none border-none cursor-pointer text-[#666666] transition-all duration-150 ${
                !isLoginMode ? "text-[#1e1e24] bg-[#bca0f5] border-t-3 border-l-3 border-r-3 border-[#1e1e24] rounded-t-md translate-y-[3px] shadow-[2px_-2px_0_#1e1e24]" : ""
              }`}
              onClick={() => {
                setIsLoginMode(false);
                setErrorMessage("");
              }}
            >
              Đăng ký
            </button>
          </div>

          <form onSubmit={handleEmailAuth} className="auth-form text-left">
            {errorMessage && (
              <div className="alert-box error-alert p-[10px_14px] rounded-md border-2 border-[#1e1e24] font-bold text-[0.9rem] mb-4 bg-[#ffccd3] text-[#b91c1c]">
                {errorMessage}
              </div>
            )}
            {successMessage && (
              <div className="alert-box success-alert p-[10px_14px] rounded-md border-2 border-[#1e1e24] font-bold text-[0.9rem] mb-4 bg-[#d1fae5] text-[#065f46]">
                {successMessage}
              </div>
            )}

            <div className="form-group flex flex-col gap-2 mb-4">
              <label className="font-bold text-[0.95rem]">Địa chỉ Email:</label>
              <input
                type="email"
                placeholder="example@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
                className="p-3 rounded-md border-3 border-[#1e1e24] font-semibold text-base shadow-[3px_3px_0_#1e1e24] outline-none transition-all duration-150 focus:translate-x-[-1px] focus:translate-y-[-1px] focus:shadow-[4px_4px_0_#1e1e24] focus:bg-[#fffdf5]"
                required
              />
            </div>

            <div className="form-group flex flex-col gap-2 mb-4">
              <label className="font-bold text-[0.95rem]">Mật khẩu:</label>
              <input
                type="password"
                placeholder="••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
                className="p-3 rounded-md border-3 border-[#1e1e24] font-semibold text-base shadow-[3px_3px_0_#1e1e24] outline-none transition-all duration-150 focus:translate-x-[-1px] focus:translate-y-[-1px] focus:shadow-[4px_4px_0_#1e1e24] focus:bg-[#fffdf5]"
                required
              />
            </div>

            <button
              type="submit"
              className={`btn btn-primary w-full ${isSubmitting ? "btn-loading" : ""}`}
              disabled={isSubmitting}
            >
              {!isSubmitting && (
                <Icon name={isLoginMode ? "key" : "sparkles"} size={18} className="mr-2 inline" />
              )}
              <span>
                {isSubmitting
                  ? "Đang xử lý..."
                  : isLoginMode
                    ? "Đăng nhập ngay"
                    : "Đăng ký tài khoản"}
              </span>
            </button>
          </form>

          <div className="divider flex items-center text-center my-5 text-[#666666] font-bold before:flex-1 before:border-b-2 before:border-dashed before:border-[#1e1e24] after:flex-1 after:border-b-2 after:border-dashed after:border-[#1e1e24]">
            <span className="px-[10px]">Hoặc</span>
          </div>

          <button
            className={`btn btn-google w-full bg-white ${isSubmitting ? "btn-loading" : ""}`}
            onClick={handleGoogleLogin}
            disabled={isSubmitting}
          >
            <svg className="google-icon mr-2 inline" viewBox="0 0 24 24" width="20" height="20">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.69a5.74 5.74 0 0 1-2.48 3.77v3.08h3.99c2.34-2.15 3.69-5.32 3.69-8.7z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-3.99-3.08a7.12 7.12 0 0 1-3.97 1.13c-3.06 0-5.65-2.07-6.58-4.85H1.27v3.18A12 12 0 0 0 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.42 14.29a7.15 7.15 0 0 1 0-4.58V6.53H1.27a12 12 0 0 0 0 10.94l4.15-3.18z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42A11.92 11.92 0 0 0 12 0 12 12 0 0 0 1.27 6.53l4.15 3.18c.93-2.78 3.52-4.85 6.58-4.85z"
              />
            </svg>
            Đăng nhập bằng Google
          </button>
        </div>
      )}
    </div>
  );
}
