import React from "react";
import Icon from "./Icon";

interface Props {
  show: boolean;
  onInstall: () => void;
  onClose: () => void;
}

export default function InstallPWABanner({ show, onInstall, onClose }: Props) {
  if (!show) return null;

  return (
    <div className="container" style={{ marginTop: "15px", marginBottom: "-10px" }}>
      <div className="cartoon-card install-banner">
        <div className="install-banner-content">
          <span className="install-banner-icon">
            <Icon name="smartphone" size={24} />
          </span>
          <div className="install-banner-text">
            <strong>Cài đặt Boardgame Luna!</strong>
            <span>Tải app về màn hình chính để nhận thông báo đẩy nhanh hơn.</span>
          </div>
        </div>
        <div className="install-banner-actions">
          <button className="btn btn-success install-banner-btn" onClick={onInstall}>
            Cài đặt
          </button>
          <button className="btn btn-secondary install-banner-close" onClick={onClose}>
            Lúc khác
          </button>
        </div>
      </div>
    </div>
  );
}
