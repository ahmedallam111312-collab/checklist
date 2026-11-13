"use client";

import React, { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

export function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    function handleOnline() {
      setIsOffline(false);
    }
    function handleOffline() {
      setIsOffline(true);
    }

    if (typeof window !== "undefined") {
      setIsOffline(!window.navigator.onLine);
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <aside
      role="status"
      aria-live="polite"
      className="surface-light squircle-card fixed bottom-4 start-4 end-4 z-50 mx-auto max-w-md border-2 border-warning bg-warning-surface p-3.5 text-navy shadow-card-soft safe-mb"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-pill bg-warning text-white">
          <WifiOff className="h-4 w-4" aria-hidden="true" />
        </div>
        <div className="flex-1 text-sm leading-tight" dir="ltr">
          <p className="font-bold text-warning">Offline Mode</p>
          <p className="mt-0.5 text-xs text-navy">
            You are currently offline. Viewing cached procedures and local checklist progress.
          </p>
        </div>
      </div>
    </aside>
  );
}
