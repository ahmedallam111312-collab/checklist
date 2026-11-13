import React from "react";
import Link from "next/link";
import Image from "next/image";
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
import { getPublicImageUrl } from "@/lib/images/url";
import { AR_STRINGS } from "@/messages/ar";

interface PreviewPageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "معاينة الإجراء | Critical Ease",
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
        className="squircle-tile rounded-tile border-2 border-critical bg-critical-surface p-3.5 text-sm font-bold text-navy flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-card-soft"
      >
        <div className="flex items-center gap-2.5 text-critical">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <span className="text-navy">
            {AR_STRINGS.adminDraftBanner}:{" "}
            <bdi dir="ltr" lang="en">
              {procedure.title}
            </bdi>
          </span>
        </div>

        <Link
          href={`/admin/procedures/${procedure.id}`}
          className="squircle-pill inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-pill bg-white px-4 py-2 text-xs font-bold text-navy border border-border hover:border-rose-dark hover:text-rose-dark transition-colors shrink-0"
        >
          <Edit3 className="h-4 w-4 text-rose-dark" />
          <span>العودة للتعديل</span>
        </Link>
      </div>

      {/* Navy -> Plum Hero Card matching Public Procedure Page */}
      <section className="surface-navy squircle-card bg-grad-hero overflow-hidden rounded-card border-b-[3px] border-rose p-6 sm:p-8 text-white shadow-card-soft">
        <div className="grid grid-cols-1 items-center gap-6 lg:grid-cols-12">
          <div
            dir="ltr"
            lang="en"
            className={`text-left ${
              procedure.cover_path ? "lg:col-span-7" : "lg:col-span-12"
            }`}
          >
            <h1 className="type-h1 font-latin font-bold text-white">
              <bdi dir="ltr" lang="en">
                {procedure.title}
              </bdi>
            </h1>
            {procedure.short_description && (
              <p className="mt-3 max-w-2xl font-latin text-base leading-relaxed text-text-muted-navy sm:text-lg">
                {procedure.short_description}
              </p>
            )}
          </div>

          {procedure.cover_path && (
            <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[22px] border border-rose/40 bg-navy/90 shadow-card-soft lg:col-span-5">
              <Image
                src={getPublicImageUrl(procedure.cover_path) || procedure.cover_path}
                alt={procedure.cover_alt || procedure.title}
                fill
                priority
                placeholder={procedure.blur_data_url ? "blur" : "empty"}
                blurDataURL={procedure.blur_data_url || undefined}
                sizes="(max-width: 1024px) 100vw, 440px"
                className="object-cover"
              />
            </div>
          )}
        </div>
      </section>

      {/* Main Content: 7 Fixed Numbered Accordion Cards (Video Last) */}
      <div className="text-start">
        <div className="mb-6 flex items-center gap-3">
          <span className="h-7 w-1.5 rounded-full bg-rose" aria-hidden="true" />
          <h2 className="type-h2 font-bold text-navy">الأقسام</h2>
        </div>

        <div className="space-y-4">
          {/* 1. Definition */}
          <AccordionSection
            number={1}
            title={AR_STRINGS.sectionDefinition}
            hashAliases={["definition"]}
          >
            <div dir="ltr" lang="en" className="text-start">
              {procedure.definition ? (
                <p className="max-w-[65ch] font-latin text-base leading-relaxed text-navy">
                  {procedure.definition}
                </p>
              ) : (
                <p className="text-sm text-text-muted font-arabic" dir="rtl" lang="ar">
                  {AR_STRINGS.sectionEmpty}
                </p>
              )}
            </div>
          </AccordionSection>

          {/* 2. Indications */}
          <AccordionSection
            number={2}
            title={AR_STRINGS.sectionIndications}
            hashAliases={["indications"]}
          >
            <div dir="ltr" lang="en" className="text-start">
              {indications.length > 0 ? (
                <ul className="space-y-2 list-disc list-inside font-latin text-base leading-relaxed text-navy">
                  {indications.map((item) => (
                    <li key={item.id} className="ps-1">
                      {item.text}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-text-muted font-arabic" dir="rtl" lang="ar">
                  {AR_STRINGS.sectionEmpty}
                </p>
              )}
            </div>
          </AccordionSection>

          {/* 3. Contraindications */}
          <AccordionSection
            number={3}
            title={AR_STRINGS.sectionContraindications}
            hashAliases={["contraindications"]}
          >
            <div dir="ltr" lang="en" className="text-start">
              {contraindications.length > 0 ? (
                <ul className="space-y-2 list-disc list-inside font-latin text-base leading-relaxed text-navy">
                  {contraindications.map((item) => (
                    <li key={item.id} className="ps-1">
                      {item.text}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-text-muted font-arabic" dir="rtl" lang="ar">
                  {AR_STRINGS.sectionEmpty}
                </p>
              )}
            </div>
          </AccordionSection>

          {/* 4. Equipment */}
          <AccordionSection
            number={4}
            title={AR_STRINGS.sectionEquipment}
            hashAliases={["equipment"]}
          >
            <EquipmentList items={equipment} procedureSlug={procedure.slug} />
          </AccordionSection>

          {/* 5. Checklist (Open by default) */}
          <AccordionSection
            number={5}
            title={AR_STRINGS.sectionChecklist}
            hashAliases={["checklist"]}
            defaultOpen={true}
          >
            <Checklist steps={steps} procedureSlug={procedure.slug} />
          </AccordionSection>

          {/* 6. Common Mistakes */}
          <AccordionSection
            number={6}
            title={AR_STRINGS.sectionCommonMistakes}
            hashAliases={["common-mistakes", "mistakes"]}
            isDanger={true}
          >
            <div dir="ltr" lang="en" className="text-start">
              {commonMistakes.length > 0 ? (
                <ul className="space-y-2 list-disc list-inside font-latin text-base leading-relaxed text-navy">
                  {commonMistakes.map((item) => (
                    <li key={item.id} className="ps-1">
                      {item.text}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-text-muted font-arabic" dir="rtl" lang="ar">
                  {AR_STRINGS.sectionEmpty}
                </p>
              )}
            </div>
          </AccordionSection>

          {/* 7. Video (Last) */}
          <AccordionSection
            number={7}
            title={AR_STRINGS.sectionVideo}
            hashAliases={["video"]}
            defaultOpen={true}
          >
            <VideoPlayerPlaceholder
              slug={procedure.slug}
              procedureId={procedure.id}
              playbackId={procedure.mux_playback_id}
              status={procedure.video_status}
              title={procedure.title}
              isDraftPreview={true}
            />
          </AccordionSection>
        </div>
      </div>
    </div>
  );
}
