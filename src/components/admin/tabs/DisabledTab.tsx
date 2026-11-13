import React from "react";
import { Lock } from "lucide-react";
import { AR_STRINGS } from "@/messages/ar";

interface DisabledTabProps {
  title: string;
  phaseNote: string;
}

export function DisabledTab({ title, phaseNote }: DisabledTabProps) {
  return (
    <div className="squircle-card rounded-card border border-dashed border-border bg-white p-12 text-center shadow-card-soft">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-light-1 text-text-secondary">
        <Lock className="h-6 w-6" aria-hidden="true" />
      </div>

      <h3 className="mt-4 text-base font-bold text-navy">
        {title}
      </h3>

      <div className="mt-2 inline-flex items-center rounded-full border border-rose/30 bg-light-1 px-3 py-1 text-xs font-bold text-rose-dark">
        {AR_STRINGS.tabComingSoon}
      </div>

      <p className="mt-3 text-sm text-text-secondary max-w-md mx-auto">
        {phaseNote}
      </p>
    </div>
  );
}
