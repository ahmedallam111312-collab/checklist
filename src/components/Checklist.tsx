"use client";

import React, { useEffect, useState } from "react";
import { RotateCcw } from "lucide-react";
import { ChecklistStep } from "@/types/database";
import { ChecklistStepItem } from "@/components/ChecklistStepItem";
import { AR_STRINGS, formatProgress } from "@/messages/ar";

interface ChecklistProps {
  steps: ChecklistStep[];
  procedureSlug: string;
}

export function Checklist({ steps, procedureSlug }: ChecklistProps) {
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [isLoaded, setIsLoaded] = useState(false);

  const storageKey = `critical_ease_progress_${procedureSlug}`;

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const validIds = new Set(steps.map((s) => s.id));
          const filtered = parsed.filter((id) => validIds.has(id));
          setCheckedIds(new Set(filtered));
        }
      }
    } catch {
    } finally {
      setIsLoaded(true);
    }
  }, [storageKey, steps]);

  const toggleStep = (id: string) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      try {
        localStorage.setItem(storageKey, JSON.stringify(Array.from(next)));
      } catch {}
      return next;
    });
  };

  const resetProgress = () => {
    setCheckedIds(new Set());
    try {
      localStorage.removeItem(storageKey);
    } catch {}
  };

  const total = steps.length;
  const done = isLoaded ? checkedIds.size : 0;
  const percentage = total > 0 ? Math.round((done / total) * 100) : 0;
  const isComplete = done === total && total > 0;

  if (steps.length === 0) {
    return (
      <p
        className="py-6 text-center text-sm text-text-muted"
        dir="ltr"
        lang="en"
      >
        {AR_STRINGS.sectionEmpty}
      </p>
    );
  }

  let currentPhase: string | null = null;

  return (
    <div className="space-y-4">
      {/* Progress Bar & Reset */}
      <div className="rounded-xl border border-border-subtle bg-light-1 p-4">
        <div className="mb-3 flex items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-2">
            <span className="font-bold text-navy">
              {formatProgress(done, total)}
            </span>
            <span className="font-latin text-xs font-semibold tabular-nums text-rose-dark">
              ({percentage}%)
            </span>
          </div>

          <button
            type="button"
            onClick={resetProgress}
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-pill px-3 text-xs font-semibold text-rose-dark transition-colors hover:bg-page hover:text-critical active:scale-95"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{AR_STRINGS.resetProgress}</span>
          </button>
        </div>

        <div
          className="h-2.5 w-full overflow-hidden rounded-full bg-light-2"
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={formatProgress(done, total)}
        >
          <div
            className={`h-full transition-all duration-300 ease-out ${
              isComplete ? "bg-success" : "bg-rose"
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Checklist Steps */}
      <div className="divide-y divide-border-subtle overflow-hidden rounded-xl border border-border-subtle bg-white">
        {steps.map((step, idx) => {
          const showPhase = step.phase && step.phase !== currentPhase;
          if (step.phase) {
            currentPhase = step.phase;
          }

          return (
            <React.Fragment key={step.id}>
              {showPhase && (
                <h4
                  dir="ltr"
                  lang="en"
                  className="eyebrow-latin border-b border-border-subtle bg-light-1 px-4 py-2.5 text-start text-xs font-bold text-rose-dark"
                >
                  {step.phase}
                </h4>
              )}
              <ChecklistStepItem
                step={step}
                index={idx}
                isChecked={checkedIds.has(step.id)}
                onToggle={toggleStep}
              />
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
