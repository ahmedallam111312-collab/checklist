"use client";

import React, { useState } from "react";
import { Flag, Check } from "lucide-react";
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
      className={`transition-colors ${
        step.is_critical
          ? "border-s-4 border-s-critical bg-critical-surface pb-1"
          : "border-s-4 border-s-transparent bg-white"
      }`}
    >
      <div className="p-3.5 text-start sm:p-4">
        <div className="flex min-h-[44px] items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* 44px Accessible Checkbox */}
            <button
              type="button"
              role="checkbox"
              aria-checked={isChecked}
              aria-label={`Step ${index + 1}: ${step.text_en}`}
              onClick={() => onToggle(step.id)}
              className="group relative -m-1.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-md"
            >
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-md transition-all duration-150 ${
                  isChecked
                    ? "bg-navy text-white shadow-sm"
                    : "border-[1.5px] border-border bg-light-1 group-hover:border-rose-dark"
                }`}
              >
                {isChecked && <Check className="h-4 w-4 stroke-[3]" />}
              </span>
            </button>

            <span className="font-latin text-xs font-bold tabular-nums tracking-wider text-text-muted">
              {String(index + 1).padStart(2, "0")}
            </span>

            {/* Non-Rose Deep Red Critical Badge with Flag Icon + Arabic Label */}
            {step.is_critical && (
              <div
                dir="rtl"
                lang="ar"
                className="inline-flex items-center gap-1.5 rounded-full bg-critical px-3 py-0.5 text-xs font-bold text-on-critical shadow-sm"
              >
                <Flag className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>{AR_STRINGS.criticalScreenReader}</span>
              </div>
            )}
          </div>

          {hasArabicText && (
            <button
              type="button"
              aria-expanded={isArabicExpanded}
              aria-controls={arabicPanelId}
              onClick={() => setIsArabicExpanded(!isArabicExpanded)}
              className={`inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border px-3.5 text-xs font-bold font-arabic transition-all active:scale-95 ${
                isArabicExpanded
                  ? "border-navy bg-navy text-white shadow-sm"
                  : "border-border bg-light-1 text-rose-dark hover:border-rose-dark hover:bg-page"
              }`}
            >
              {AR_STRINGS.arabicToggle}
            </button>
          )}
        </div>

        <div className="mt-2.5 w-full">
          <p
            className={`font-latin text-base leading-7 break-words sm:text-lg ${
              step.is_critical ? "font-semibold" : "font-normal"
            } ${isChecked ? "text-text-muted line-through/40" : "text-navy"}`}
          >
            {step.text_en}
          </p>
        </div>
      </div>

      {hasArabicText && isArabicExpanded && (
        <div
          id={arabicPanelId}
          dir="rtl"
          lang="ar"
          className={`mx-3.5 mb-4 rounded-lg border border-border-subtle bg-light-1 p-4 text-start text-base leading-[1.75] text-navy shadow-sm sm:mx-4 sm:mb-5 ${
            step.is_critical ? "mb-5 pb-5" : ""
          }`}
        >
          <p>{step.text_ar}</p>
        </div>
      )}
    </div>
  );
}
