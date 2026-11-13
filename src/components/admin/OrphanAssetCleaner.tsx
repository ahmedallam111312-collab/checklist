"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Trash2, Loader2, Check } from "lucide-react";
import { deleteOrphanMuxAsset } from "@/app/admin/actions/video";

interface OrphanAssetCleanerProps {
  orphanAssets: string[];
}

export function OrphanAssetCleaner({ orphanAssets }: OrphanAssetCleanerProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (orphanAssets.length === 0) return null;

  const handleDelete = async (assetId: string) => {
    if (!confirm(`Are you sure you want to permanently delete video asset (${assetId}) from Mux to free up quota?`)) {
      return;
    }

    setDeletingId(assetId);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await deleteOrphanMuxAsset(assetId);
      if (res.error) {
        setErrorMessage(res.error);
      } else {
        setSuccessMessage(`Video (${assetId}) was permanently deleted from Mux and quota was freed.`);
        router.refresh();
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred while deleting.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="mt-3 rounded-lg border border-warning/40 bg-warning-surface p-3 text-xs text-warning space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 font-bold">
          <AlertTriangle className="h-4 w-4 shrink-0 text-warning" />
          <span>Notice: Unlinked videos detected in Mux ({orphanAssets.length}).</span>
        </div>
      </div>

      <p className="text-[11px] text-text-secondary leading-relaxed">
        These video assets exist on Mux servers but are not linked to any procedure, consuming slots against your 10-video free quota. You can delete them now to reclaim space:
      </p>

      {errorMessage && (
        <div className="rounded bg-danger-surface p-2 text-danger text-[11px] font-semibold">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="rounded bg-emerald-50 text-emerald-800 p-2 text-[11px] font-semibold flex items-center gap-1.5">
          <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      <div className="flex flex-col gap-2 pt-1">
        {orphanAssets.map((id) => (
          <div
            key={id}
            className="flex items-center justify-between gap-2 rounded bg-white p-2 border border-border-subtle"
          >
            <span className="font-mono text-[11px] text-navy select-all" dir="ltr">
              {id}
            </span>

            <button
              type="button"
              disabled={deletingId === id}
              onClick={() => handleDelete(id)}
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-pill border border-danger/30 bg-danger-surface px-3 py-1.5 text-xs font-bold text-danger transition-colors hover:bg-danger hover:text-white disabled:opacity-50"
            >
              {deletingId === id ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete from Mux & Free Quota</span>
                </>
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
