import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AccordionSection } from "@/components/AccordionSection";
import { Checklist } from "@/components/Checklist";
import { EquipmentList } from "@/components/EquipmentList";
import { VideoPlayerPlaceholder } from "@/components/VideoPlayerPlaceholder";
import { CreativeCommonsNotice } from "@/components/CreativeCommonsNotice";
import { getPublicImageUrl } from "@/lib/images/url";
import {
  getProcedureBySlug,
  getSiteSettings,
} from "@/lib/data";
import { AR_STRINGS } from "@/messages/ar";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const procedure = await getProcedureBySlug(slug);
  if (!procedure) {
    notFound();
  }
  return {
    title: procedure.title,
    description: procedure.short_description || procedure.definition,
  };
}

export default async function ProcedureDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const [settings, procedure] = await Promise.all([
    getSiteSettings(),
    getProcedureBySlug(slug),
  ]);

  if (!procedure) {
    notFound();
  }

  const indications =
    procedure.list_items?.filter((i) => i.kind === "indication") || [];
  const contraindications =
    procedure.list_items?.filter((i) => i.kind === "contraindication") || [];
  const commonMistakes =
    procedure.list_items?.filter((i) => i.kind === "common_mistake") || [];
  const equipment = procedure.equipment_items || [];
  const steps = procedure.checklist_steps || [];

  return (
    <div className="flex min-h-[100dvh] flex-col" dir="ltr">
      <Header siteName={settings.site_name} logoPath={settings.logo_path} />

      {/* Navy -> Plum Procedure Hero */}
      <section className="bg-grad-hero surface-navy border-b-[3px] border-rose px-4 py-8 text-white sm:px-6 sm:py-12">
        <div className="mx-auto max-w-[70rem] space-y-6">
          <div>
            <Link
              href="/procedures"
              className="squircle-pill inline-flex min-h-[44px] items-center gap-2 border border-rose/50 bg-white/10 px-4 text-sm font-semibold text-white transition-colors hover:bg-white/15"
            >
              <ArrowLeft className="h-4 w-4 text-rose-light" aria-hidden="true" />
              <span>{AR_STRINGS.backToProcedures}</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 items-center gap-6 lg:grid-cols-12">
            <div
              dir="ltr"
              lang="en"
              className={`text-start ${
                procedure.cover_path ? "lg:col-span-7" : "lg:col-span-12"
              }`}
            >
              <h1 className="type-h1 font-latin font-bold text-white">
                <span>{procedure.title}</span>
              </h1>
              {procedure.short_description && (
                <p className="mt-3 max-w-2xl font-latin text-base leading-relaxed text-text-muted-navy sm:text-lg">
                  {procedure.short_description}
                </p>
              )}
            </div>

            {procedure.cover_path && (
              <div
                className="relative aspect-[16/10] w-full overflow-hidden rounded-[22px] border border-rose/40 bg-navy/90 shadow-card-soft lg:col-span-5"
                style={{ viewTransitionName: `procedure-cover-${procedure.slug}` }}
              >
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
        </div>
      </section>

      {/* Main Content: 7 Fixed Numbered Accordion Cards */}
      <main className="bg-grad-page flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <div className="mx-auto max-w-[70rem]">
          {/* Section List Heading with Rose Vertical Bar */}
          <div className="mb-6 flex items-center gap-3">
            <span
              className="h-7 w-1.5 rounded-full bg-rose"
              aria-hidden="true"
            />
            <h2 className="type-h2 font-bold text-navy">Procedure Sections</h2>
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
                  <p className="text-base text-text-muted">
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
                  <ul className="list-inside list-disc space-y-2 font-latin text-base leading-relaxed text-navy">
                    {indications.map((item) => (
                      <li key={item.id} className="ps-1">
                        {item.text}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-base text-text-muted">
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
                  <ul className="list-inside list-disc space-y-2 font-latin text-base leading-relaxed text-navy">
                    {contraindications.map((item) => (
                      <li key={item.id} className="ps-1">
                        {item.text}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-base text-text-muted">
                    {AR_STRINGS.sectionEmpty}
                  </p>
                )}
              </div>
            </AccordionSection>

            {/* 4. Required Equipment */}
            <AccordionSection
              number={4}
              title={AR_STRINGS.sectionEquipment}
              hashAliases={["equipment"]}
            >
              <EquipmentList items={equipment} procedureSlug={procedure.slug} />
            </AccordionSection>

            {/* 5. Procedural Checklist */}
            <AccordionSection
              number={5}
              title={AR_STRINGS.sectionChecklist}
              hashAliases={["checklist"]}
            >
              <Checklist steps={steps} procedureSlug={procedure.slug} />
            </AccordionSection>

            {/* 6. Common Errors & Complications */}
            <AccordionSection
              number={6}
              title={AR_STRINGS.sectionCommonMistakes}
              hashAliases={["common-mistakes", "mistakes"]}
              isDanger={true}
            >
              <div dir="ltr" lang="en" className="text-start">
                {commonMistakes.length > 0 ? (
                  <ul className="list-inside list-disc space-y-2 font-latin text-base leading-relaxed text-navy">
                    {commonMistakes.map((item) => (
                      <li key={item.id} className="ps-1">
                        {item.text}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-base text-text-muted">
                    {AR_STRINGS.sectionEmpty}
                  </p>
                )}
              </div>
            </AccordionSection>

            {/* 7. Clinical Demonstration Video */}
            <AccordionSection
              number={7}
              title={AR_STRINGS.sectionVideo}
              hashAliases={["video"]}
            >
              <VideoPlayerPlaceholder
                slug={procedure.slug}
                procedureId={procedure.id}
                playbackId={procedure.mux_playback_id}
                status={procedure.video_status}
                title={procedure.title}
              />
            </AccordionSection>
          </div>

          {/* Department Rights & Creative Commons Notice on Procedure Page */}
          <div className="mt-12">
            <CreativeCommonsNotice variant="card" />
          </div>
        </div>
      </main>

      <Footer
        footerText={settings.footer_text}
        siteName={settings.site_name}
      />
    </div>
  );
}
