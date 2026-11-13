"use client";

import React, { useState, useEffect, useRef, createContext, useContext, useCallback } from "react";
import { Undo2, X, Check } from "lucide-react";

interface UndoToastOptions {
  message: string;
  onUndo: () => void;
  onCommit?: () => void;
  durationMs?: number; // default 8000ms
}

interface ToastContextValue {
  showUndoToast: (options: UndoToastOptions) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useUndoToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useUndoToast must be used within an UndoToastProvider");
  }
  return ctx;
}

export function UndoToastProvider({ children }: { children: React.ReactNode }) {
  const [activeToast, setActiveToast] = useState<{
    id: number;
    message: string;
    onUndo: () => void;
    onCommit?: () => void;
    durationMs: number;
  } | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const dismissToast = useCallback((triggerCommit = true) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (triggerCommit && activeToast?.onCommit) {
      activeToast.onCommit();
    }
    setActiveToast(null);
  }, [activeToast]);

  const showUndoToast = useCallback((options: UndoToastOptions) => {
    // If a toast is already active, commit it before opening the next
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      if (activeToast?.onCommit) {
        activeToast.onCommit();
      }
    }

    const duration = options.durationMs || 8000;
    const toastId = Date.now();

    setActiveToast({
      id: toastId,
      message: options.message,
      onUndo: options.onUndo,
      onCommit: options.onCommit,
      durationMs: duration,
    });

    timerRef.current = setTimeout(() => {
      if (options.onCommit) {
        options.onCommit();
      }
      setActiveToast(null);
      timerRef.current = null;
    }, duration);
  }, [activeToast]);

  const handleUndo = () => {
    if (activeToast) {
      activeToast.onUndo();
    }
    dismissToast(false);
  };

  return (
    <ToastContext.Provider value={{ showUndoToast }}>
      {children}

      {/* Floating Undo Toast Banner */}
      {activeToast && (
        <aside
          role="status"
          aria-live="polite"
          aria-atomic="true"
          aria-label="إشعار التراجع عن العملية"
          className="surface-light squircle-card fixed bottom-4 inset-x-4 sm:inset-x-auto sm:end-6 sm:bottom-6 z-50 flex max-w-md flex-col overflow-hidden rounded-card border border-border-subtle bg-white shadow-card-soft safe-mb animate-in slide-in-from-bottom duration-200"
        >
          <div className="flex items-center justify-between gap-3 p-4 text-start">
            <div className="flex items-center gap-3 min-w-0">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-success-surface text-success shrink-0">
                <Check className="h-4 w-4" aria-hidden="true" />
              </span>
              <p className="text-sm font-bold text-navy truncate font-arabic">
                {activeToast.message}
              </p>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {/* Undo Button */}
              <button
                type="button"
                onClick={handleUndo}
                className="squircle-pill btn-rose-cta inline-flex min-h-[44px] items-center gap-1.5 rounded-pill px-3.5 py-2 text-xs font-bold text-navy active:scale-95"
              >
                <Undo2 className="h-3.5 w-3.5 icon-mirror" aria-hidden="true" />
                <span>تراجع (8 ث)</span>
              </button>

              {/* Dismiss Button */}
              <button
                type="button"
                onClick={() => dismissToast(true)}
                aria-label="إغلاق الإشعار"
                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-pill text-text-secondary hover:bg-light-1 hover:text-navy"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* 8-second visual progress bar */}
          <div className="h-1.5 w-full bg-light-1 overflow-hidden">
            <div
              className="h-full bg-rose-dark origin-right"
              style={{
                animation: `shrinkWidth ${activeToast.durationMs}ms linear forwards`,
              }}
            />
          </div>
        </aside>
      )}

      <style jsx global>{`
        @keyframes shrinkWidth {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </ToastContext.Provider>
  );
}
