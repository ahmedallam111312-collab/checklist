import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Logo } from "@/components/Logo";
import { InstitutionalBadges } from "@/components/InstitutionalBadges";
import { getSiteSettings } from "@/lib/data";
import { BRAND } from "@/config/brand";
import { AR_STRINGS } from "@/messages/ar";

export const metadata: Metadata = {
  title: `${BRAND.name} — ${BRAND.tagline}`,
  description: BRAND.heroDescription,
};

export default async function CoverPage() {
  const settings = await getSiteSettings();
  const ctaLabel = settings.splash_cta || AR_STRINGS.start || "Get Started";

  return (
    <main
      dir="ltr"
      className="bg-grad-page flex min-h-[100dvh] flex-col items-center justify-center px-4 py-12 text-center"
    >
      <h1 className="sr-only">{settings.site_name || BRAND.name}</h1>
      <p className="sr-only">{settings.hero_description || BRAND.heroDescription}</p>

      {/* Institutional Badges Header on Splash */}
      <div className="mb-6 flex flex-col items-center gap-2">
        <InstitutionalBadges variant="footer" />
      </div>

      {/* Centered White Rounded Cover Card */}
      <div className="surface-light squircle-card flex w-[92%] max-w-[540px] flex-col items-center justify-center bg-white px-8 py-10 shadow-card-soft sm:px-12 sm:py-14">
        <Logo
          variant="light"
          name={settings.site_name || BRAND.name}
          logoPath={settings.logo_path}
          width={929}
          height={474}
          priority
          sizes="(max-width: 560px) 80vw, 380px"
          className="h-auto w-full max-w-[340px]"
        />

        <p className="mt-4 text-xs font-semibold tracking-wider text-rose-dark uppercase">
          {BRAND.heroEyebrow}
        </p>
      </div>

      {/* Primary Rose CTA Pill Button */}
      <div className="mt-7 w-[92%] max-w-[260px]">
        <Link
          href="/home"
          data-testid="cover-start-cta"
          className="btn-rose-cta squircle-pill type-button flex min-h-[54px] w-full items-center justify-center gap-3 px-8 text-lg font-bold text-navy"
        >
          <span>{ctaLabel}</span>
          <ArrowRight className="h-5 w-5" aria-hidden="true" />
        </Link>
      </div>
    </main>
  );
}
