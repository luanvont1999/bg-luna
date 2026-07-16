import React from "react";
import Icon from "./Icon";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function IOSInstallModal({ isOpen, onClose }: Props) {
  if (!isOpen) return null;

  return (
    <div className="ios-modal-backdrop">
      <div className="cartoon-card ios-instructions-modal">
        <div className="flex justify-between items-center border-b-3 border-[#1e1e24] pb-3 mb-[15px]">
          <h3 className="m-0 text-[1.2rem] font-extrabold text-[#1e1e24] flex items-center gap-2">
            <Icon name="smartphone" size={20} /> Cài đặt trên iPhone/iPad
          </h3>
          <button
            style={{ background: "none", border: "none", cursor: "pointer", color: "#1e1e24", padding: "4px" }}
            onClick={onClose}
          >
            <Icon name="x" size={20} />
          </button>
        </div>
        <p className="text-[0.95rem] leading-relaxed color-[#1e1e24] mb-[15px] text-left">
          Trình duyệt Safari trên iOS không hỗ trợ tự động cài đặt. Hãy làm theo 3 bước đơn giản:
        </p>
        <ol className="text-[0.9rem] leading-relaxed color-[#1e1e24] pl-5 mb-5 text-left list-decimal">
          <li className="mb-2">Nhấn vào biểu tượng <strong>Chia sẻ (Share)</strong> trên Safari.</li>
          <li className="mb-2">Cuộn xuống và chọn <strong>Thêm vào MH chính (Add to Home Screen)</strong>.</li>
          <li>Bấm <strong>Thêm (Add)</strong> ở góc trên bên phải để hoàn tất!</li>
        </ol>
        <button
          className="btn btn-primary w-full py-2.5 flex items-center justify-center gap-1.5"
          onClick={onClose}
        >
          <Icon name="check" size={18} />
          <span>Đã hiểu</span>
        </button>
      </div>
    </div>
  );
}
