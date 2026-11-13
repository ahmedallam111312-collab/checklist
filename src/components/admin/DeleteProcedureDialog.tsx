"use client";

import React, { useState, useEffect } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { AR_STRINGS } from "@/messages/ar";

interface DeleteProcedureDialogProps {
  isOpen: boolean;
  procedureTitle: string;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

export function DeleteProcedureDialog({
  isOpen,
  procedureTitle,
  onConfirm,
  onCancel,
}: DeleteProcedureDialogProps) {
  const [typedTitle, setTypedTitle] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Keyboard accessibility: Escape key closes delete confirmation dialog
  // Mobile popstate / back button handling
  useEffect(() => {
    if (!isOpen) return;

    if (typeof window !== "undefined") {
      try {
        window.history.pushState({ deleteDialogOpen: true }, "");
      } catch {}

      const handlePopState = () => {
        onCancel();
      };
      window.addEventListener("popstate", handlePopState);
      return () => window.removeEventListener("popstate", handlePopState);
    }
  }, [isOpen, onCancel]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const isMatch = typedTitle.trim().toLowerCase() === procedureTitle.trim().toLowerCase();

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isMatch || isDeleting) return;

    setError(null);
    setIsDeleting(true);
    try {
      await onConfirm();
    } catch (err: any) {
      setError(err.message || "فشل حذف الإجراء.");
      setIsDeleting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-dialog-title"
      className="surface-light fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-navy/65 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="squircle-card w-full sm:max-w-md rounded-t-card sm:rounded-card border border-danger/40 bg-white p-6 shadow-card-soft text-start safe-pb animate-in slide-in-from-bottom sm:slide-in-from-bottom-4 duration-200">
        {/* Mobile Drag Indicator */}
        <div className="sm:hidden -mt-2 mb-3 flex justify-center items-center select-none">
          <div className="h-1.5 w-12 rounded-full bg-border opacity-80" />
        </div>
        <div className="flex items-center gap-3 text-danger">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-danger-surface">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <h2 id="delete-dialog-title" className="text-lg font-bold text-navy">
            {AR_STRINGS.deleteConfirmTitle}
          </h2>
        </div>

        <p className="mt-4 text-sm text-text-secondary leading-relaxed">
          {AR_STRINGS.deleteConfirmWarning}
        </p>

        <div className="mt-3 rounded-lg bg-light-1 p-3 border border-border-subtle select-all font-mono text-sm font-semibold text-navy text-left" dir="ltr">
          {procedureTitle}
        </div>

        <form onSubmit={handleDelete} className="mt-4 space-y-4">
          <div>
            <label
              htmlFor="confirm-title-input"
              className="block text-xs font-semibold text-text-secondary mb-1.5"
            >
              {AR_STRINGS.deleteConfirmPlaceholder}
            </label>
            <input
              id="confirm-title-input"
              type="text"
              autoFocus
              dir="ltr"
              lang="en"
              value={typedTitle}
              onChange={(e) => setTypedTitle(e.target.value)}
              placeholder={procedureTitle}
              className="squircle-pill w-full min-h-[44px] rounded-pill border border-border bg-search-bg px-3.5 text-sm font-mono text-navy focus:border-danger focus:outline-none focus:ring-2 focus:ring-danger/25"
            />
          </div>

          {error && (
            <p className="text-xs text-danger font-medium" role="alert">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={isDeleting}
              className="squircle-pill inline-flex min-h-[44px] min-w-[80px] items-center justify-center rounded-pill border border-border bg-white px-4 py-2 text-sm font-bold text-navy transition-colors hover:border-rose-dark hover:text-rose-dark"
            >
              {AR_STRINGS.cancel}
            </button>

            <button
              type="submit"
              disabled={!isMatch || isDeleting}
              className="squircle-pill inline-flex min-h-[44px] items-center justify-center gap-2 rounded-pill bg-danger px-5 py-2 text-sm font-bold text-white transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>جاري الحذف...</span>
                </>
              ) : (
                <span>{AR_STRINGS.deleteConfirmButton}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
