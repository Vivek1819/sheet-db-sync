import React, { useEffect } from "react";
import type { ToastType } from "../context/ToastContext";

interface ToastProps {
    id: string;
    message: string;
    type: ToastType;
    onClose: () => void;
}

export function Toast({ message, type, onClose }: ToastProps) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 4000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className={`toast toast-${type}`}>
            <div className="toast-icon">
                {type === "success" && "✓"}
                {type === "error" && "✕"}
                {type === "info" && "ℹ"}
            </div>
            <div className="toast-message">{message}</div>
            <button onClick={onClose} className="toast-close">
                ×
            </button>
        </div>
    );
}
