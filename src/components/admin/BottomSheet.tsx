"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { X } from "lucide-react";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxHeight?: string;
}

export function BottomSheet({
  isOpen,
  onClose,
  title,
  children,
  maxHeight = "90vh",
}: BottomSheetProps) {
  const [translateY, setTranslateY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const touchStartY = useRef(0);
  const touchStartTime = useRef(0);
  const currentY = useRef(0);
  const sheetRef = useRef<HTMLDivElement>(null);
  const pushedHistoryRef = useRef(false);

  // Sync mobile back button using pushState and popstate
  useEffect(() => {
    if (!isOpen) {
      pushedHistoryRef.current = false;
      return;
    }

    // Only attach popstate on client
    if (typeof window !== "undefined") {
      try {
        window.history.pushState({ adminSheetOpen: true }, "");
        pushedHistoryRef.current = true;
      } catch {}

      const handlePopState = (e: PopStateEvent) => {
        onClose();
      };

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          e.preventDefault();
          onClose();
        }
      };

      window.addEventListener("popstate", handlePopState);
      window.addEventListener("keydown", handleKeyDown);

      return () => {
        window.removeEventListener("popstate", handlePopState);
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [isOpen, onClose]);

  // Touch Drag-to-Dismiss handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartY.current = touch.clientY;
    touchStartTime.current = Date.now();
    currentY.current = 0;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    const deltaY = touch.clientY - touchStartY.current;

    if (deltaY < 0) {
      // Rubber-banding when dragging upwards
      setTranslateY(deltaY * 0.2);
    } else {
      // Direct drag downwards
      setTranslateY(deltaY);
    }
    currentY.current = deltaY;
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    const deltaY = currentY.current;
    const deltaTime = Date.now() - touchStartTime.current;
    const velocity = deltaY / Math.max(1, deltaTime); // px/ms

    // Threshold: dragged down > 120px OR flick velocity > 0.5 px/ms
    if (deltaY > 120 || velocity > 0.5) {
      onClose();
      setTranslateY(0);
    } else {
      // Snap back to resting position
      setTranslateY(0);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title || "نافذة منبثقة"}
      className="surface-light fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-navy/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={sheetRef}
        style={{
          transform: translateY !== 0 ? `translateY(${translateY}px)` : undefined,
          transition: isDragging ? "none" : "transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
          maxHeight,
        }}
        className="squircle-card w-full sm:max-w-2xl bg-white border-t sm:border border-border-subtle rounded-t-card sm:rounded-card shadow-card-soft flex flex-col overflow-hidden text-start safe-pb animate-in slide-in-from-bottom sm:slide-in-from-bottom-4 duration-200"
      >
        {/* Mobile Drag Handle (Visible < 640px) */}
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="sm:hidden pt-3 pb-2 cursor-grab active:cursor-grabbing flex justify-center items-center select-none"
        >
          <div className="h-1.5 w-12 rounded-full bg-border opacity-70" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3 sm:px-6">
          <h2 className="text-base sm:text-lg font-bold text-navy truncate font-arabic">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق"
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-pill text-text-secondary hover:text-navy hover:bg-light-1 transition-colors"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {children}
        </div>
      </div>
    </div>
  );
}
