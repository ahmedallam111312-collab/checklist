import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ClipboardList, Info } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { HeroScrollScene } from "@/components/HeroScrollScene";
import {
  getSiteSettings,
  getPublishedProceduresCountSafe,
} from "@/lib/data";
import { AR_STRINGS } from "@/messages/ar";

export const metadata: Metadata = {
  title: AR_STRINGS.home,
};

export default async function HomePage() {
  const [settings, procedureCount] = await Promise.all([
    getSiteSettings(),
    getPublishedProceduresCountSafe(),
  ]);

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <Header siteName={settings.site_name} logoPath={settings.logo_path} />

      <main className="flex-1">
        {/* Scroll-Driven 3D ECG Monitor Hero Scene + Integrated Stats */}
        <HeroScrollScene
          heroEyebrow={settings.hero_eyebrow}
          heroTitle={settings.hero_title}
          heroDescription={settings.hero_description}
          heroCta={settings.hero_cta}
          tagline={settings.tagline}
          siteName={settings.site_name}
          procedureCount={procedureCount}
        />

        {/* Light Quick-Access Section (gives clean vertical scroll room for Hero pin track) */}
        <section className="bg-grad-page flex min-h-[460px] items-center px-4 py-16 sm:px-6 sm:py-24">
          <div className="mx-auto w-full max-w-[70rem]">
            <div className="surface-light squircle-card mx-auto max-w-3xl border border-border-subtle bg-white p-8 text-center shadow-card-soft sm:p-12">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-pill bg-light-1 text-rose-dark">
                <ClipboardList className="h-6 w-6" aria-hidden="true" />
              </div>

              <h2 className="type-h1 text-navy">{AR_STRINGS.libraryTitle}</h2>
              <p className="type-body mx-auto mt-3 max-w-xl text-text-secondary">
                تصفح قائمة الإجراءات التمريضية المنظمة في سبعة أقسام واضحة تشمل التعريف، والأدوات، وقائمة الخطوات التفاعلية، والفيديو التوضيحي.
              </p>

              <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href="/procedures"
                  className="btn-rose-cta squircle-pill type-button inline-flex min-h-[48px] w-full items-center justify-center gap-2 px-7 text-navy sm:w-auto"
                >
                  <span>{settings.hero_cta}</span>
                  <ArrowLeft className="h-5 w-5" aria-hidden="true" />
                </Link>

                <Link
                  href="/about"
                  className="squircle-pill type-button inline-flex min-h-[48px] w-full items-center justify-center gap-2 border border-border bg-light-1 px-6 text-rose-dark transition-colors hover:bg-page sm:w-auto"
                >
                  <Info className="h-4 w-4" aria-hidden="true" />
                  <span>{AR_STRINGS.navAbout}</span>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer
        footerText={settings.footer_text}
        siteName={settings.site_name}
      />
    </div>
  );
}
