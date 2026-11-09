import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AccordionSection } from "@/components/AccordionSection";
import { Checklist } from "@/components/Checklist";
import { EquipmentList } from "@/components/EquipmentList";
import { VideoPlayerPlaceholder } from "@/components/VideoPlayerPlaceholder";
import { getProcedureBySlug, getSiteSettings, getPublishedProcedures } from "@/lib/data";
import { AR_STRINGS } from "@/messages/ar";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const dynamic = "force-dynamic";

export default async function ProcedureDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const [settings, procedure] = await Promise.all([
    getSiteSettings(),
    getProcedureBySlug(slug),
  ]);

  if (!procedure) {
    notFound();
  }

  // Filter list items by kind
  const indications = procedure.list_items?.filter((i) => i.kind === "indication") || [];
  const contraindications = procedure.list_items?.filter((i) => i.kind === "contraindication") || [];
  const commonMistakes = procedure.list_items?.filter((i) => i.kind === "common_mistake") || [];
  const equipment = procedure.equipment_items || [];
  const steps = procedure.checklist_steps || [];

  return (
    <div className="flex min-h-[100svh] flex-col">
      <Header siteName={settings.site_name} logoPath={settings.logo_path} />

      <main className="flex-1 px-4 py-6 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-[70rem]">
          {/* Back Navigation Button */}
          <div className="mb-6">
            <Link
              href="/procedures"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-md text-sm font-semibold text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-primary)] active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus-ring)]"
            >
              <ArrowRight className="h-4 w-4 icon-mirror" aria-hidden="true" />
              <span>{AR_STRINGS.backToProcedures}</span>
            </Link>
          </div>

          {/* Desktop 2-column layout (Content + Sticky Video) / Mobile 1-column layout */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            {/* Main Content Column (Sections 1 through 6) */}
            <div className="space-y-4 lg:col-span-7 text-start">
              {/* Procedure Title Block: full-width, left-aligned (English LTR) */}
              <div className="mb-6 border-b border-[var(--color-border-subtle)] pb-6 w-full">
                <div dir="ltr" lang="en" className="w-full text-left">
                  <h1 className="type-h1 text-[var(--color-text)]">
                    <bdi dir="ltr" lang="en">{procedure.title}</bdi>
                  </h1>
                  {procedure.short_description && (
                    <p className="mt-2 type-body text-[var(--color-text-secondary)]">
                      {procedure.short_description}
                    </p>
                  )}
                </div>
              </div>

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

              {/* 6. Common Mistakes (Danger Styling) */}
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

              {/* Mobile-only Section 7: Video (On mobile it is the last section) */}
              <div className="lg:hidden">
                <AccordionSection number={7} title={AR_STRINGS.sectionVideo}>
                  <VideoPlayerPlaceholder
                    playbackId={procedure.mux_playback_id}
                    status={procedure.video_status}
                    title={procedure.title}
                  />
                </AccordionSection>
              </div>
            </div>

            {/* Desktop-only Sticky Column for Video (Section 7) */}
            <div className="hidden lg:col-span-5 lg:block">
              <div className="sticky top-[72px] space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--color-primary)] text-xs font-semibold text-[var(--color-on-primary)] tabular-nums">
                    7
                  </span>
                  <h2 className="text-base font-semibold text-[var(--color-text)]">
                    {AR_STRINGS.sectionVideo}
                  </h2>
                </div>
                <VideoPlayerPlaceholder
                  playbackId={procedure.mux_playback_id}
                  status={procedure.video_status}
                  title={procedure.title}
                />
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer footerText={settings.footer_text} />
    </div>
  );
}
