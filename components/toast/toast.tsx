"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { type Toast } from "@/contexts/toast-context";

interface ToastProps {
  toast: Toast;
}

const toastStyles = {
  success: {
    container: "bg-green-50 border-green-200",
    icon: "text-green-600",
    title: "text-green-800",
    message: "text-green-700",
    close: "text-green-400 hover:text-green-600",
  },
  error: {
    container: "bg-red-50 border-red-200",
    icon: "text-red-600",
    title: "text-red-800",
    message: "text-red-700",
    close: "text-red-400 hover:text-red-600",
  },
  info: {
    container: "bg-blue-50 border-blue-200",
    icon: "text-blue-600",
    title: "text-blue-800",
    message: "text-blue-700",
    close: "text-blue-400 hover:text-blue-600",
  },
};

const icons = {
  success: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M5 13l4 4L19 7"
    />
  ),
  error: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  ),
  info: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  ),
};

export function Toast({ toast }: ToastProps) {
  const { removeToast } = useToast();
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const styles = toastStyles[toast.type];

  useEffect(() => {
    // Trigger enter animation
    setIsVisible(true);
  }, []);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      removeToast(toast.id);
    }, 300); // Match animation duration
  };

  return (
    <div
      className={`
        flex items-start gap-3 rounded-lg border p-4 shadow-sm transition-all duration-300 ease-in-out
        ${styles.container}
        ${
          isVisible && !isExiting
            ? "translate-x-0 scale-100 opacity-100"
            : "translate-x-full scale-95 opacity-0"
        }
      `}
    >
      <div className="mt-0.5 size-5 shrink-0">
        <svg
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          className={`size-5 ${styles.icon}`}
        >
          {icons[toast.type]}
        </svg>
      </div>
      <div className="min-w-0 flex-1">
        <h4 className={`font-inter text-sm font-semibold ${styles.title}`}>
          {toast.title}
        </h4>
        <p className={`mt-1 text-sm ${styles.message}`}>{toast.message}</p>
      </div>
      <button
        onClick={handleClose}
        className={`ml-4 shrink-0 transition-colors ${styles.close}`}
      >
        <svg
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          className="size-4"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
}
