"use client";

import React, { useState, useTransition, useMemo } from "react";
import {
  Plus,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  GripVertical,
  Save,
  Loader2,
  Check,
  AlertCircle,
  AlertTriangle,
  CheckSquare,
  FileText,
  Upload,
  X,
  Layers,
} from "lucide-react";
import { Procedure, ChecklistStep } from "@/types/database";
import { updateChecklistBatch } from "@/app/admin/actions/checklist";
import {
  parseChecklistImport,
  ParseChecklistResult,
} from "@/lib/import/checklist";
import { AR_STRINGS } from "@/messages/ar";

interface ChecklistTabProps {
  procedure: Procedure;
  onDirtyChange?: (isDirty: boolean) => void;
}

export function ChecklistTab({ procedure, onDirtyChange }: ChecklistTabProps) {
  const [steps, setSteps] = useState<ChecklistStep[]>(
    procedure.checklist_steps || []
  );
  const [dirty, setDirty] = useState(false);
  const [isSaving, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<number, string>>({});

  // Bulk Import Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [importResult, setImportResult] = useState<ParseChecklistResult | null>(null);
  const [importMode, setImportMode] = useState<"append" | "replace">("append");
  const [replaceConfirmInput, setReplaceConfirmInput] = useState("");

  const markDirty = (newSteps: ChecklistStep[]) => {
    setSteps(newSteps);
    setDirty(true);
    onDirtyChange?.(true);
    setFeedback(null);
  };

  // Distinct existing phases for datalist autocomplete
  const existingPhases = useMemo(() => {
    const set = new Set<string>();
    steps.forEach((s) => {
      if (s.phase && s.phase.trim()) {
        set.add(s.phase.trim());
      }
    });
    return Array.from(set);
  }, [steps]);

  const criticalCount = useMemo(() => {
    return steps.filter((s) => s.is_critical).length;
  }, [steps]);

  // Add Step at bottom
  const handleAddStep = () => {
    if (steps.length >= 200) return;
    const lastPhase = steps.length > 0 ? steps[steps.length - 1].phase : null;
    const newStep: ChecklistStep = {
      id: crypto.randomUUID(),
      procedure_id: procedure.id,
      sort_order: (steps.length + 1) * 10,
      text_en: "",
      text_ar: null,
      is_critical: false,
      phase: lastPhase,
    };
    markDirty([...steps, newStep]);
  };

  // Add Step directly after index
  const handleAddStepAfter = (index: number) => {
    if (steps.length >= 200) return;
    const currentPhase = steps[index]?.phase || null;
    const newStep: ChecklistStep = {
      id: crypto.randomUUID(),
      procedure_id: procedure.id,
      sort_order: (index + 2) * 10,
      text_en: "",
      text_ar: null,
      is_critical: false,
      phase: currentPhase,
    };
    const updated = [...steps];
    updated.splice(index + 1, 0, newStep);
    markDirty(updated);
  };

  // Duplicate Step
  const handleDuplicateStep = (index: number) => {
    if (steps.length >= 200) return;
    const source = steps[index];
    const duplicated: ChecklistStep = {
      id: crypto.randomUUID(),
      procedure_id: procedure.id,
      sort_order: (index + 2) * 10,
      text_en: source.text_en,
      text_ar: source.text_ar,
      is_critical: source.is_critical,
      phase: source.phase,
    };
    const updated = [...steps];
    updated.splice(index + 1, 0, duplicated);
    markDirty(updated);
  };

  // Delete Step
  const handleDeleteStep = (index: number) => {
    const updated = steps.filter((_, i) => i !== index);
    markDirty(updated);
  };

  // Move Step Up
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const updated = [...steps];
    const [moved] = updated.splice(index, 1);
    updated.splice(index - 1, 0, moved);
    markDirty(updated);
  };

  // Move Step Down
  const handleMoveDown = (index: number) => {
    if (index === steps.length - 1) return;
    const updated = [...steps];
    const [moved] = updated.splice(index, 1);
    updated.splice(index + 1, 0, moved);
    markDirty(updated);
  };

  // Field Updates
  const handleStepFieldChange = (
    index: number,
    field: keyof ChecklistStep,
    value: any
  ) => {
    const updated = [...steps];
    updated[index] = { ...updated[index], [field]: value };
    markDirty(updated);

    if (field === "text_en" && fieldErrors[index]) {
      const nextErrors = { ...fieldErrors };
      delete nextErrors[index];
      setFieldErrors(nextErrors);
    }
  };

  // Save Steps Batch
  const handleSave = () => {
    const errors: Record<number, string> = {};
    steps.forEach((step, idx) => {
      if (!step.text_en || step.text_en.trim() === "") {
        errors[idx] = "نص الخطوة بالإنجليزية مطلوب";
      }
    });

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setFeedback({
        type: "error",
        message: "يرجى كتابة نص الخطوة باللغة الإنجليزية لكافة الخطوات قبل الحفظ.",
      });
      return;
    }

    startTransition(async () => {
      const payload = steps.map((step, idx) => ({
        id: step.id,
        text_en: step.text_en.trim(),
        text_ar: step.text_ar && step.text_ar.trim() ? step.text_ar.trim() : null,
        is_critical: Boolean(step.is_critical),
        phase: step.phase && step.phase.trim() ? step.phase.trim() : null,
        sort_order: (idx + 1) * 10,
      }));

      const res = await updateChecklistBatch(procedure.id, payload);
      if (res.error) {
        setFeedback({ type: "error", message: res.error });
      } else {
        if (res.steps) {
          setSteps(res.steps);
        }
        setDirty(false);
        onDirtyChange?.(false);
        setFeedback({ type: "success", message: AR_STRINGS.saveSuccess });
      }
    });
  };

  // Run Bulk Import Preview
  const handleRunImportPreview = () => {
    const result = parseChecklistImport(importText);
    setImportResult(result);
  };

  // Confirm Bulk Import
  const handleConfirmImport = () => {
    if (!importResult || !importResult.valid || importResult.steps.length === 0) {
      return;
    }

    // If replace mode, verify title confirmation
    if (importMode === "replace") {
      if (replaceConfirmInput.trim().toLowerCase() !== procedure.title.trim().toLowerCase()) {
        alert("عنوان الإجراء المدخل غير متطابق مع عنوان الإجراء الحالي.");
        return;
      }
    }

    const importedSteps: ChecklistStep[] = importResult.steps.map((parsed, idx) => ({
      id: crypto.randomUUID(),
      procedure_id: procedure.id,
      sort_order: (idx + 1) * 10,
      text_en: parsed.text_en,
      text_ar: parsed.text_ar,
      is_critical: parsed.is_critical,
      phase: parsed.phase,
    }));

    let nextSteps: ChecklistStep[] = [];
    if (importMode === "replace") {
      nextSteps = importedSteps;
    } else {
      nextSteps = [...steps, ...importedSteps];
    }

    if (nextSteps.length > 200) {
      alert("العدد الإجمالي للخطوات بعد الاستيراد سيتجاوز 200 خطوة (الحد الأقصى).");
      return;
    }

    markDirty(nextSteps);
    setIsImportModalOpen(false);
    setImportText("");
    setImportResult(null);
    setReplaceConfirmInput("");
    setFeedback({
      type: "success",
      message: AR_STRINGS.bulkImportSuccess,
    });
  };

  return (
    <div className="space-y-5 text-start">
      {/* HTML Datalist for procedure phases */}
      <datalist id="procedure-phases">
        {existingPhases.map((phase) => (
          <option key={phase} value={phase} />
        ))}
      </datalist>

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
        {/* Header with Counters, Import and Add Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--color-border-subtle)] pb-4">
          <div>
            <h2 className="text-base font-bold text-[var(--color-text)] flex items-center gap-2">
              <CheckSquare className="h-4 w-4 text-[var(--color-primary)]" />
              <span>{AR_STRINGS.checklistTitle}</span>
            </h2>
            <div className="flex items-center gap-2.5 mt-1 text-xs text-[var(--color-text-muted)] font-arabic flex-wrap">
              <span>
                إجمالي الخطوات: <bdi className="font-mono font-semibold text-[var(--color-text)]">{steps.length}</bdi> / 200
              </span>
              <span>•</span>
              <span className="text-[var(--color-critical)] font-semibold">
                الخطوات الحرجة: <bdi className="font-mono">{criticalCount}</bdi>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Bulk Import Button */}
            <button
              type="button"
              onClick={() => setIsImportModalOpen(true)}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-3.5 py-2 text-xs font-semibold text-[var(--color-text)] transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
            >
              <Upload className="h-4 w-4" />
              <span>{AR_STRINGS.bulkImportButton}</span>
            </button>

            {/* Add Step Button */}
            <button
              type="button"
              onClick={handleAddStep}
              disabled={steps.length >= 200}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-md bg-[var(--color-primary)] px-3.5 py-2 text-xs font-semibold text-[var(--color-on-primary)] transition-transform active:scale-95 disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              <span>{AR_STRINGS.addStep}</span>
            </button>
          </div>
        </div>

        {/* Steps List */}
        {steps.length === 0 ? (
          <div className="py-8 text-center border-2 border-dashed border-[var(--color-border)] rounded-lg">
            <CheckSquare className="mx-auto h-8 w-8 text-[var(--color-text-muted)] opacity-60" />
            <p className="mt-2 text-sm text-[var(--color-text-muted)]">
              لم تتم إضافة خطوات سريرية بعد. اضغط &quot;إضافة خطوة&quot; أو استخدم &quot;استيراد مجمّع&quot;.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {steps.map((step, index) => {
              // Check if phase changes from previous step
              const prevPhase = index > 0 ? steps[index - 1].phase : null;
              const isNewPhaseGroup = step.phase && step.phase.trim() !== "" && step.phase !== prevPhase;

              return (
                <React.Fragment key={step.id || index}>
                  {/* Consecutive Phase Grouping Header Card */}
                  {isNewPhaseGroup && (
                    <div className="flex items-center gap-2 rounded-md bg-[var(--color-surface-raised)] px-3 py-2 border-r-4 border-[var(--color-primary)] text-xs font-bold text-[var(--color-primary)] shadow-sm">
                      <Layers className="h-4 w-4 shrink-0" />
                      <span>{step.phase}</span>
                    </div>
                  )}

                  <div
                    className={`group rounded-lg border p-3 sm:p-4 space-y-3 transition-colors ${
                      step.is_critical
                        ? "border-s-4 border-s-[var(--color-critical)] border-[var(--color-border)] bg-[var(--color-critical-surface)]/20"
                        : "border-[var(--color-border)] bg-[var(--color-surface-sunken)] hover:border-[var(--color-primary)]/40"
                    }`}
                  >
                    {/* Top Row: Index, Critical Switch, Phase input, Controls */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pb-2 border-b border-[var(--color-border-subtle)]">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Step Number */}
                        <span className="flex h-7 w-7 items-center justify-center rounded bg-[var(--color-surface)] border border-[var(--color-border-subtle)] text-xs font-mono font-semibold text-[var(--color-text-muted)]">
                          {index + 1}
                        </span>

                        {/* Critical Switch with Role and Visible State Text */}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            role="switch"
                            aria-checked={step.is_critical}
                            onClick={() =>
                              handleStepFieldChange(index, "is_critical", !step.is_critical)
                            }
                            className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-colors border ${
                              step.is_critical
                                ? "bg-[var(--color-critical)] text-[var(--color-on-critical)] border-[var(--color-critical)] shadow-sm"
                                : "bg-[var(--color-surface)] text-[var(--color-text-muted)] border-[var(--color-border)]"
                            }`}
                          >
                            <span
                              className={`h-2 w-2 rounded-full ${
                                step.is_critical ? "bg-black animate-pulse" : "bg-gray-400"
                              }`}
                            />
                            <span>{step.is_critical ? AR_STRINGS.stepCriticalTrue : AR_STRINGS.stepCriticalFalse}</span>
                          </button>
                        </div>

                        {/* Phase Input with Datalist */}
                        <div className="flex items-center gap-1.5 flex-1 sm:flex-initial">
                          <input
                            type="text"
                            list="procedure-phases"
                            maxLength={80}
                            value={step.phase || ""}
                            onChange={(e) =>
                              handleStepFieldChange(index, "phase", e.target.value.slice(0, 80))
                            }
                            placeholder="المرحلة (اختياري)..."
                            className="min-h-[36px] w-full sm:w-44 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 text-xs text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Action Controls: Add Next, Duplicate, Move Up, Move Down, Delete */}
                      <div className="flex items-center justify-end gap-1 shrink-0 pt-1 sm:pt-0">
                        {/* Add step directly after this one */}
                        <button
                          type="button"
                          onClick={() => handleAddStepAfter(index)}
                          title="إضافة خطوة تالية مباشرة"
                          aria-label={`إضافة خطوة بعد الخطوة ${index + 1}`}
                          className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]"
                        >
                          <Plus className="h-4 w-4" />
                        </button>

                        {/* Duplicate step */}
                        <button
                          type="button"
                          onClick={() => handleDuplicateStep(index)}
                          title="نسخ الخطوة"
                          aria-label={`نسخ الخطوة ${index + 1}`}
                          className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
                        >
                          <Copy className="h-4 w-4" />
                        </button>

                        {/* Move Up */}
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => handleMoveUp(index)}
                          title={AR_STRINGS.adminMoveUp}
                          aria-label={`${AR_STRINGS.adminMoveUp} للخطوة ${index + 1}`}
                          className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)] disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <ChevronUp className="h-4 w-4" />
                        </button>

                        {/* Move Down */}
                        <button
                          type="button"
                          disabled={index === steps.length - 1}
                          onClick={() => handleMoveDown(index)}
                          title={AR_STRINGS.adminMoveDown}
                          aria-label={`${AR_STRINGS.adminMoveDown} للخطوة ${index + 1}`}
                          className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)] disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <ChevronDown className="h-4 w-4" />
                        </button>

                        {/* Delete Step */}
                        <button
                          type="button"
                          onClick={() => handleDeleteStep(index)}
                          title={AR_STRINGS.deleteStep}
                          aria-label={`حذف الخطوة ${index + 1}`}
                          className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md border border-[var(--color-danger)]/30 bg-[var(--color-danger-surface)] text-[var(--color-danger)] hover:bg-[var(--color-danger)] hover:text-white transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Text Inputs: English (Required, LTR) & Arabic (Optional, RTL) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* English Textarea (Required) */}
                      <div>
                        <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
                          <bdi dir="ltr" lang="en">English Step Content</bdi>{" "}
                          <span className="text-[var(--color-danger)]">*</span>
                        </label>
                        <textarea
                          rows={2}
                          dir="ltr"
                          lang="en"
                          maxLength={500}
                          value={step.text_en}
                          onChange={(e) =>
                            handleStepFieldChange(index, "text_en", e.target.value.slice(0, 500))
                          }
                          placeholder="Clinical step instruction in English..."
                          className={`w-full rounded-md border bg-[var(--color-surface)] p-2.5 text-sm text-[var(--color-text)] focus:outline-none focus:ring-1 leading-snug ${
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

                      {/* Arabic Textarea (Optional) */}
                      <div>
                        <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1 font-arabic">
                          الترجمة العربية للخطوة (اختياري)
                        </label>
                        <textarea
                          rows={2}
                          dir="rtl"
                          lang="ar"
                          maxLength={500}
                          value={step.text_ar || ""}
                          onChange={(e) =>
                            handleStepFieldChange(index, "text_ar", e.target.value.slice(0, 500))
                          }
                          placeholder="الترجمة التوضيحية للخطوة باللغة العربية..."
                          className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-2.5 text-sm text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] leading-relaxed"
                        />
                      </div>
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        )}

        {/* Bottom Save Action Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[var(--color-border-subtle)]">
          <div className="text-xs text-[var(--color-text-muted)] font-arabic">
            {dirty && (
              <span className="text-[var(--color-critical)] font-semibold">
                ● يوجد تعديلات غير محفوظة في قائمة الخطوات
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

      {/* ======================================================================
          Bulk Import Modal / Dialog
         ====================================================================== */}
      {isImportModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="bulk-import-heading"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-5 overflow-y-auto animate-in fade-in"
        >
          <div className="w-full max-w-4xl rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:p-7 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] pb-3">
              <div>
                <h3
                  id="bulk-import-heading"
                  className="text-base font-bold text-[var(--color-text)] flex items-center gap-2"
                >
                  <Upload className="h-4 w-4 text-[var(--color-primary)]" />
                  <span>{AR_STRINGS.bulkImportTitle}</span>
                </h3>
                <p className="mt-1 text-xs text-[var(--color-text-muted)] font-arabic">
                  {AR_STRINGS.bulkImportDesc}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsImportModalOpen(false);
                  setImportResult(null);
                }}
                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                aria-label="إغلاق نافذة الاستيراد"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Import Textarea */}
            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1 font-arabic">
                الصق أسطر الخطوات هنا (بحد أقصى 200 سطر):
              </label>
              <textarea
                rows={6}
                value={importText}
                onChange={(e) => {
                  setImportText(e.target.value);
                  setImportResult(null);
                }}
                placeholder={`# Phase Name
English instruction step | الترجمة العربية
! Critical step instruction | خطوة حرجة
Another standard step`}
                className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface-sunken)] p-3 font-mono text-xs text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none"
              />
            </div>

            {/* Preview Button */}
            <div>
              <button
                type="button"
                onClick={handleRunImportPreview}
                disabled={!importText.trim()}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-md border border-[var(--color-primary)] bg-[var(--color-primary)]/10 px-4 py-2 text-xs font-semibold text-[var(--color-primary)] hover:bg-[var(--color-primary)]/20 transition-colors disabled:opacity-40"
              >
                <FileText className="h-4 w-4" />
                <span>{AR_STRINGS.bulkImportPreviewButton}</span>
              </button>
            </div>

            {/* Preview Results Table, Errors, and Warnings */}
            {importResult && (
              <div className="space-y-4 pt-3 border-t border-[var(--color-border-subtle)]">
                {/* Errors List */}
                {importResult.errors.length > 0 && (
                  <div
                    role="alert"
                    className="rounded-lg border border-[var(--color-danger)]/40 bg-[var(--color-danger-surface)] p-3 text-xs text-[var(--color-danger)] space-y-1.5"
                  >
                    <div className="font-bold flex items-center gap-1.5">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{AR_STRINGS.bulkImportErrorsFound}</span>
                    </div>
                    <ul className="list-disc list-inside space-y-0.5 ps-1">
                      {importResult.errors.map((err, i) => (
                        <li key={i}>
                          <span className="font-bold">السطر {err.line}:</span> {err.message}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Warnings List */}
                {importResult.warnings.length > 0 && (
                  <div className="rounded-lg border border-[var(--color-critical)]/40 bg-[var(--color-critical-surface)] p-3 text-xs text-[var(--color-critical)] space-y-1.5">
                    <div className="font-bold flex items-center gap-1.5">
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                      <span>تحذيرات (غير مانعة للاستيراد):</span>
                    </div>
                    <ul className="list-disc list-inside space-y-0.5 ps-1">
                      {importResult.warnings.map((warn, i) => (
                        <li key={i}>
                          <span className="font-bold">السطر {warn.line}:</span> {warn.message}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Preview Table */}
                {importResult.steps.length > 0 && (
                  <div className="overflow-x-auto rounded-lg border border-[var(--color-border)]">
                    <table className="w-full text-xs text-start">
                      <thead className="bg-[var(--color-surface-sunken)] border-b border-[var(--color-border)] text-[var(--color-text-secondary)]">
                        <tr>
                          <th className="p-2 text-start">#</th>
                          <th className="p-2 text-start">المرحلة</th>
                          <th className="p-2 text-start">الحالة</th>
                          <th className="p-2 text-start">النص بالإنجليزية</th>
                          <th className="p-2 text-start">الترجمة العربية</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--color-border-subtle)]">
                        {importResult.steps.map((st, i) => (
                          <tr key={i} className="hover:bg-[var(--color-surface-raised)]/30">
                            <td className="p-2 font-mono text-[var(--color-text-muted)]">{st.lineNumber}</td>
                            <td className="p-2 font-semibold text-[var(--color-primary)]">
                              {st.phase || <span className="text-[var(--color-text-muted)]">-</span>}
                            </td>
                            <td className="p-2">
                              {st.is_critical ? (
                                <span className="inline-block rounded bg-[var(--color-critical)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--color-on-critical)]">
                                  حرجة
                                </span>
                              ) : (
                                <span className="text-[var(--color-text-muted)] text-[10px]">عادية</span>
                              )}
                            </td>
                            <td className="p-2 font-mono text-[var(--color-text)]" dir="ltr">
                              {st.text_en}
                            </td>
                            <td className="p-2 text-[var(--color-text-secondary)] font-arabic" dir="rtl">
                              {st.text_ar || <span className="text-[var(--color-text-muted)]">-</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Mode Selector: Append vs Replace All */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-4 text-xs font-semibold">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="importMode"
                        value="append"
                        checked={importMode === "append"}
                        onChange={() => setImportMode("append")}
                        className="h-4 w-4 text-[var(--color-primary)]"
                      />
                      <span>{AR_STRINGS.bulkImportModeAppend}</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="importMode"
                        value="replace"
                        checked={importMode === "replace"}
                        onChange={() => setImportMode("replace")}
                        className="h-4 w-4 text-[var(--color-danger)]"
                      />
                      <span className="text-[var(--color-danger)]">{AR_STRINGS.bulkImportModeReplace}</span>
                    </label>
                  </div>

                  {/* If Replace All is chosen, require typing the procedure title */}
                  {importMode === "replace" && (
                    <div className="rounded-md border border-[var(--color-danger)]/30 bg-[var(--color-danger-surface)] p-3 text-xs space-y-2">
                      <p className="font-semibold text-[var(--color-danger)]">
                        {AR_STRINGS.bulkImportConfirmReplaceWarning}
                      </p>
                      <input
                        type="text"
                        value={replaceConfirmInput}
                        onChange={(e) => setReplaceConfirmInput(e.target.value)}
                        placeholder={procedure.title}
                        className="w-full min-h-[44px] rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text)]"
                      />
                    </div>
                  )}
                </div>

                {/* Confirm Action Button */}
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--color-border-subtle)]">
                  <button
                    type="button"
                    onClick={() => {
                      setIsImportModalOpen(false);
                      setImportResult(null);
                    }}
                    className="inline-flex min-h-[44px] items-center justify-center rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-xs font-semibold text-[var(--color-text)] hover:bg-[var(--color-surface-raised)]"
                  >
                    {AR_STRINGS.cancel}
                  </button>

                  <button
                    type="button"
                    onClick={handleConfirmImport}
                    disabled={
                      !importResult.valid ||
                      importResult.steps.length === 0 ||
                      (importMode === "replace" &&
                        replaceConfirmInput.trim().toLowerCase() !== procedure.title.trim().toLowerCase())
                    }
                    className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-md bg-[var(--color-primary)] px-6 py-2 text-xs font-semibold text-[var(--color-on-primary)] disabled:opacity-40 transition-transform active:scale-95"
                  >
                    <Check className="h-4 w-4" />
                    <span>{AR_STRINGS.bulkImportConfirmButton}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
