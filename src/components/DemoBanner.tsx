import React from "react";
import { AlertTriangle } from "lucide-react";
import { isDemoMode } from "@/lib/data";
import { AR_STRINGS } from "@/messages/ar";

export function DemoBanner() {
  if (!isDemoMode()) return null;

  return (
    <div
      role="status"
      aria-label="Demo Mode Notice"
      className="w-full border-b border-[var(--color-critical)] bg-[var(--color-critical-surface)] px-4 py-2 text-xs font-medium text-[var(--color-text)]"
    >
      <div className="mx-auto flex max-w-[70rem] items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <AlertTriangle
            className="h-4 w-4 shrink-0 text-[var(--color-critical)]"
            aria-hidden="true"
          />
          <span className="font-semibold text-[var(--color-critical)] uppercase tracking-wider font-mono">
            DEMO DATA
          </span>
          <span className="text-[var(--color-text-secondary)] sm:hidden">
            {AR_STRINGS.demoDataBannerShort}
          </span>
          <span className="text-[var(--color-text-secondary)] hidden sm:inline">
            {AR_STRINGS.demoDataBanner}
          </span>
        </div>
      </div>
    </div>
  );
}
