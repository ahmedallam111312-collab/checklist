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
  title: "تعديل الإجراء — ProfNurse",
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
      <div className="flex items-center justify-between">
        <Link
          href="/admin"
          className="inline-flex min-h-[44px] items-center gap-1.5 text-xs sm:text-sm font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)]"
        >
          <ArrowRight className="h-4 w-4 icon-mirror" />
          <span>{AR_STRINGS.adminBackToDashboard}</span>
        </Link>

        {/* Preview Button (Dynamic: Public page when published, Draft preview when draft) */}
        <Link
          href={procedure.published ? `/procedures/${procedure.slug}` : `/admin/preview/${procedure.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-[44px] items-center gap-2 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-1.5 text-xs font-semibold text-[var(--color-text)] transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
        >
          <Eye className="h-4 w-4" />
          <span>{procedure.published ? AR_STRINGS.adminViewPublic : AR_STRINGS.adminDraftPreview}</span>
        </Link>
      </div>

      <div className="border-b border-[var(--color-border-subtle)] pb-3 text-start">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="type-h1 text-[var(--color-text)] truncate !leading-[1.3]" style={{ lineHeight: 1.3 }}>
            <bdi dir="ltr" lang="en">
              {procedure.title}
            </bdi>
          </h1>
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              procedure.published
                ? "bg-[var(--color-primary)]/20 text-[var(--color-primary)]"
                : "bg-[var(--color-surface-sunken)] text-[var(--color-text-muted)] border border-[var(--color-border-subtle)]"
            }`}
          >
            {procedure.published ? AR_STRINGS.adminStatusPublished : AR_STRINGS.adminStatusDraft}
          </span>
        </div>
        <p className="mt-1 text-xs text-[var(--color-text-muted)] font-mono text-start">
          <bdi dir="ltr" lang="en" className="inline-block">/{procedure.slug}</bdi>
        </p>
      </div>

      <ProcedureEditor procedure={procedure} isNew={false} />
    </div>
  );
}
