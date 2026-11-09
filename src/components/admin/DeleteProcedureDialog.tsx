"use client";

import React, { useState } from "react";
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150"
    >
      <div className="w-full max-w-md rounded-xl border border-[var(--color-danger)]/40 bg-[var(--color-surface)] p-6 shadow-2xl text-start">
        <div className="flex items-center gap-3 text-[var(--color-danger)]">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-danger-surface)]">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <h2 id="delete-dialog-title" className="text-lg font-bold text-[var(--color-text)]">
            {AR_STRINGS.deleteConfirmTitle}
          </h2>
        </div>

        <p className="mt-4 text-sm text-[var(--color-text-secondary)] leading-relaxed">
          {AR_STRINGS.deleteConfirmWarning}
        </p>

        <div className="mt-3 rounded-md bg-[var(--color-surface-sunken)] p-3 border border-[var(--color-border)] select-all font-mono text-sm font-semibold text-[var(--color-text)] text-left" dir="ltr">
          {procedureTitle}
        </div>

        <form onSubmit={handleDelete} className="mt-4 space-y-4">
          <div>
            <label
              htmlFor="confirm-title-input"
              className="block text-xs font-semibold text-[var(--color-text-muted)] mb-1"
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
              className="w-full min-h-[44px] rounded-md border border-[var(--color-border)] bg-[var(--color-surface-sunken)] px-3 text-sm font-mono text-[var(--color-text)] focus:border-[var(--color-danger)] focus:outline-none focus:ring-1 focus:ring-[var(--color-danger)]"
            />
          </div>

          {error && (
            <p className="text-xs text-[var(--color-danger)] font-medium" role="alert">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={isDeleting}
              className="inline-flex min-h-[44px] min-w-[80px] items-center justify-center rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm font-semibold text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)]"
            >
              {AR_STRINGS.cancel}
            </button>

            <button
              type="submit"
              disabled={!isMatch || isDeleting}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-md bg-[var(--color-danger)] px-5 py-2 text-sm font-semibold text-white transition-opacity disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)]"
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
