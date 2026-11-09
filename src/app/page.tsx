import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/Logo";
import { getSiteSettings } from "@/lib/data";

export default async function CoverPage() {
  const settings = await getSiteSettings();

  return (
    <main className="flex min-h-[100svh] flex-col items-center justify-center p-6 text-center">
      <div className="flex flex-col items-center max-w-md w-full">
        {/* Large Logo Mark (96px) above large name */}
        <div className="mb-6 flex flex-col items-center gap-4">
          <Logo
            name={settings.site_name}
            logoPath={settings.logo_path}
            size={96}
            nameClassName="text-3xl sm:text-4xl font-semibold tracking-tight"
            className="flex-col gap-4"
          />
        </div>

        {/* Tagline wrapped in <bdi dir="ltr" lang="en"> to prevent period flipping */}
        <p className="font-mono text-sm uppercase tracking-widest text-[var(--color-primary)] mb-8">
          <bdi dir="ltr" lang="en">
            {settings.tagline}
          </bdi>
        </p>

        {/* Description / Subtext */}
        <p className="text-base text-[var(--color-text-secondary)] leading-relaxed mb-10 max-w-sm">
          {settings.hero_description}
        </p>

        {/* Start Button */}
        <Link
          href="/home"
          className="inline-flex min-h-[48px] w-full sm:w-auto items-center justify-center gap-3 rounded-md bg-[var(--color-primary)] px-8 text-base font-semibold text-[var(--color-on-primary)] shadow-md transition-all hover:bg-[var(--color-primary-hover)] active:scale-95 active:bg-[var(--color-primary-pressed)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus-ring)]"
        >
          <span>{settings.splash_cta}</span>
          <ArrowLeft className="h-5 w-5 icon-mirror" aria-hidden="true" />
        </Link>
      </div>
    </main>
  );
}
