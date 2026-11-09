import React from "react";
import { Lock } from "lucide-react";
import { AR_STRINGS } from "@/messages/ar";

interface DisabledTabProps {
  title: string;
  phaseNote: string;
}

export function DisabledTab({ title, phaseNote }: DisabledTabProps) {
  return (
    <div className="rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-12 text-center text-start">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-surface-raised)] text-[var(--color-text-muted)]">
        <Lock className="h-6 w-6" aria-hidden="true" />
      </div>

      <h3 className="mt-4 text-base font-bold text-[var(--color-text)]">
        {title}
      </h3>

      <div className="mt-2 inline-flex items-center rounded-full bg-[var(--color-primary)]/15 px-3 py-1 text-xs font-semibold text-[var(--color-primary)] font-arabic">
        {AR_STRINGS.tabComingSoon}
      </div>

      <p className="mt-3 text-sm text-[var(--color-text-secondary)] font-arabic max-w-md mx-auto">
        {phaseNote}
      </p>
    </div>
  );
}
