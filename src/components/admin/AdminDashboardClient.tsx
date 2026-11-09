"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { Edit3, Eye, Trash2, Save, Loader2, Check } from "lucide-react";
import { Procedure } from "@/types/database";
import { ReorderableList } from "@/components/admin/ReorderableList";
import { DeleteProcedureDialog } from "@/components/admin/DeleteProcedureDialog";
import { reorderProceduresBatch, deleteProcedure } from "@/app/admin/actions/procedures";
import { AR_STRINGS } from "@/messages/ar";

interface AdminDashboardClientProps {
  initialProcedures: Procedure[];
}

export function AdminDashboardClient({ initialProcedures }: AdminDashboardClientProps) {
  const [procedures, setProcedures] = useState<Procedure[]>(initialProcedures);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Delete Dialog state
  const [deletingProc, setDeletingProc] = useState<Procedure | null>(null);

  const handleReorder = (newItems: Procedure[]) => {
    // Recompute sort_order in intervals of 10
    const updated = newItems.map((item, index) => ({
      ...item,
      sort_order: (index + 1) * 10,
    }));
    setProcedures(updated);
    setIsDirty(true);
    setFeedback(null);
  };

  const handleSaveBatchOrder = () => {
    setFeedback(null);
    startTransition(async () => {
      const items = procedures.map((p) => ({
        id: p.id,
        sort_order: p.sort_order,
      }));
      const res = await reorderProceduresBatch(items);
      if (res.error) {
        setFeedback({ type: "error", message: res.error });
      } else {
        setIsDirty(false);
        setFeedback({ type: "success", message: AR_STRINGS.adminReorderSuccess });
      }
    });
  };

  const handleConfirmDelete = async () => {
    if (!deletingProc) return;
    const res = await deleteProcedure(deletingProc.id, deletingProc.title);
    if (res.error) {
      throw new Error(res.error);
    }
    setProcedures((prev) => prev.filter((p) => p.id !== deletingProc.id));
    setDeletingProc(null);
    setFeedback({ type: "success", message: "تم حذف الإجراء بنجاح." });
  };

  return (
    <div className="space-y-4">
      {/* Action / Status Row - Only rendered when feedback is active or reordering is dirty */}
      {(feedback || isDirty) && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div aria-live="polite">
            {feedback && (
              <div
                className={`inline-flex items-center gap-2 rounded-md px-3 py-1 text-xs font-semibold ${
                  feedback.type === "success"
                    ? "bg-[var(--color-primary)]/15 text-[var(--color-primary)]"
                    : "bg-[var(--color-danger-surface)] text-[var(--color-danger)]"
                }`}
              >
                {feedback.type === "success" && <Check className="h-3.5 w-3.5" />}
                <span>{feedback.message}</span>
              </div>
            )}
          </div>

          {/* Batch Save Order Button */}
          {isDirty && (
            <button
              type="button"
              onClick={handleSaveBatchOrder}
              disabled={isSaving}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-md bg-[var(--color-primary)] px-4 py-2 text-xs font-semibold text-[var(--color-on-primary)] shadow-sm transition-transform active:scale-95 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)]"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>جاري حفظ الترتيب...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>{AR_STRINGS.adminReorderBatchSave}</span>
                </>
              )}
            </button>
          )}
        </div>
      )}

      {procedures.length === 0 ? (
        <div className="rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-8 text-center">
          <p className="text-sm text-[var(--color-text-secondary)]">
            {AR_STRINGS.adminNoProcedures}
          </p>
          <Link
            href="/admin/procedures/new"
            className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-md bg-[var(--color-primary)] px-4 py-2 text-xs font-semibold text-[var(--color-on-primary)]"
          >
            {AR_STRINGS.adminAddProcedure}
          </Link>
        </div>
      ) : (
        <ReorderableList
          items={procedures}
          onReorder={handleReorder}
          renderItem={(proc, index) => {
            const dateStr = new Date(proc.updated_at).toLocaleDateString("ar-EG", {
              numberingSystem: "latn",
              month: "short",
              day: "numeric",
              year: "numeric",
            });

            return (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between py-1 text-start">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-semibold tabular-nums text-[var(--color-text-muted)] shrink-0">
                      #{index + 1}
                    </span>
                    <span
                      className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        proc.published
                          ? "bg-[var(--color-primary)]/20 text-[var(--color-primary)]"
                          : "bg-[var(--color-surface-sunken)] text-[var(--color-text-muted)] border border-[var(--color-border-subtle)]"
                      }`}
                    >
                      {proc.published ? AR_STRINGS.adminStatusPublished : AR_STRINGS.adminStatusDraft}
                    </span>
                    <h3
                      className="font-semibold text-sm sm:text-base text-[var(--color-text)] break-words !leading-[1.3]"
                      style={{ lineHeight: 1.3 }}
                    >
                      <bdi dir="ltr" lang="en">
                        {proc.title}
                      </bdi>
                    </h3>
                  </div>

                  <div className="flex flex-col gap-0.5 text-xs text-[var(--color-text-muted)]">
                    <bdi dir="ltr" lang="en" className="font-mono inline-block text-start">
                      {`/${proc.slug}`}
                    </bdi>
                    <span>{AR_STRINGS.adminUpdatedAt}: {dateStr}</span>
                  </div>
                </div>

                {/* Procedure Row Action Buttons */}
                <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                  {/* Draft Preview Link */}
                  <Link
                    href={`/admin/preview/${proc.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={AR_STRINGS.adminDraftPreview}
                    aria-label={`${AR_STRINGS.adminDraftPreview}: ${proc.title}`}
                    className="inline-flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-surface-sunken)] text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)]"
                  >
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  </Link>

                  {/* Edit Procedure Link */}
                  <Link
                    href={`/admin/procedures/${proc.id}`}
                    title="تعديل الإجراء"
                    aria-label={`تعديل: ${proc.title}`}
                    className="inline-flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-surface-sunken)] text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)]"
                  >
                    <Edit3 className="h-4 w-4" aria-hidden="true" />
                  </Link>

                  {/* Delete Procedure Button */}
                  <button
                    type="button"
                    onClick={() => setDeletingProc(proc)}
                    title={AR_STRINGS.deleteProcedure}
                    aria-label={`${AR_STRINGS.deleteProcedure}: ${proc.title}`}
                    className="inline-flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-md border border-[var(--color-danger)]/20 bg-[var(--color-danger-surface)] text-[var(--color-danger)] transition-colors hover:bg-[var(--color-danger)] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)]"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            );
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingProc && (
        <DeleteProcedureDialog
          isOpen={true}
          procedureTitle={deletingProc.title}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeletingProc(null)}
        />
      )}
    </div>
  );
}
