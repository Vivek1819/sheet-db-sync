import React, { useState } from "react";

interface InputModalProps {
    isOpen: boolean;
    title: string;
    placeholder?: string;
    onClose: () => void;
    onSubmit: (value: string) => void;
}

export function InputModal({
    isOpen,
    title,
    placeholder,
    onClose,
    onSubmit,
}: InputModalProps) {
    const [value, setValue] = useState("");

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (value.trim()) {
            onSubmit(value);
            setValue("");
        }
    };

    return (
        <div className="modal-backdrop">
            <div className="modal-content glass-panel">
                <h3 className="modal-title">{title}</h3>
                <form onSubmit={handleSubmit}>
                    <input
                        autoFocus
                        type="text"
                        className="modal-input"
                        placeholder={placeholder}
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                    />
                    <div className="modal-actions">
                        <button type="button" onClick={onClose} className="btn-cancel">
                            CANCEL
                        </button>
                        <button type="submit" className="btn-submit">
                            CONFIRM
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
