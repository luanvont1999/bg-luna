import React from "react";
import Icon from "./Icon";

interface Toast {
  id: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
}

interface Props {
  toasts: Toast[];
  onRemoveToast: (id: string) => void;
}

export default function ToastContainer({ toasts, onRemoveToast }: Props) {
  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div className={`cartoon-card toast-item ${toast.type}`} key={toast.id}>
          <span className="toast-message">{toast.message}</span>
          <button
            className="toast-close-btn"
            onClick={() => onRemoveToast(toast.id)}
          >
            <Icon name="x" size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
