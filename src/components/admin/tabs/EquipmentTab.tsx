"use client";

import React, { useState, useTransition } from "react";
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  GripVertical,
  Save,
  Loader2,
  Check,
  AlertCircle,
  Wrench,
  Camera,
} from "lucide-react";
import { Procedure, EquipmentItem } from "@/types/database";
import { updateEquipmentBatch } from "@/app/admin/actions/equipment";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { AR_STRINGS } from "@/messages/ar";

interface EquipmentTabProps {
  procedure: Procedure;
  onDirtyChange?: (isDirty: boolean) => void;
}

export function EquipmentTab({ procedure, onDirtyChange }: EquipmentTabProps) {
  const [items, setItems] = useState<EquipmentItem[]>(
    (procedure.equipment_items || []).map((it) => ({
      ...it,
      photo_path: it.photo_path || it.image_path || null,
      image_path: it.image_path || it.photo_path || null,
    }))
  );
  const [dirty, setDirty] = useState(false);
  const [isSaving, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<number, string>>({});
  const [activePhotoUploaderIndex, setActivePhotoUploaderIndex] = useState<number | null>(null);

  const markDirty = (newItems: EquipmentItem[]) => {
    setItems(newItems);
    setDirty(true);
    onDirtyChange?.(true);
    setFeedback(null);
  };

  const handleAddItem = () => {
    if (items.length >= 100) return;
    const newItem: EquipmentItem = {
      id: crypto.randomUUID(),
      procedure_id: procedure.id,
      name: "",
      photo_path: null,
      sort_order: (items.length + 1) * 10,
    };
    markDirty([...items, newItem]);
  };

  const handleNameChange = (index: number, name: string) => {
    const updated = [...items];
    updated[index] = { ...updated[index], name: name.slice(0, 120) };
    markDirty(updated);

    if (fieldErrors[index]) {
      const nextErrors = { ...fieldErrors };
      delete nextErrors[index];
      setFieldErrors(nextErrors);
    }
  };

  const handlePhotoChanged = (index: number, photoPath: string | null) => {
    const updated = [...items];
    updated[index] = { ...updated[index], photo_path: photoPath };
    markDirty(updated);
  };

  const handleDeleteItem = (index: number) => {
    const updated = items.filter((_, i) => i !== index);
    markDirty(updated);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const updated = [...items];
    const [moved] = updated.splice(index, 1);
    updated.splice(index - 1, 0, moved);
    markDirty(updated);
  };

  const handleMoveDown = (index: number) => {
    if (index === items.length - 1) return;
    const updated = [...items];
    const [moved] = updated.splice(index, 1);
    updated.splice(index + 1, 0, moved);
    markDirty(updated);
  };

  const handleSave = () => {
    // Validate empty names
    const errors: Record<number, string> = {};
    items.forEach((item, idx) => {
      if (!item.name || item.name.trim() === "") {
        errors[idx] = "اسم الأداة مطلوب";
      }
    });

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setFeedback({ type: "error", message: "يرجى ملء أسماء كافة الأدوات قبل الحفظ." });
      return;
    }

    startTransition(async () => {
      const payload = items.map((item, idx) => ({
        id: item.id,
        name: item.name.trim(),
        photo_path: item.photo_path || null,
        sort_order: (idx + 1) * 10,
      }));

      const res = await updateEquipmentBatch(procedure.id, payload);
      if (res.error) {
        setFeedback({ type: "error", message: res.error });
      } else {
        if (res.items) {
          setItems(res.items);
        }
        setDirty(false);
        onDirtyChange?.(false);
        setFeedback({ type: "success", message: AR_STRINGS.saveSuccess });
      }
    });
  };

  return (
    <div className="space-y-5 text-start">
      {/* Live Feedback Region */}
      <div aria-live="polite">
        {feedback && (
          <div
            className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-xs font-semibold text-start mb-2 animate-in fade-in ${
              feedback.type === "success"
                ? "bg-[var(--color-primary)]/15 text-[var(--color-primary)]"
                : "bg-[var(--color-danger-surface)] text-[var(--color-danger)]"
            }`}
          >
            {feedback.type === "success" ? (
              <Check className="h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-4 sm:p-6 space-y-4 shadow-sm">
        {/* Header with Counter and Add Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--color-border-subtle)] pb-4">
          <div>
            <h2 className="text-base font-bold text-[var(--color-text)] flex items-center gap-2">
              <Wrench className="h-4 w-4 text-[var(--color-primary)]" />
              <span>{AR_STRINGS.equipmentTitle}</span>
            </h2>
            <p className="mt-1 text-xs text-[var(--color-text-muted)] font-arabic">
              الأدوات والتجهيزات الطبية المطلوبة لتنفيذ الإجراء (الحد الأقصى: 100 أداة).
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-[var(--color-text-muted)] font-mono">
              <bdi dir="ltr">{items.length} / 100</bdi>
            </span>

            <button
              type="button"
              onClick={handleAddItem}
              disabled={items.length >= 100}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-3.5 py-2 text-xs font-semibold text-[var(--color-text)] transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              <span>{AR_STRINGS.addEquipmentItem}</span>
            </button>
          </div>
        </div>

        {/* Items List */}
        {items.length === 0 ? (
          <div className="py-8 text-center border-2 border-dashed border-[var(--color-border)] rounded-lg">
            <Wrench className="mx-auto h-8 w-8 text-[var(--color-text-muted)] opacity-60" />
            <p className="mt-2 text-sm text-[var(--color-text-muted)]">
              لم تتم إضافة أي أدوات بعد. اضغط على &quot;إضافة أداة جديدة&quot; للبدء.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item, index) => (
              <div
                key={item.id || index}
                className="group rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-sunken)] p-3 sm:p-4 space-y-3 transition-colors hover:border-[var(--color-primary)]/40"
              >
                {/* Mobile & Desktop: Full-width layout with controls below or inline */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                  {/* Row index badge & Drag Handle */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="flex h-7 w-7 items-center justify-center rounded bg-[var(--color-surface)] border border-[var(--color-border-subtle)] text-xs font-mono font-semibold text-[var(--color-text-muted)]">
                      {index + 1}
                    </span>
                    <GripVertical className="h-4 w-4 text-[var(--color-text-muted)] opacity-40 group-hover:opacity-100 hidden sm:block" />
                  </div>

                  {/* Name Input (English LTR) — Auto-growing textarea for long names at 320px (T9b) */}
                  <div className="flex-1 min-w-0">
                    <textarea
                      dir="ltr"
                      lang="en"
                      rows={1}
                      maxLength={120}
                      value={item.name}
                      onChange={(e) => {
                        handleNameChange(index, e.target.value);
                        e.target.style.height = "auto";
                        e.target.style.height = `${e.target.scrollHeight}px`;
                      }}
                      onFocus={(e) => {
                        e.target.style.height = "auto";
                        e.target.style.height = `${e.target.scrollHeight}px`;
                      }}
                      placeholder="Equipment name (e.g., 20G Arterial Line Catheter)..."
                      className={`w-full min-h-[44px] rounded-md border bg-[var(--color-surface)] px-3 py-2.5 text-sm text-[var(--color-text)] focus:outline-none focus:ring-1 resize-none leading-snug overflow-hidden ${
                        fieldErrors[index]
                          ? "border-[var(--color-danger)] focus:ring-[var(--color-danger)]"
                          : "border-[var(--color-border)] focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                      }`}
                    />
                    {fieldErrors[index] && (
                      <p className="mt-1 text-xs text-[var(--color-danger)]">
                        {fieldErrors[index]}
                      </p>
                    )}
                  </div>

                  {/* Controls Row (under field on mobile, aligned on desktop) */}
                  <div className="flex items-center justify-between sm:justify-end gap-1.5 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-[var(--color-border-subtle)]">
                    {/* Toggle photo uploader button: icon plus short label, min 44px (T9c) */}
                    <button
                      type="button"
                      onClick={() =>
                        setActivePhotoUploaderIndex(
                          activePhotoUploaderIndex === index ? null : index
                        )
                      }
                      title="صورة توضيحية للأداة"
                      aria-label={`صورة توضيحية للأداة ${index + 1}`}
                      className={`inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md border text-xs font-semibold transition-colors px-2.5 gap-1.5 ${
                        item.photo_path
                          ? "border-[var(--color-primary)]/50 bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                          : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                      }`}
                    >
                      <Camera className="h-4 w-4 shrink-0" />
                      <span className="text-xs font-arabic">
                        {item.photo_path ? "تعديل صورة" : "صورة"}
                      </span>
                    </button>

                    {/* Move Up */}
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => handleMoveUp(index)}
                      title={AR_STRINGS.adminMoveUp}
                      aria-label={`${AR_STRINGS.adminMoveUp} للأداة ${index + 1}`}
                      className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)] disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>

                    {/* Move Down */}
                    <button
                      type="button"
                      disabled={index === items.length - 1}
                      onClick={() => handleMoveDown(index)}
                      title={AR_STRINGS.adminMoveDown}
                      aria-label={`${AR_STRINGS.adminMoveDown} للأداة ${index + 1}`}
                      className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)] disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>

                    {/* Delete Item */}
                    <button
                      type="button"
                      onClick={() => handleDeleteItem(index)}
                      title={AR_STRINGS.removeItem}
                      aria-label={`حذف الأداة ${index + 1}`}
                      className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md border border-[var(--color-danger)]/30 bg-[var(--color-danger-surface)] text-[var(--color-danger)] hover:bg-[var(--color-danger)] hover:text-white transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Collapsible Photo Uploader for Item */}
                {activePhotoUploaderIndex === index && (
                  <div className="pt-2 border-t border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-3 rounded-md">
                    <p className="text-xs font-semibold text-[var(--color-text)] mb-2 font-arabic">
                      صورة توضيحية للأداة (مخزنة في مسار: equipment/{procedure.id}/...)
                    </p>
                    <ImageUploader
                      folder={`equipment/${procedure.id}`}
                      currentPath={item.photo_path}
                      label={`صورة ${item.name || "الأداة"}`}
                      onImageChanged={(newPath) => handlePhotoChanged(index, newPath)}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Bottom Save Action Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[var(--color-border-subtle)]">
          <div className="text-xs text-[var(--color-text-muted)] font-arabic">
            {dirty && (
              <span className="text-[var(--color-critical)] font-semibold">
                ● يوجد تعديلات غير محفوظة في قائمة الأدوات
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !dirty}
            className="w-full sm:w-auto inline-flex min-h-[44px] items-center justify-center gap-2 rounded-md bg-[var(--color-primary)] px-6 py-2.5 text-sm font-semibold text-[var(--color-on-primary)] transition-transform active:scale-95 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)]"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{AR_STRINGS.saving}</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>{AR_STRINGS.saveChanges}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
