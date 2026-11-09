import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowRight, AlertTriangle, Edit3 } from "lucide-react";
import { requireAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/data";
import { DEMO_PROCEDURES } from "@/data/demo-data";
import { Procedure } from "@/types/database";
import { AccordionSection } from "@/components/AccordionSection";
import { Checklist } from "@/components/Checklist";
import { EquipmentList } from "@/components/EquipmentList";
import { VideoPlayerPlaceholder } from "@/components/VideoPlayerPlaceholder";
import { AR_STRINGS } from "@/messages/ar";

interface PreviewPageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "معاينة الإجراء — ProfNurse",
};

export default async function AdminDraftPreviewPage({ params }: PreviewPageProps) {
  // Enforce admin auth on preview route
  await requireAdmin();

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

  const indications = (procedure.list_items || []).filter((i) => i.kind === "indication");
  const contraindications = (procedure.list_items || []).filter((i) => i.kind === "contraindication");
  const commonMistakes = (procedure.list_items || []).filter((i) => i.kind === "common_mistake");
  const equipment = procedure.equipment_items || [];
  const steps = procedure.checklist_steps || [];

  return (
    <div className="space-y-6">
      {/* Prominent Admin Draft Banner */}
      <div
        role="status"
        className="rounded-lg border-2 border-[var(--color-critical)] bg-[var(--color-critical-surface)] p-3.5 text-center text-sm font-bold text-[var(--color-text)] flex items-center justify-between gap-3 shadow-md"
      >
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-[var(--color-critical)] shrink-0" />
          <span>
            {AR_STRINGS.adminDraftBanner}:{" "}
            <bdi dir="ltr" lang="en">
              {procedure.title}
            </bdi>
          </span>
        </div>

        <Link
          href={`/admin/procedures/${procedure.id}`}
          className="inline-flex min-h-[44px] items-center gap-1.5 rounded-md bg-[var(--color-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text)] border border-[var(--color-border)] hover:border-[var(--color-primary)]"
        >
          <Edit3 className="h-4 w-4" />
          <span>العودة للتعديل</span>
        </Link>
      </div>

      {/* Main Content Column (reusing public layout) */}
      <div className="text-start">
        <div className="mb-6 border-b border-[var(--color-border-subtle)] pb-6 w-full">
          <div dir="ltr" lang="en" className="w-full text-left">
            <h1 className="type-h1 text-[var(--color-text)]">
              {procedure.title}
            </h1>
            {procedure.short_description && (
              <p className="mt-2 type-body text-[var(--color-text-secondary)]">
                {procedure.short_description}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-7">
            {/* 1. Definition */}
            <AccordionSection number={1} title={AR_STRINGS.sectionDefinition}>
              <div dir="ltr" lang="en" className="text-start">
                {procedure.definition ? (
                  <p className="max-w-[65ch] text-base leading-relaxed text-[var(--color-text)]">
                    {procedure.definition}
                  </p>
                ) : (
                  <p className="text-sm text-[var(--color-text-muted)] font-arabic" dir="rtl" lang="ar">
                    {AR_STRINGS.sectionEmpty}
                  </p>
                )}
              </div>
            </AccordionSection>

            {/* 2. Indications */}
            <AccordionSection number={2} title={AR_STRINGS.sectionIndications}>
              <div dir="ltr" lang="en" className="text-start">
                {indications.length > 0 ? (
                  <ul className="space-y-2 list-disc list-inside text-base leading-relaxed text-[var(--color-text)]">
                    {indications.map((item) => (
                      <li key={item.id} className="ps-1">
                        {item.text}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-[var(--color-text-muted)] font-arabic" dir="rtl" lang="ar">
                    {AR_STRINGS.sectionEmpty}
                  </p>
                )}
              </div>
            </AccordionSection>

            {/* 3. Contraindications */}
            <AccordionSection number={3} title={AR_STRINGS.sectionContraindications}>
              <div dir="ltr" lang="en" className="text-start">
                {contraindications.length > 0 ? (
                  <ul className="space-y-2 list-disc list-inside text-base leading-relaxed text-[var(--color-text)]">
                    {contraindications.map((item) => (
                      <li key={item.id} className="ps-1">
                        {item.text}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-[var(--color-text-muted)] font-arabic" dir="rtl" lang="ar">
                    {AR_STRINGS.sectionEmpty}
                  </p>
                )}
              </div>
            </AccordionSection>

            {/* 4. Equipment */}
            <AccordionSection number={4} title={AR_STRINGS.sectionEquipment}>
              <EquipmentList items={equipment} procedureSlug={procedure.slug} />
            </AccordionSection>

            {/* 5. Checklist (Open by default) */}
            <AccordionSection
              number={5}
              title={AR_STRINGS.sectionChecklist}
              defaultOpen={true}
            >
              <Checklist steps={steps} procedureSlug={procedure.slug} />
            </AccordionSection>

            {/* 6. Common Mistakes */}
            <AccordionSection
              number={6}
              title={AR_STRINGS.sectionCommonMistakes}
              isDanger={true}
            >
              <div dir="ltr" lang="en" className="text-start">
                {commonMistakes.length > 0 ? (
                  <ul className="space-y-2 list-disc list-inside text-base leading-relaxed text-[var(--color-text)]">
                    {commonMistakes.map((item) => (
                      <li key={item.id} className="ps-1 text-[var(--color-text)]">
                        {item.text}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-[var(--color-text-muted)] font-arabic" dir="rtl" lang="ar">
                    {AR_STRINGS.sectionEmpty}
                  </p>
                )}
              </div>
            </AccordionSection>
          </div>

          {/* Desktop Sticky / Mobile Video section */}
          <div className="lg:col-span-5">
            <div className="sticky top-20">
              <AccordionSection number={7} title={AR_STRINGS.sectionVideo} defaultOpen={true}>
                <VideoPlayerPlaceholder />
              </AccordionSection>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
