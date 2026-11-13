import React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { Plus, Video, AlertCircle, AlertTriangle, Download } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/data";
import { DEMO_PROCEDURES } from "@/data/demo-data";
import { Procedure } from "@/types/database";
import { AR_STRINGS } from "@/messages/ar";
import { AdminDashboardClient } from "@/components/admin/AdminDashboardClient";
import { OrphanAssetCleaner } from "@/components/admin/OrphanAssetCleaner";
import { getVideoUsageSummary } from "@/app/admin/actions/video";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "إدارة الإجراءات | Critical Ease",
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

  // Live video usage & orphan asset summary
  let videosUsed = 0;
  const videoLimit = 10;
  let orphanAssets: string[] = [];

  try {
    const summary = await getVideoUsageSummary();
    videosUsed = summary.usedCount;
    orphanAssets = summary.orphanAssets;
  } catch {
    videosUsed = procedures.filter((p) => p.mux_asset_id).length;
  }

  const isAmber = videosUsed >= 8 && videosUsed < 10;
  const isRed = videosUsed >= 10;
  const barColor = isRed
    ? "bg-critical"
    : isAmber
    ? "bg-warning"
    : "bg-rose-dark";

  return (
    <div className="space-y-6 text-start">
      {/* Top Header Row: Title & Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border-subtle pb-5">
        <div>
          <h1 className="type-h1 text-navy">
            {AR_STRINGS.adminProceduresList}
          </h1>
          <p className="mt-1 text-sm text-text-secondary font-arabic">
            إدارة وتعديل الإجراءات السريرية، ترتيب عرضها للطلاب، ونشرها.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Backup Export Button */}
          <a
            href="/api/admin/backup"
            download
            className="squircle-pill inline-flex min-h-[44px] items-center gap-2 rounded-pill border border-border bg-white px-4 py-2 text-xs font-bold text-navy transition-colors hover:border-rose-dark hover:text-rose-dark"
            title={AR_STRINGS.backupNote}
          >
            <Download className="h-4 w-4 text-rose-dark" aria-hidden="true" />
            <span>{AR_STRINGS.backupExportButton}</span>
          </a>

          {/* Add Procedure Button */}
          <Link
            href="/admin/procedures/new"
            className="squircle-pill btn-rose-cta inline-flex min-h-[44px] items-center gap-2 rounded-pill px-4 py-2 text-sm font-bold text-navy active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>{AR_STRINGS.adminAddProcedure}</span>
          </Link>
        </div>
      </div>

      {/* Backup note in UI */}
      <p className="text-xs text-text-secondary font-arabic">
        {AR_STRINGS.backupNote}
      </p>

      {/* Videos used widget */}
      <div
        data-testid="video-usage-card"
        className="squircle-card rounded-card border border-border-subtle bg-white p-4 sm:p-5 shadow-card-soft"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Video className="h-5 w-5 text-rose-dark" aria-hidden="true" />
            <h2 className="text-sm font-bold text-navy">
              {AR_STRINGS.adminVideosUsedWidget}
            </h2>
          </div>
          <span className="font-mono text-xs font-bold tabular-nums text-text-secondary" dir="ltr">
            {videosUsed} / {videoLimit}
          </span>
        </div>

        <div className="mt-2.5 h-2.5 w-full overflow-hidden rounded-full bg-light-1 border border-border-subtle">
          <div
            className={`h-full transition-all duration-300 ${barColor}`}
            style={{ width: `${Math.min(100, (videosUsed / videoLimit) * 100)}%` }}
          />
        </div>

        {isRed && (
          <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-danger" role="alert">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span>{AR_STRINGS.videoQuotaBlocked}</span>
          </p>
        )}

        {isAmber && !isRed && (
          <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-warning">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            <span>{AR_STRINGS.adminVideosWarning}</span>
          </p>
        )}

        <OrphanAssetCleaner orphanAssets={orphanAssets} />
      </div>

      {/* Procedures Reorderable List & Management */}
      <AdminDashboardClient initialProcedures={procedures} />
    </div>
  );
}
