"use client";

import React, { useState } from "react";
import { AlertTriangle, Check } from "lucide-react";
import { ChecklistStep } from "@/types/database";
import { AR_STRINGS } from "@/messages/ar";

interface ChecklistStepItemProps {
  step: ChecklistStep;
  index: number;
  isChecked: boolean;
  onToggle: (id: string) => void;
  defaultArabicOpen?: boolean;
}

export function ChecklistStepItem({
  step,
  index,
  isChecked,
  onToggle,
  defaultArabicOpen = false,
}: ChecklistStepItemProps) {
  const [isArabicExpanded, setIsArabicExpanded] = useState(defaultArabicOpen);
  const arabicPanelId = `step-ar-${step.id}`;
  const hasArabicText = Boolean(step.text_ar && step.text_ar.trim().length > 0);

  return (
    <div
      dir="ltr"
      lang="en"
      className={`rounded-lg transition-colors border-t border-b border-r border-t-[var(--color-border-subtle)] border-b-[var(--color-border-subtle)] border-r-[var(--color-border-subtle)] first:border-t-0 last:border-b-0 ${
        step.is_critical
          ? "border-l-4 !border-l-[var(--color-critical)] bg-[var(--color-critical-surface)] pb-1"
          : "border-l-4 !border-l-transparent bg-[var(--color-surface)]"
      }`}
    >
      <div className="p-3.5 sm:p-4 text-start">
        {/* Top Row: Checkbox, Step Number, CRITICAL Chip, and "عربي" Button */}
        <div className="flex items-center justify-between gap-2 min-h-[44px]">
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Custom 44px tap target containing 24px visual checkbox */}
            <button
              type="button"
              role="checkbox"
              aria-checked={isChecked}
              aria-label={`Step ${index + 1}: ${step.text_en}`}
              onClick={() => onToggle(step.id)}
              className="group relative flex h-11 w-11 shrink-0 -m-1.5 items-center justify-center rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus-ring)]"
            >
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-sm transition-all duration-150 ${
                  isChecked
                    ? "bg-[var(--color-primary)] text-[var(--color-on-primary)] shadow-sm"
                    : "border-[1.5px] border-[var(--color-border)] bg-[var(--color-surface-sunken)] group-hover:border-[var(--color-primary)]"
                }`}
              >
                {isChecked && (
                  <Check className="h-4 w-4 stroke-[3] animate-in zoom-in-75 duration-150" />
                )}
              </span>
            </button>

            {/* Tabular Step Number */}
            <span className="font-mono text-xs font-semibold tabular-nums tracking-wider text-[var(--color-text-muted)]">
              {String(index + 1).padStart(2, "0")}
            </span>

            {/* CRITICAL Chip */}
            {step.is_critical && (
              <div className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-critical)] px-2.5 py-0.5 text-[11px] font-mono font-semibold tracking-wider text-[var(--color-on-critical)] shadow-sm">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>CRITICAL</span>
                {/* Visually hidden Arabic text for screen readers */}
                <span className="sr-only">{AR_STRINGS.criticalScreenReader}</span>
              </div>
            )}
          </div>

          {/* "عربي" Translation Toggle Button: Hidden when step has no Arabic text (T9f) */}
          {hasArabicText && (
            <button
              type="button"
              aria-expanded={isArabicExpanded}
              aria-controls={arabicPanelId}
              onClick={() => setIsArabicExpanded(!isArabicExpanded)}
              className={`inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border px-3.5 text-xs font-semibold font-arabic transition-all active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus-ring)] ${
                isArabicExpanded
                  ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-on-primary)] shadow-sm"
                  : "border-[var(--color-border)] bg-[var(--color-surface-sunken)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
              }`}
            >
              {AR_STRINGS.arabicToggle}
            </button>
          )}
        </div>

        {/* Full-width Step Text below the top row */}
        <div className="mt-2.5 w-full">
          <p
            className={`text-lg leading-7 break-words ${
              step.is_critical ? "font-semibold" : "font-normal"
            } ${
              isChecked
                ? "text-[var(--color-text-secondary)]"
                : "text-[var(--color-text)]"
            }`}
          >
            {step.text_en}
          </p>
        </div>
      </div>

      {/* Per-step Arabic Translation Panel (T9d: Bottom padding inside critical step) */}
      {hasArabicText && isArabicExpanded && (
        <div
          id={arabicPanelId}
          dir="rtl"
          lang="ar"
          className={`mx-3.5 mb-4 sm:mx-4 sm:mb-5 rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)] p-4 text-base leading-[1.75] text-[var(--color-text)] shadow-sm animate-in fade-in duration-200 text-start ${
            step.is_critical ? "pb-5 mb-5" : ""
          }`}
        >
          <p>{step.text_ar}</p>
        </div>
      )}
    </div>
  );
}
