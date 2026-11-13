import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowRight, Eye } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/data";
import { DEMO_PROCEDURES } from "@/data/demo-data";
import { Procedure } from "@/types/database";
import { ProcedureEditor } from "@/components/admin/ProcedureEditor";
import { AR_STRINGS } from "@/messages/ar";

interface EditProcedurePageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "تعديل الإجراء | Critical Ease",
};

export default async function EditProcedurePage({ params }: EditProcedurePageProps) {
  const { id } = await params;
  let procedure: Procedure | null = null;

  if (isDemoMode()) {
    const found = DEMO_PROCEDURES.find((p) => p.id === id);
    procedure = found ? { ...found } : null;
  } else {
    try {
      const supabase = await createClient();
      const { data: proc, error: procError } = await supabase
        .from("procedures")
        .select("*")
        .eq("id", id)
        .single();

      if (!procError && proc) {
        const [listRes, eqRes, stepsRes] = await Promise.all([
          supabase
            .from("list_items")
            .select("*")
            .eq("procedure_id", id)
            .order("sort_order", { ascending: true }),
          supabase
            .from("equipment_items")
            .select("*")
            .eq("procedure_id", id)
            .order("sort_order", { ascending: true }),
          supabase
            .from("checklist_steps")
            .select("*")
            .eq("procedure_id", id)
            .order("sort_order", { ascending: true }),
        ]);

        procedure = {
          ...proc,
          list_items: listRes.data || [],
          equipment_items: eqRes.data || [],
          checklist_steps: stepsRes.data || [],
        } as Procedure;
      }
    } catch {}
  }

  if (!procedure) {
    notFound();
  }

  return (
    <div className="space-y-4 text-start">
      {/* Top Breadcrumb & Preview */}
      <div className="flex items-center justify-between gap-2">
        <Link
          href="/admin"
          className="inline-flex min-h-[44px] items-center gap-1.5 text-xs sm:text-sm font-bold text-rose-dark hover:underline transition-colors"
        >
          <ArrowRight className="h-4 w-4 icon-mirror" />
          <span>{AR_STRINGS.adminBackToDashboard}</span>
        </Link>

        {/* Preview Button (Dynamic: Public page when published, Draft preview when draft) */}
        <Link
          href={procedure.published ? `/procedures/${procedure.slug}` : `/admin/preview/${procedure.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="squircle-pill inline-flex min-h-[44px] items-center gap-2 rounded-pill border border-border bg-white px-4 py-1.5 text-xs font-bold text-navy transition-colors hover:border-rose-dark hover:text-rose-dark"
        >
          <Eye className="h-4 w-4 text-rose-dark" />
          <span>{procedure.published ? AR_STRINGS.adminViewPublic : AR_STRINGS.adminDraftPreview}</span>
        </Link>
      </div>

      <div className="border-b border-border-subtle pb-3 text-start">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="type-h1 text-navy truncate !leading-[1.3]" style={{ lineHeight: 1.3 }}>
            <bdi dir="ltr" lang="en">
              {procedure.title}
            </bdi>
          </h1>
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
              procedure.published
                ? "border border-success/30 bg-success-surface text-success"
                : "bg-light-1 text-text-secondary border border-border-subtle"
            }`}
          >
            {procedure.published ? AR_STRINGS.adminStatusPublished : AR_STRINGS.adminStatusDraft}
          </span>
        </div>
        <p className="mt-1 text-xs text-text-secondary font-mono text-start">
          <bdi dir="ltr" lang="en" className="inline-block">/{procedure.slug}</bdi>
        </p>
      </div>

      <ProcedureEditor procedure={procedure} isNew={false} />
    </div>
  );
}
