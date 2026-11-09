import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { getSiteSettings, getPublishedProcedures } from "@/lib/data";
import { AR_STRINGS, formatArabicPlural } from "@/messages/ar";

export default async function HomePage() {
  const [settings, procedures] = await Promise.all([
    getSiteSettings(),
    getPublishedProcedures(),
  ]);

  const procedureCount = procedures.length;

  return (
    <div className="flex min-h-[100svh] flex-col">
      <Header siteName={settings.site_name} logoPath={settings.logo_path} />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b border-[var(--color-border-subtle)] bg-gradient-to-b from-[var(--color-background)] to-[var(--color-surface)]/40 px-4 py-12 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-[70rem]">
            <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
              {/* Text Column */}
              <div className="lg:col-span-7 text-start">
                <span className="mb-3 inline-block font-mono text-xs font-semibold tracking-wider uppercase text-[var(--color-primary)]">
                  {settings.hero_eyebrow}
                </span>

                <h1 className="type-display text-[var(--color-text)] mb-4">
                  {(() => {
                    const title = settings.hero_title;
                    const name = settings.site_name;
                    if (title.includes(name)) {
                      const [before, after] = title.split(name);
                      return (
                        <>
                          {before}
                          <bdi dir="ltr" lang="en" className="inline-block">
                            {name === "ProfNurse" ? (
                              <>
                                <span className="text-[var(--color-text)]">Prof</span>
                                <span className="text-[var(--color-primary)]">Nurse</span>
                              </>
                            ) : (
                              <span className="text-[var(--color-primary)]">{name}</span>
                            )}
                          </bdi>
                          {after}
                        </>
                      );
                    }
                    return title;
                  })()}
                </h1>

                <p className="type-body text-[var(--color-text-secondary)] mb-8 max-w-2xl">
                  {settings.hero_description}
                </p>

                <div>
                  <Link
                    href="/procedures"
                    className="type-button inline-flex min-h-[48px] items-center justify-center gap-3 rounded-md bg-[var(--color-primary)] px-6 text-[var(--color-on-primary)] shadow-md transition-all hover:bg-[var(--color-primary-hover)] active:scale-95 active:bg-[var(--color-primary-pressed)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus-ring)]"
                  >
                    <span>{settings.hero_cta}</span>
                    <ArrowLeft className="h-5 w-5 icon-mirror" aria-hidden="true" />
                  </Link>
                </div>
              </div>

              {/* Purely Decorative Graphic: ECG Waveform Only (No text, no numbers, aria-hidden) */}
              <div className="lg:col-span-5 flex justify-center" aria-hidden="true">
                <div className="relative w-full max-w-sm rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-xl">
                  <div className="relative flex h-44 items-center justify-center rounded-lg bg-[var(--color-surface-sunken)] p-4 overflow-hidden border border-[var(--color-border-subtle)]">
                    <svg
                      viewBox="0 0 300 80"
                      className="w-full h-full text-[var(--color-primary)]"
                      aria-hidden="true"
                    >
                      <path
                        d="M0 40 H60 L75 15 L95 65 L115 30 L125 45 L135 40 H200 L215 15 L235 65 L255 30 L265 45 L275 40 H300"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Row Section */}
        <section className="border-b border-[var(--color-border-subtle)] bg-[var(--color-surface)] py-10 px-4 sm:px-6">
          <div className="mx-auto max-w-[70rem]">
            <div className="grid grid-cols-1 divide-y divide-[var(--color-border)] sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:divide-x-reverse">
              {/* Stat 1: Procedures Count (Computed with Arabic Plural Awareness - T9e) */}
              <div className="flex flex-col items-center justify-center p-6 text-center">
                <span className="type-display tabular-nums text-[var(--color-primary)] font-mono mb-2">
                  {procedureCount}
                </span>
                <span className="type-body-sm text-[var(--color-text-secondary)]">
                  {formatArabicPlural(procedureCount, {
                    zero: "إجراء سريري",
                    one: "إجراء سريري واحد",
                    two: "إجراءان سريريان",
                    few: "إجراءات سريرية",
                    many: "إجراءً سريريًا",
                    other: "إجراء سريري",
                  })}
                </span>
              </div>

              {/* Stat 2: Fixed 7 Sections (Arabic Plural Aware - T9e) */}
              <div className="flex flex-col items-center justify-center p-6 text-center">
                <span className="type-display tabular-nums text-[var(--color-text)] font-mono mb-2">
                  7
                </span>
                <span className="type-body-sm text-[var(--color-text-secondary)]">
                  {formatArabicPlural(7, {
                    few: "أقسام لكل إجراء",
                    other: "أقسام لكل إجراء",
                  })}
                </span>
              </div>

              {/* Stat 3: Bilingual Support with <bdi dir="ltr" lang="en"> */}
              <div className="flex flex-col items-center justify-center p-6 text-center">
                <span className="type-h1 tracking-wider text-[var(--color-text)] font-mono mb-2">
                  <bdi dir="ltr" lang="en">
                    EN | AR
                  </bdi>
                </span>
                <span className="type-body-sm text-[var(--color-text-secondary)]">
                  {AR_STRINGS.statsLanguages}
                </span>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer footerText={settings.footer_text} />
    </div>
  );
}
