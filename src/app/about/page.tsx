import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  GraduationCap,
  ShieldCheck,
  Award,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Video,
  HeartPulse,
  Users,
  Compass,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { InstitutionalBadges } from "@/components/InstitutionalBadges";
import { CreativeCommonsNotice } from "@/components/CreativeCommonsNotice";
import { getSiteSettings } from "@/lib/data";
import { BRAND } from "@/config/brand";

export const metadata: Metadata = {
  title: "About",
  description:
    "Standardized clinical nursing procedure reference platform by the Department of Critical Care and Emergency Nursing, Faculty of Nursing, Cairo University.",
};

export default async function AboutPage() {
  const settings = await getSiteSettings();

  return (
    <div className="flex min-h-[100dvh] flex-col" dir="ltr">
      <Header siteName={settings.site_name} logoPath={settings.logo_path} />

      {/* Navy -> Plum About Hero */}
      <section className="bg-grad-hero surface-navy border-b-[3px] border-rose px-4 py-10 text-white sm:px-6 sm:py-14">
        <div className="mx-auto max-w-[70rem] space-y-4 text-start">
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-rose/30 bg-white/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-rose-light backdrop-blur-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-light animate-pulse" aria-hidden="true" />
              <span>Cairo University • Faculty of Nursing</span>
            </div>
            <span className="rounded-pill border border-rose/40 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-rose-light">
              Official Academic Platform
            </span>
          </div>

          <h1 className="type-display font-bold text-white leading-tight">
            About <span className="text-rose-light">{settings.site_name || BRAND.name}</span>
          </h1>

          <p className="type-body max-w-3xl leading-relaxed text-text-muted-navy">
            An official evidence-based digital reference platform developed by the{" "}
            <strong className="font-semibold text-white">
              Department of Critical Care and Emergency Nursing, Faculty of Nursing, Cairo University
            </strong>
            , dedicated to standardizing clinical procedures, reinforcing patient safety, and enhancing the practical training of nursing students and healthcare professionals.
          </p>
        </div>
      </section>

      {/* Main Content: Professional Boxed Bento-Grid Architecture */}
      <main className="bg-grad-page flex-1 px-4 py-10 sm:px-6 lg:py-14">
        <div className="mx-auto max-w-[70rem] space-y-8">
          {/* Box 1: Institutional Governance & Accreditation */}
          <section
            aria-label="Institutional Governance & Accreditation"
            className="surface-light squircle-card border border-border-subtle bg-white p-6 shadow-card-soft sm:p-8"
          >
            <InstitutionalBadges variant="about" />

            <div className="mt-6 grid grid-cols-1 gap-4 border-t border-border-subtle pt-6 md:grid-cols-3">
              <div className="rounded-2xl border border-border-subtle/80 bg-light-1/60 p-4">
                <div className="flex items-center gap-2 text-rose-dark">
                  <GraduationCap className="h-5 w-5" aria-hidden="true" />
                  <h4 className="font-bold text-navy text-sm">Cairo University</h4>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-text-secondary">
                  Founded in 1908, Cairo University is Egypt&apos;s premier higher education institution, leading academic excellence and medical research across the region.
                </p>
              </div>

              <div className="rounded-2xl border border-border-subtle/80 bg-light-1/60 p-4">
                <div className="flex items-center gap-2 text-rose-dark">
                  <Award className="h-5 w-5" aria-hidden="true" />
                  <h4 className="font-bold text-navy text-sm">Faculty of Nursing</h4>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-text-secondary">
                  Accredited by the National Authority for Quality Assurance and Accreditation of Education (NAQAAE), establishing top national standards for clinical competencies.
                </p>
              </div>

              <div className="rounded-2xl border border-border-subtle/80 bg-light-1/60 p-4">
                <div className="flex items-center gap-2 text-rose-dark">
                  <HeartPulse className="h-5 w-5" aria-hidden="true" />
                  <h4 className="font-bold text-navy text-sm">Department Leadership</h4>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-text-secondary">
                  Specialized faculty spearheading curriculum development, bedside training, and clinical protocol standardization in Emergency and Intensive Care Nursing.
                </p>
              </div>
            </div>
          </section>

          {/* Box 2: Department Academic Mission & Vision */}
          <section
            aria-label="Department Vision & Mission"
            className="grid grid-cols-1 gap-6 md:grid-cols-2"
          >
            {/* Box 2A: Vision */}
            <div className="surface-light squircle-card border border-border-subtle bg-white p-6 shadow-card-soft sm:p-8">
              <div className="mb-4 flex items-center gap-3 text-rose-dark">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-pill bg-light-1">
                  <Compass className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="type-h3 font-bold text-navy">Department Vision</h2>
                  <p className="text-xs text-text-secondary">Future-Facing Educational Leadership</p>
                </div>
              </div>
              <p className="text-sm leading-relaxed text-text-secondary">
                To serve as the benchmark digital center of excellence in critical care and emergency nursing education across Egypt and the Middle East, preparing highly competent, confident nursing professionals who deliver safe, compassionate, and evidence-informed patient care in acute hospital settings.
              </p>
            </div>

            {/* Box 2B: Mission */}
            <div className="surface-light squircle-card border border-border-subtle bg-white p-6 shadow-card-soft sm:p-8">
              <div className="mb-4 flex items-center gap-3 text-rose-dark">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-pill bg-light-1">
                  <BookOpen className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="type-h3 font-bold text-navy">Department Mission</h2>
                  <p className="text-xs text-text-secondary">Evidence-Based Clinical Empowerment</p>
                </div>
              </div>
              <p className="text-sm leading-relaxed text-text-secondary">
                To standardize, disseminate, and continuously update clinical nursing procedure protocols through interactive technology, structured checklists, and instructional multimedia, bridging the gap between theoretical knowledge and real-world clinical execution in emergency departments and intensive care units.
              </p>
            </div>
          </section>

          {/* Box 3: Core Educational Objectives (4 Modular Cards) */}
          <section aria-label="Core Educational Objectives" className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="h-7 w-1.5 rounded-full bg-rose" aria-hidden="true" />
              <h2 className="type-h2 font-bold text-navy">Core Educational Objectives</h2>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {/* Box 3A */}
              <div className="squircle-card border border-border-subtle bg-white p-5 shadow-card-soft flex flex-col justify-between">
                <div>
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-pill bg-light-1 text-rose-dark">
                    <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <h3 className="font-bold text-navy text-sm">
                    1. Procedural Standardization
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-text-secondary">
                    Eliminating unverified variations in bedside performance by establishing unified, evidence-based sequences for every clinical procedure.
                  </p>
                </div>
                <div className="mt-4 border-t border-border-subtle pt-2 text-[11px] font-semibold text-rose-dark">
                  Unified Clinical Standards
                </div>
              </div>

              {/* Box 3B */}
              <div className="squircle-card border border-border-subtle bg-white p-5 shadow-card-soft flex flex-col justify-between">
                <div>
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-pill bg-rose-light/30 text-critical">
                    <AlertTriangle className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <h3 className="font-bold text-navy text-sm">
                    2. Patient Safety & Error Prevention
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-text-secondary">
                    Explicitly identifying critical sentinel steps and common clinical pitfalls to protect patients from adverse events and procedural complications.
                  </p>
                </div>
                <div className="mt-4 border-t border-border-subtle pt-2 text-[11px] font-semibold text-critical">
                  Zero Preventable Harm
                </div>
              </div>

              {/* Box 3C */}
              <div className="squircle-card border border-border-subtle bg-white p-5 shadow-card-soft flex flex-col justify-between">
                <div>
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-pill bg-light-1 text-rose-dark">
                    <Video className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <h3 className="font-bold text-navy text-sm">
                    3. Visual Video Demonstrations
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-text-secondary">
                    Reinforcing cognitive retention with high-quality demonstration videos showing exact psychomotor handling of specialized ICU instruments.
                  </p>
                </div>
                <div className="mt-4 border-t border-border-subtle pt-2 text-[11px] font-semibold text-rose-dark">
                  High-Fidelity Media
                </div>
              </div>
            </div>
          </section>

          {/* Box 4: The 7-Section Canonical Clinical Architecture */}
          <section
            aria-label="7 Canonical Sections Framework"
            className="surface-light squircle-card border border-border-subtle bg-white p-6 shadow-card-soft sm:p-8"
          >
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle pb-4">
              <div>
                <h2 className="type-h2 font-bold text-navy">
                  The 7-Section Clinical Architecture
                </h2>
                <p className="text-xs text-text-secondary">
                  Every procedure on Critical Ease is rigorously structured in an immutable 7-part pedagogical framework:
                </p>
              </div>
              <span className="rounded-pill border border-navy/20 bg-navy/5 px-3 py-1 text-xs font-bold text-navy">
                Standard Framework
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="flex items-start gap-3 rounded-xl border border-border-subtle/80 bg-light-1/50 p-3.5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-navy text-xs font-bold text-white">
                  1
                </span>
                <div>
                  <h4 className="text-xs font-bold text-navy">Definition & Overview</h4>
                  <p className="text-[11px] text-text-secondary">Clinical scope, anatomy, and theoretical foundation.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-border-subtle/80 bg-light-1/50 p-3.5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-navy text-xs font-bold text-white">
                  2
                </span>
                <div>
                  <h4 className="text-xs font-bold text-navy">Indications</h4>
                  <p className="text-[11px] text-text-secondary">Clinical scenarios where the procedure is required.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-border-subtle/80 bg-light-1/50 p-3.5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-navy text-xs font-bold text-white">
                  3
                </span>
                <div>
                  <h4 className="text-xs font-bold text-navy">Contraindications</h4>
                  <p className="text-[11px] text-text-secondary">Absolute and relative situations where intervention is hazardous.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-border-subtle/80 bg-light-1/50 p-3.5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-navy text-xs font-bold text-white">
                  4
                </span>
                <div>
                  <h4 className="text-xs font-bold text-navy">Required Equipment</h4>
                  <p className="text-[11px] text-text-secondary">Categorized supplies with photos and preparation status.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-border-subtle/80 bg-light-1/50 p-3.5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-navy text-xs font-bold text-white">
                  5
                </span>
                <div>
                  <h4 className="text-xs font-bold text-navy">Procedural Checklist</h4>
                  <p className="text-[11px] text-text-secondary">Step-by-step checklist with flagged critical safety steps.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-border-subtle/80 bg-light-1/50 p-3.5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-critical text-xs font-bold text-white">
                  6
                </span>
                <div>
                  <h4 className="text-xs font-bold text-navy">Common Errors</h4>
                  <p className="text-[11px] text-text-secondary">Potential clinical complications and preventative measures.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-border-subtle/80 bg-light-1/50 p-3.5 sm:col-span-2 lg:col-span-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-navy text-xs font-bold text-white">
                  7
                </span>
                <div>
                  <h4 className="text-xs font-bold text-navy">Clinical Video Demonstration</h4>
                  <p className="text-[11px] text-text-secondary">Professional video demonstrations showing aseptic techniques and step execution.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Box 5: Academic Board & Department Supervision */}
          <section
            aria-label="Academic Board & Supervision"
            className="surface-light squircle-card border border-border-subtle bg-white p-6 shadow-card-soft sm:p-8"
          >
            <div className="mb-4 flex items-center gap-3 text-rose-dark">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-pill bg-light-1">
                <Users className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h2 className="type-h2 font-bold text-navy">Academic & Clinical Oversight</h2>
                <p className="text-xs text-text-secondary">Faculty Editorial Committee</p>
              </div>
            </div>

            <p className="text-sm leading-relaxed text-text-secondary">
              All checklists, definitions, equipment guidelines, and procedural steps are authored, vetted, and supervised by the faculty members of the <strong className="font-semibold text-navy">Department of Critical Care and Emergency Nursing, Faculty of Nursing, Cairo University</strong>. Content is reviewed periodically to reflect international clinical practice guidelines, hospital accreditation requirements, and current evidence-based literature.
            </p>
          </section>

          {/* Box 6: Creative Commons Licensing & Department Rights Everywhere */}
          <section aria-label="Intellectual Property & Licensing">
            <CreativeCommonsNotice variant="card" />
          </section>

          {/* Box 7: Clinical & Educational Disclaimer */}
          <section
            aria-label="Clinical Disclaimer"
            className="surface-light squircle-card border border-warning/40 bg-warning-surface p-6 shadow-sm sm:p-8"
          >
            <div className="mb-3 flex items-center gap-3 text-warning">
              <ShieldCheck className="h-5 w-5 shrink-0" aria-hidden="true" />
              <h2 className="type-h3 font-bold text-navy">
                Clinical & Educational Disclaimer
              </h2>
            </div>
            <p className="text-xs leading-relaxed text-navy sm:text-sm">
              {BRAND.footerDisclaimer} This platform is designed solely for academic study, skill acquisition, and training reference. Bedside clinical interventions must always be performed in accordance with authorized institutional protocols, physician directives, and direct clinical supervision.
            </p>
          </section>

          {/* Navigation Back Button */}
          <div className="flex justify-start pt-2">
            <Link
              href="/procedures"
              className="btn-rose-cta squircle-pill type-button inline-flex min-h-[48px] items-center justify-center gap-3 px-8 text-navy font-bold"
            >
              <ArrowLeft className="h-5 w-5" aria-hidden="true" />
              <span>Back to Procedures Library</span>
            </Link>
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
