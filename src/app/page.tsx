import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/Logo";
import { getSiteSettings } from "@/lib/data";
import { BRAND } from "@/config/brand";
import { AR_STRINGS } from "@/messages/ar";

export const metadata: Metadata = {
  title: `${BRAND.name} — ${BRAND.tagline}`,
  description: BRAND.heroDescription,
};

export default async function CoverPage() {
  const settings = await getSiteSettings();
  const ctaLabel = settings.splash_cta || AR_STRINGS.start;

  return (
    <main className="bg-grad-page flex min-h-[100dvh] flex-col items-center justify-center px-4 py-10 text-center">
      {/* Real accessible page title & concise description for SEO / screen readers */}
      <h1 className="sr-only">{settings.site_name || BRAND.name}</h1>
      <p className="sr-only">{settings.hero_description || BRAND.heroDescription}</p>

      {/* Centered White Rounded Cover Card (reference 01-cover.jpg) */}
      <div className="surface-light squircle-card flex w-[92%] max-w-[520px] flex-col items-center justify-center bg-white px-8 py-12 shadow-card-soft sm:px-12 sm:py-16">
        <Logo
          variant="light"
          name={settings.site_name || BRAND.name}
          logoPath={settings.logo_path}
          width={929}
          height={474}
          priority
          sizes="(max-width: 560px) 80vw, 380px"
          className="h-auto w-full max-w-[360px]"
        />
      </div>

      {/* Primary Rose CTA Pill Button with Navy Text below card */}
      <div className="mt-8 w-[92%] max-w-[240px]">
        <Link
          href="/home"
          data-testid="cover-start-cta"
          className="btn-rose-cta squircle-pill type-button flex min-h-[54px] w-full items-center justify-center gap-3 px-8 text-lg font-bold text-navy"
        >
          <span>{ctaLabel}</span>
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        </Link>
      </div>
    </main>
  );
}
