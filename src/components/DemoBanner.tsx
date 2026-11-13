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
      className="surface-light w-full border-b border-warning bg-warning-surface px-4 py-2 text-xs font-medium text-navy"
    >
      <div className="mx-auto flex max-w-[70rem] items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <AlertTriangle
            className="h-4 w-4 shrink-0 text-warning"
            aria-hidden="true"
          />
          <span className="font-latin font-bold uppercase tracking-wider text-warning">
            DEMO DATA
          </span>
          <span className="text-navy sm:hidden">
            {AR_STRINGS.demoDataBannerShort}
          </span>
          <span className="hidden text-navy sm:inline">
            {AR_STRINGS.demoDataBanner}
          </span>
        </div>
      </div>
    </div>
  );
}
