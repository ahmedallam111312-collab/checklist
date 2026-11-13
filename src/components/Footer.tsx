import React from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { InstitutionalBadges } from "@/components/InstitutionalBadges";
import { CreativeCommonsNotice } from "@/components/CreativeCommonsNotice";
import { BRAND } from "@/config/brand";
import { AR_STRINGS } from "@/messages/ar";

interface FooterProps {
  footerText?: string;
  siteName?: string;
}

export function Footer({ footerText, siteName = BRAND.name }: FooterProps) {
  return (
    <footer className="surface-navy mt-auto border-t-[3px] border-rose bg-navy py-12 text-center text-white">
      <div className="mx-auto max-w-[70rem] space-y-6 px-4 sm:px-6">
        {/* Institutional Affiliation & Logos on Every Page */}
        <InstitutionalBadges variant="footer" />

        {/* Critical Ease Logo */}
        <div className="flex justify-center pt-2">
          <Link
            href="/"
            aria-label={siteName}
            className="inline-flex min-h-[44px] items-center justify-center rounded-pill px-2"
          >
            <Logo
              variant="reversed"
              name={siteName}
              width={180}
              height={92}
              className="h-auto w-[150px]"
            />
          </Link>
        </div>

        {/* Navigation Links in English */}
        <nav
          aria-label="Footer Navigation"
          className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm font-semibold"
        >
          <Link
            href="/home"
            className="inline-flex min-h-[44px] items-center rounded-pill px-3 text-rose-light transition-colors hover:text-white"
          >
            {AR_STRINGS.home}
          </Link>
          <span aria-hidden="true" className="text-rose/80">
            •
          </span>
          <Link
            href="/procedures"
            className="inline-flex min-h-[44px] items-center rounded-pill px-3 text-rose-light transition-colors hover:text-white"
          >
            {AR_STRINGS.libraryTitle}
          </Link>
          <span aria-hidden="true" className="text-rose/80">
            •
          </span>
          <Link
            href="/about"
            className="inline-flex min-h-[44px] items-center rounded-pill px-3 text-rose-light transition-colors hover:text-white"
          >
            {AR_STRINGS.navAbout}
          </Link>
        </nav>

        {/* Educational Disclaimer */}
        <p className="mx-auto max-w-2xl text-xs leading-relaxed text-text-muted-navy">
          {BRAND.footerDisclaimer}
        </p>

        {/* Everywhere: Department Rights & Creative Commons Notice */}
        <CreativeCommonsNotice variant="footer" />

        {/* Final Copyright Line */}
        <p className="pt-2 text-xs font-medium text-text-muted-navy">
          <span>{BRAND.copyright}</span>
        </p>
      </div>
    </footer>
  );
}
