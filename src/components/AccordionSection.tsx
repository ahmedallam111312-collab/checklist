"use client";

import React, { useState } from "react";
import { ChevronDown, AlertCircle } from "lucide-react";

interface AccordionSectionProps {
  number: number;
  title: string;
  defaultOpen?: boolean;
  isDanger?: boolean;
  children: React.ReactNode;
}

export function AccordionSection({
  number,
  title,
  defaultOpen = false,
  isDanger = false,
  children,
}: AccordionSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const contentId = `section-content-${number}`;

  return (
    <div
      className={`rounded-lg border transition-all ${
        isDanger
          ? "border-[var(--color-danger)]/40 border-s-4 border-s-[var(--color-danger)] bg-[var(--color-surface)]"
          : "border-[var(--color-border-subtle)] bg-[var(--color-surface)]"
      }`}
    >
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={contentId}
        onClick={() => setIsOpen(!isOpen)}
        className={`flex min-h-[56px] w-full items-center justify-between gap-3 p-4 text-start rounded-lg transition-colors active:scale-[0.99] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus-ring)] ${
          isDanger && isOpen ? "bg-[var(--color-danger-surface)]" : ""
        }`}
      >
        <div className="flex items-center gap-3">
          {/* Numbered Badge */}
          <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-sm font-semibold tabular-nums shadow-sm ${
              isDanger
                ? "bg-[var(--color-danger)] text-white"
                : "bg-[var(--color-primary)] text-[var(--color-on-primary)]"
            }`}
          >
            {number}
          </span>

          {/* Section Title */}
          <div className="flex items-center gap-2">
            {isDanger && (
              <AlertCircle
                className="h-5 w-5 text-[var(--color-danger)] shrink-0"
                aria-hidden="true"
              />
            )}
            <h2 className="type-h2 text-[var(--color-text)]">
              {title}
            </h2>
          </div>
        </div>

        {/* Chevron with RTL awareness */}
        <ChevronDown
          className={`h-5 w-5 text-[var(--color-text-muted)] transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <div
          id={contentId}
          className="border-t border-[var(--color-border-subtle)] p-4 sm:p-6"
        >
          {children}
        </div>
      )}
    </div>
  );
}
