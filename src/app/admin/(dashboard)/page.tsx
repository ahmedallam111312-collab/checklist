import React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { Plus, Video, AlertCircle, Download } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/data";
import { DEMO_PROCEDURES } from "@/data/demo-data";
import { Procedure } from "@/types/database";
import { AR_STRINGS } from "@/messages/ar";
import { AdminDashboardClient } from "@/components/admin/AdminDashboardClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "إدارة الإجراءات — ProfNurse",
};

export default async function AdminDashboardPage() {
  let procedures: Procedure[] = [];

  if (isDemoMode()) {
    procedures = [...DEMO_PROCEDURES].sort((a, b) => a.sort_order - b.sort_order);
  } else {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("procedures")
        .select("*")
        .order("sort_order", { ascending: true });

      if (!error && data) {
        procedures = data as Procedure[];
      }
    } catch {}
  }

  // Placeholder video count (1 ready per published procedure with video, placeholder for Phase 3)
  const videosUsed = procedures.filter((p) => p.video_status === "ready").length;
  const videoLimit = 10;
  const isVideoNearLimit = videosUsed >= 8;

  return (
    <div className="space-y-6 text-start">
      {/* Top Header Row: Title & Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--color-border-subtle)] pb-5">
        <div>
          <h1 className="type-h1 text-[var(--color-text)]">
            {AR_STRINGS.adminProceduresList}
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)] font-arabic">
            إدارة وتعديل الإجراءات السريرية، ترتيب عرضها للطلاب، ونشرها.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Backup Export Button */}
          <a
            href="/api/admin/backup"
            download
            className="inline-flex min-h-[44px] items-center gap-2 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2 text-xs font-semibold text-[var(--color-text)] transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)]"
            title={AR_STRINGS.backupNote}
          >
            <Download className="h-4 w-4 text-[var(--color-primary)]" aria-hidden="true" />
            <span>{AR_STRINGS.backupExportButton}</span>
          </a>

          {/* Add Procedure Button */}
          <Link
            href="/admin/procedures/new"
            className="inline-flex min-h-[44px] items-center gap-2 rounded-md bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-[var(--color-on-primary)] transition-transform active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)]"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>{AR_STRINGS.adminAddProcedure}</span>
          </Link>
        </div>
      </div>

      {/* Backup note in UI */}
      <p className="text-xs text-[var(--color-text-muted)] font-arabic">
        ℹ {AR_STRINGS.backupNote}
      </p>

      {/* Placeholder "videos used: n / 10" widget */}
      <div className="rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Video className="h-5 w-5 text-[var(--color-primary)]" aria-hidden="true" />
            <h2 className="text-sm font-semibold text-[var(--color-text)]">
              {AR_STRINGS.adminVideosUsedWidget}
            </h2>
          </div>
          <span className="font-mono text-xs font-bold tabular-nums text-[var(--color-text-secondary)]" dir="ltr">
            {videosUsed} / {videoLimit}
          </span>
        </div>

        <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-[var(--color-surface-sunken)]">
          <div
            className={`h-full transition-all duration-300 ${
              isVideoNearLimit ? "bg-[var(--color-critical)]" : "bg-[var(--color-primary)]"
            }`}
            style={{ width: `${Math.min(100, (videosUsed / videoLimit) * 100)}%` }}
          />
        </div>

        {isVideoNearLimit && (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-[var(--color-critical)]">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span>{AR_STRINGS.adminVideosWarning}</span>
          </p>
        )}
      </div>

      {/* Procedures Reorderable List & Management */}
      <AdminDashboardClient initialProcedures={procedures} />
    </div>
  );
}
