"use client";

import React, { useState, useTransition, useMemo, useEffect } from "react";
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
  Flag,
} from "lucide-react";
import { Procedure, ChecklistStep } from "@/types/database";
import { updateChecklistBatch } from "@/app/admin/actions/checklist";
import {
  parseChecklistImport,
  ParseChecklistResult,
} from "@/lib/import/checklist";
import { AR_STRINGS } from "@/messages/ar";
import { useUndoToast } from "@/components/admin/UndoToast";
import { BottomSheet } from "@/components/admin/BottomSheet";

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
  const [isMac, setIsMac] = useState(false);
  const { showUndoToast } = useUndoToast();

  useEffect(() => {
    if (typeof window !== "undefined" && navigator.platform) {
      setIsMac(/Mac|iPod|iPhone|iPad/.test(navigator.platform));
    }
  }, []);

  // Keyboard shortcut: Ctrl+S / Cmd+S to save
  useEffect(() => {
    const handleSaveShortcut = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.code === "KeyS") {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", handleSaveShortcut);
    return () => window.removeEventListener("keydown", handleSaveShortcut);
  }, [steps, dirty]);

  // Bulk Import Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [importResult, setImportResult] = useState<ParseChecklistResult | null>(null);
  const [importMode, setImportMode] = useState<"append" | "replace">("append");
  const [replaceConfirmInput, setReplaceConfirmInput] = useState("");

  // Keyboard accessibility: Escape key closes bulk import modal
  useEffect(() => {
    if (!isImportModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setIsImportModalOpen(false);
        setImportResult(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isImportModalOpen]);

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

  // Delete Step with 8s Undo Toast
  const handleDeleteStep = (index: number) => {
    const deletedStep = steps[index];
    const updated = steps.filter((_, i) => i !== index);
    markDirty(updated);

    showUndoToast({
      message: "Checklist step deleted",
      durationMs: 8000,
      onUndo: () => {
        const restored = [...updated];
        restored.splice(index, 0, deletedStep);
        markDirty(restored);
      },
    });
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
        errors[idx] = "Step text in English is required";
      }
    });

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setFeedback({
        type: "error",
        message: "Please provide English step text for all steps before saving.",
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
        alert("The entered confirmation title does not match the procedure title.");
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
      alert("Total steps after import will exceed the maximum limit of 200 steps.");
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
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold text-start mb-2 animate-in fade-in ${
              feedback.type === "success"
                ? "border border-success/30 bg-success-surface text-success"
                : "border border-danger/30 bg-danger-surface text-danger"
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

      <div className="squircle-card rounded-card border border-border-subtle bg-white p-4 sm:p-6 space-y-4 shadow-card-soft">
        {/* Header with Counters, Import and Add Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-subtle pb-4">
          <div>
            <h2 className="text-base font-bold text-navy flex items-center gap-2">
              <CheckSquare className="h-4 w-4 text-rose-dark" />
              <span>{AR_STRINGS.checklistTitle}</span>
            </h2>
            <div className="flex items-center gap-2.5 mt-1 text-xs text-text-secondary flex-wrap">
              <span>
                Total Steps: <bdi className="font-mono font-bold text-navy">{steps.length}</bdi> / 200
              </span>
              <span>•</span>
              <span className="text-critical font-bold">
                Critical Steps: <bdi className="font-mono">{criticalCount}</bdi>
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            {/* Bulk Import Button */}
            <button
              type="button"
              onClick={() => setIsImportModalOpen(true)}
              className="squircle-pill inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-pill border border-border bg-light-1 px-4 py-2 text-xs font-bold text-navy transition-colors hover:border-rose-dark hover:text-rose-dark w-full sm:w-auto"
            >
              <Upload className="h-4 w-4" />
              <span>{AR_STRINGS.bulkImportButton}</span>
            </button>

            {/* Add Step Button */}
            <button
              type="button"
              onClick={handleAddStep}
              disabled={steps.length >= 200}
              className="squircle-pill btn-rose-cta inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-pill px-4 py-2 text-xs font-bold text-navy active:scale-95 disabled:opacity-50 w-full sm:w-auto"
            >
              <Plus className="h-4 w-4" />
              <span>{AR_STRINGS.addStep}</span>
            </button>
          </div>
        </div>

        {/* Steps List */}
        {steps.length === 0 ? (
          <div className="py-8 text-center border-2 border-dashed border-border rounded-tile bg-light-1/50">
            <CheckSquare className="mx-auto h-8 w-8 text-text-secondary opacity-70" />
            <p className="mt-2 text-sm text-text-secondary">
              No checklist steps added yet. Click &quot;Add Step&quot; or use &quot;Bulk Import&quot; to begin.
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
                    <div className="flex items-center gap-2 rounded-lg bg-light-1 px-3.5 py-2 border-r-4 border-rose-dark text-xs font-bold text-rose-dark shadow-xs">
                      <Layers className="h-4 w-4 shrink-0" />
                      <span>{step.phase}</span>
                    </div>
                  )}

                  <div
                    className={`group squircle-tile rounded-tile border p-3 sm:p-4 space-y-3 transition-colors ${
                      step.is_critical
                        ? "border-s-4 border-s-critical border-critical/35 bg-critical-surface/40"
                        : "border-border-subtle bg-light-1 hover:border-rose-dark/50"
                    }`}
                  >
                    {/* Top Row: Index, Critical Switch, Phase input, Controls */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pb-2 border-b border-border-subtle">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Step Number */}
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-border-subtle text-xs font-mono font-bold text-navy">
                          {index + 1}
                        </span>

                        {/* Critical Switch with Flag Icon + Red Critical Tokens */}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            role="switch"
                            aria-checked={step.is_critical}
                            onClick={() =>
                              handleStepFieldChange(index, "is_critical", !step.is_critical)
                            }
                            className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors border ${
                              step.is_critical
                                ? "bg-critical text-white border-critical shadow-xs"
                                : "bg-white text-text-secondary border-border hover:border-rose-dark hover:text-navy"
                            }`}
                          >
                            <Flag
                              className={`h-3.5 w-3.5 shrink-0 ${
                                step.is_critical ? "text-white" : "text-text-secondary"
                              }`}
                              aria-hidden="true"
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
                            aria-label={`Clinical phase for step ${index + 1}`}
                            value={step.phase || ""}
                            onChange={(e) =>
                              handleStepFieldChange(index, "phase", e.target.value.slice(0, 80))
                            }
                            placeholder="Clinical Phase (Optional)..."
                            className="min-h-[44px] w-full sm:w-44 rounded-lg border border-border bg-white px-3 text-xs text-navy focus:border-rose-dark focus:outline-none focus:ring-2 focus:ring-rose-dark/25"
                          />
                        </div>
                      </div>

                      {/* Action Controls: Add Next, Duplicate, Move Up, Move Down, Delete */}
                      <div className="flex items-center justify-end gap-1 shrink-0 pt-1 sm:pt-0">
                        {/* Add step directly after this one */}
                        <button
                          type="button"
                          onClick={() => handleAddStepAfter(index)}
                          title="Add step immediately after"
                          aria-label={`Add step after step ${index + 1}`}
                          className="squircle-pill inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-pill border border-border bg-white text-text-secondary hover:border-rose-dark hover:text-rose-dark"
                        >
                          <Plus className="h-4 w-4" />
                        </button>

                        {/* Duplicate step */}
                        <button
                          type="button"
                          onClick={() => handleDuplicateStep(index)}
                          title="Duplicate step"
                          aria-label={`Duplicate step ${index + 1}`}
                          className="squircle-pill inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-pill border border-border bg-white text-text-secondary hover:border-rose-dark hover:text-navy"
                        >
                          <Copy className="h-4 w-4" />
                        </button>

                        {/* Move Up */}
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => handleMoveUp(index)}
                          title={AR_STRINGS.adminMoveUp}
                          aria-label={`${AR_STRINGS.adminMoveUp} for step ${index + 1}`}
                          className="squircle-pill inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-pill border border-border bg-white text-text-secondary hover:border-rose-dark hover:text-navy disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <ChevronUp className="h-4 w-4" />
                        </button>

                        {/* Move Down */}
                        <button
                          type="button"
                          disabled={index === steps.length - 1}
                          onClick={() => handleMoveDown(index)}
                          title={AR_STRINGS.adminMoveDown}
                          aria-label={`${AR_STRINGS.adminMoveDown} for step ${index + 1}`}
                          className="squircle-pill inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-pill border border-border bg-white text-text-secondary hover:border-rose-dark hover:text-navy disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <ChevronDown className="h-4 w-4" />
                        </button>

                        {/* Delete Step */}
                        <button
                          type="button"
                          onClick={() => handleDeleteStep(index)}
                          title={AR_STRINGS.deleteStep}
                          aria-label={`Delete step ${index + 1}`}
                          className="squircle-pill inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-pill border border-danger/30 bg-danger-surface text-danger hover:bg-danger hover:text-white transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Text Inputs: English (Required, LTR) & Arabic (Optional, RTL) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* English Textarea (Required) */}
                      <div>
                        <label htmlFor={`step-text-en-${index}`} className="block text-xs font-semibold text-text-secondary mb-1">
                          <bdi dir="ltr" lang="en">English Step Content</bdi>{" "}
                          <span className="text-danger">*</span>
                        </label>
                        <textarea
                          id={`step-text-en-${index}`}
                          aria-label={`English step instruction ${index + 1}`}
                          rows={2}
                          dir="ltr"
                          lang="en"
                          maxLength={500}
                          value={step.text_en}
                          onChange={(e) =>
                            handleStepFieldChange(index, "text_en", e.target.value.slice(0, 500))
                          }
                          placeholder="Clinical step instruction in English..."
                          className={`w-full rounded-lg border bg-white p-2.5 text-sm text-navy focus:outline-none focus:ring-2 leading-snug ${
                            fieldErrors[index]
                              ? "border-danger focus:ring-danger/25"
                              : "border-border focus:border-rose-dark focus:ring-rose-dark/25"
                          }`}
                        />
                        {fieldErrors[index] && (
                          <p className="mt-1 text-xs text-danger">
                            {fieldErrors[index]}
                          </p>
                        )}
                      </div>

                      {/* Arabic Textarea (Optional) */}
                      <div>
                        <label htmlFor={`step-text-ar-${index}`} className="block text-xs font-semibold text-text-secondary mb-1">
                          Arabic Translation (Optional)
                        </label>
                        <textarea
                          id={`step-text-ar-${index}`}
                          aria-label={`Arabic translation for step ${index + 1}`}
                          rows={2}
                          dir="rtl"
                          lang="ar"
                          maxLength={500}
                          value={step.text_ar || ""}
                          onChange={(e) =>
                            handleStepFieldChange(index, "text_ar", e.target.value.slice(0, 500))
                          }
                          placeholder="Optional Arabic translation for reference..."
                          className="w-full rounded-lg border border-border bg-white p-2.5 text-sm text-navy focus:border-rose-dark focus:outline-none focus:ring-2 focus:ring-rose-dark/25 leading-relaxed"
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
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-border-subtle">
          <div className="text-xs text-text-secondary">
            {dirty && (
              <span className="text-critical font-bold">
                ● Unsaved changes in checklist steps
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !dirty}
            className="squircle-pill btn-rose-cta w-full sm:w-auto inline-flex min-h-[44px] items-center justify-center gap-2 rounded-pill px-6 py-2.5 text-sm font-bold text-navy active:scale-[0.98] disabled:opacity-50"
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
                <kbd className="hidden sm:inline-flex items-center rounded border border-navy/25 bg-navy/10 px-1.5 py-0.5 text-[10px] font-mono font-semibold text-navy">
                  {isMac ? "⌘S" : "Ctrl+S"}
                </kbd>
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
          className="surface-light fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-navy/60 backdrop-blur-sm p-0 sm:p-5 overflow-hidden animate-in fade-in safe-pb"
        >
          <div className="squircle-card w-full max-w-4xl rounded-t-card sm:rounded-card border border-border-subtle bg-white shadow-card-soft flex flex-col max-h-[92dvh] sm:max-h-[90vh] overflow-hidden">
            {/* Mobile Drag Indicator */}
            <div className="sm:hidden pt-2 pb-1 flex justify-center items-center select-none bg-white">
              <div className="h-1.5 w-12 rounded-full bg-border opacity-70" />
            </div>

            {/* Modal Header (Fixed / Non-scrolling) */}
            <div className="flex items-center justify-between border-b border-border-subtle p-3 sm:p-5 shrink-0 bg-white">
              <div>
                <h3
                  id="bulk-import-heading"
                  className="text-base font-bold text-navy flex items-center gap-2"
                >
                  <Upload className="h-4 w-4 text-rose-dark" />
                  <span>{AR_STRINGS.bulkImportTitle}</span>
                </h3>
                <p className="mt-1 text-xs text-text-secondary font-arabic">
                  {AR_STRINGS.bulkImportDesc}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsImportModalOpen(false);
                  setImportResult(null);
                }}
                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-pill text-text-secondary hover:bg-light-1 hover:text-navy"
                aria-label="Close bulk import dialog"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable Modal Content */}
            <div className="p-3 sm:p-6 overflow-y-auto flex-1 space-y-4">
              {/* Import Textarea */}
              <div>
                <label htmlFor="bulk-import-textarea" className="block text-xs font-semibold text-text-secondary mb-1.5">
                  Paste step lines here (Max: 200 lines):
                </label>
                <textarea
                  id="bulk-import-textarea"
                  aria-label="Checklist steps bulk import text"
                  rows={5}
                  dir="ltr"
                  value={importText}
                  onChange={(e) => {
                    setImportText(e.target.value);
                    setImportResult(null);
                  }}
                  placeholder={`# Phase Name (Optional)
English instruction step | Arabic translation (Optional)
! Critical step instruction | Critical translation
Another standard step`}
                  className="w-full rounded-lg border border-border bg-search-bg p-3 font-mono text-left text-xs text-navy focus:border-rose-dark focus:outline-none focus:ring-2 focus:ring-rose-dark/25"
                />
              </div>

              {/* Preview Button */}
              <div>
                <button
                  type="button"
                  onClick={handleRunImportPreview}
                  disabled={!importText.trim()}
                  className="squircle-pill inline-flex min-h-[44px] items-center gap-2 rounded-pill border border-rose-dark bg-light-1 px-4 py-2 text-xs font-bold text-rose-dark hover:bg-rose-dark hover:text-white transition-colors disabled:opacity-40"
                >
                  <FileText className="h-4 w-4" />
                  <span>{AR_STRINGS.bulkImportPreviewButton}</span>
                </button>
              </div>

              {/* Preview Results Table, Errors, and Warnings */}
              {importResult && (
                <div className="space-y-4 pt-3 border-t border-border-subtle">
                  {/* Errors List */}
                  {importResult.errors.length > 0 && (
                    <div
                      role="alert"
                      className="rounded-lg border border-danger/40 bg-danger-surface p-3 text-xs text-danger space-y-1.5"
                    >
                      <div className="font-bold flex items-center gap-1.5">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>{AR_STRINGS.bulkImportErrorsFound}</span>
                      </div>
                      <ul className="list-disc list-inside space-y-0.5 ps-1">
                        {importResult.errors.map((err, i) => (
                          <li key={i}>
                            <span className="font-bold">Line {err.line}:</span> {err.message}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Warnings List */}
                  {importResult.warnings.length > 0 && (
                    <div className="rounded-lg border border-critical/40 bg-critical-surface p-3 text-xs text-critical space-y-1.5">
                      <div className="font-bold flex items-center gap-1.5">
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                        <span>Warnings (non-blocking):</span>
                      </div>
                      <ul className="list-disc list-inside space-y-0.5 ps-1">
                        {importResult.warnings.map((warn, i) => (
                          <li key={i}>
                            <span className="font-bold">Line {warn.line}:</span> {warn.message}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Preview Table */}
                  {importResult.steps.length > 0 && (
                    <div className="overflow-x-auto rounded-lg border border-border-subtle">
                      <table className="w-full text-xs text-start">
                        <thead className="bg-light-1 border-b border-border-subtle text-text-secondary">
                          <tr>
                            <th className="p-2 text-start">#</th>
                            <th className="p-2 text-start">Phase</th>
                            <th className="p-2 text-start">Status</th>
                            <th className="p-2 text-start">English Text</th>
                            <th className="p-2 text-start">Arabic Text</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border-subtle">
                          {importResult.steps.map((st, i) => (
                            <tr key={i} className="hover:bg-light-1/50">
                              <td className="p-2 font-mono text-text-secondary">{st.lineNumber}</td>
                              <td className="p-2 font-bold text-rose-dark">
                                {st.phase || <span className="text-text-secondary">-</span>}
                              </td>
                              <td className="p-2">
                                {st.is_critical ? (
                                  <span className="inline-block rounded bg-critical px-1.5 py-0.5 text-[10px] font-bold text-white">
                                    Critical
                                  </span>
                                ) : (
                                  <span className="text-text-secondary text-[10px]">Standard</span>
                                )}
                              </td>
                              <td className="p-2 font-mono text-navy" dir="ltr">
                                {st.text_en}
                              </td>
                              <td className="p-2 text-text-secondary" dir="rtl">
                                {st.text_ar || <span className="text-text-secondary">-</span>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Mode Selector: Append vs Replace All */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center gap-4 text-xs font-bold text-navy">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="importMode"
                          value="append"
                          checked={importMode === "append"}
                          onChange={() => setImportMode("append")}
                          className="h-4 w-4 accent-rose-dark"
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
                          className="h-4 w-4 accent-danger"
                        />
                        <span className="text-danger">{AR_STRINGS.bulkImportModeReplace}</span>
                      </label>
                    </div>

                    {/* If Replace All is chosen, require typing the procedure title */}
                    {importMode === "replace" && (
                      <div className="rounded-lg border border-danger/30 bg-danger-surface p-3 text-xs space-y-2">
                        <label htmlFor="replace-confirm-title-input" className="block font-bold text-danger">
                          {AR_STRINGS.bulkImportConfirmReplaceWarning}
                        </label>
                        <input
                          id="replace-confirm-title-input"
                          aria-label="Confirm procedure title for full replacement"
                          type="text"
                          value={replaceConfirmInput}
                          onChange={(e) => setReplaceConfirmInput(e.target.value)}
                          placeholder={procedure.title}
                          className="squircle-pill w-full min-h-[44px] rounded-pill border border-border bg-white px-3.5 text-sm text-navy"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Actions (Always reachable at 320x568) */}
            <div className="border-t border-border-subtle bg-white p-3 sm:p-4 shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
              <div className="text-xs text-text-secondary flex items-center">
                {importResult && !importResult.valid && (
                  <span className="text-danger font-bold flex items-center gap-1.5" role="alert">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>Button disabled: Fix errors above before importing.</span>
                  </span>
                )}
                {importResult && importResult.valid && importMode === "replace" && replaceConfirmInput.trim().toLowerCase() !== procedure.title.trim().toLowerCase() && (
                  <span className="text-danger font-bold flex items-center gap-1.5">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>Button disabled: Type procedure title exactly to confirm replacement.</span>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 justify-end w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    setIsImportModalOpen(false);
                    setImportResult(null);
                  }}
                  className="squircle-pill flex-1 sm:flex-initial inline-flex min-h-[44px] items-center justify-center rounded-pill border border-border bg-white px-4 py-2 text-xs font-bold text-navy hover:border-rose-dark hover:text-rose-dark"
                >
                  {AR_STRINGS.cancel}
                </button>

                <button
                  type="button"
                  id="confirm-import-btn"
                  onClick={handleConfirmImport}
                  disabled={
                    !importResult ||
                    !importResult.valid ||
                    importResult.steps.length === 0 ||
                    (importMode === "replace" &&
                      replaceConfirmInput.trim().toLowerCase() !== procedure.title.trim().toLowerCase())
                  }
                  title={
                    !importResult
                      ? "Button disabled: Please preview steps first"
                      : !importResult.valid
                      ? "Button disabled: Errors present in import text"
                      : importMode === "replace" && replaceConfirmInput.trim().toLowerCase() !== procedure.title.trim().toLowerCase()
                      ? "Button disabled: Type title to match"
                      : "Confirm & Import Steps"
                  }
                  className="squircle-pill btn-rose-cta flex-1 sm:flex-initial inline-flex min-h-[44px] items-center justify-center gap-2 rounded-pill px-6 py-2 text-xs font-bold text-navy disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
                >
                  <Check className="h-4 w-4" />
                  <span>{AR_STRINGS.bulkImportConfirmButton}</span>
                  <kbd className="hidden sm:inline-flex items-center rounded border border-navy/25 bg-navy/10 px-1 py-0.5 text-[10px] font-mono font-semibold text-navy">
                    {isMac ? "⌘↵" : "Ctrl+↵"}
                  </kbd>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
