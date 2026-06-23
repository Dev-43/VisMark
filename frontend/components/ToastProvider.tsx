"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { CheckCircle, XCircle, Info } from "lucide-react";

export type ToastType = "success" | "error" | "info";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  isExiting?: boolean;
}

interface ToastContextType {
  showToast: (message: string, type: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isExiting: true } : t))
    );
    // Remove the toast from DOM after exit animation finishes (300ms)
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 300);
  }, []);

  const showToast = useCallback((message: string, type: ToastType) => {
    const id = Math.random().toString(36).substring(2, 9);

    setToasts((prev) => {
      const activeToasts = prev.filter((t) => !t.isExiting);
      let next = [...prev];

      // Keep only up to 3 active toasts (oldest auto-dismiss first)
      if (activeToasts.length >= 3) {
        const oldestActive = activeToasts[0];
        // Set oldest active to exiting
        next = next.map((t) =>
          t.id === oldestActive.id ? { ...t, isExiting: true } : t
        );
        // Queue its removal
        setTimeout(() => {
          setToasts((p) => p.filter((t) => t.id !== oldestActive.id));
        }, 300);
      }

      return [...next, { id, message, type }];
    });

    // Auto dismiss after 3000ms
    setTimeout(() => {
      dismissToast(id);
    }, 3000);
  }, [dismissToast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="toast-container">
        {toasts.map((toast) => {
          let IconComponent = Info;
          let iconColor = "var(--accent)";

          if (toast.type === "success") {
            IconComponent = CheckCircle;
            iconColor = "var(--success)";
          } else if (toast.type === "error") {
            IconComponent = XCircle;
            iconColor = "var(--error)";
          }

          return (
            <div
              key={toast.id}
              className={`toast-item toast-${toast.type} ${toast.isExiting ? "toast-exit" : ""}`}
            >
              <IconComponent size={18} style={{ color: iconColor, flexShrink: 0 }} />
              <span
                style={{
                  lineHeight: 1.4,
                  wordBreak: "break-word",
                }}
              >
                {toast.message}
              </span>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
