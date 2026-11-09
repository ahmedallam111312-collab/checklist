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

  const storageKey = `profnurse_progress_${procedureSlug}`;

  // Load progress from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Keep only IDs that exist in current steps
          const validIds = new Set(steps.map((s) => s.id));
          const filtered = parsed.filter((id) => validIds.has(id));
          setCheckedIds(new Set(filtered));
        }
      }
    } catch {
      // Ignore localStorage errors
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
      <p className="py-6 text-center text-sm text-[var(--color-text-muted)] font-arabic" dir="rtl" lang="ar">
        {AR_STRINGS.sectionEmpty}
      </p>
    );
  }

  // Group steps by phase if present
  let currentPhase: string | null = null;

  return (
    <div className="space-y-4">
      {/* Progress Bar & Header */}
      <div className="rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-sunken)] p-4">
        <div className="mb-3 flex items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[var(--color-text)]">
              {formatProgress(done, total)}
            </span>
            <span className="font-mono text-xs tabular-nums text-[var(--color-text-muted)]">
              ({percentage}%)
            </span>
          </div>

          <button
            type="button"
            onClick={resetProgress}
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-md px-3 text-xs font-semibold text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-danger)] active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus-ring)]"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{AR_STRINGS.resetProgress}</span>
          </button>
        </div>

        {/* 8px Progress Track */}
        <div
          className="h-2 w-full overflow-hidden rounded-full bg-[var(--color-surface)]"
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={formatProgress(done, total)}
        >
          <div
            className={`h-full transition-all duration-300 ease-out ${
              isComplete
                ? "bg-[var(--color-success)]"
                : "bg-[var(--color-primary)]"
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Checklist Step Items */}
      <div className="divide-y divide-[var(--color-border-subtle)] overflow-hidden rounded-lg border border-[var(--color-border-subtle)]">
        {steps.map((step, idx) => {
          const showPhase = step.phase && step.phase !== currentPhase;
          if (step.phase) {
            currentPhase = step.phase;
          }

          return (
            <React.Fragment key={step.id}>
              {showPhase && (
                <h3
                  dir="ltr"
                  lang="en"
                  className="bg-[var(--color-surface-raised)] px-4 py-2.5 text-xs font-mono font-semibold tracking-wider text-[var(--color-primary)] border-b border-[var(--color-border-subtle)] uppercase text-start"
                >
                  {step.phase}
                </h3>
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
