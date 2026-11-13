import React from "react";
import Image from "next/image";

interface InstitutionalBadgesProps {
  variant?: "header" | "footer" | "hero" | "about" | "splash";
  className?: string;
  showSubtitle?: boolean;
}

export function InstitutionalBadges({
  variant = "header",
  className = "",
  showSubtitle = true,
}: InstitutionalBadgesProps) {
  if (variant === "header") {
    return (
      <div
        className={`flex items-center gap-2 ${className}`}
        title="Cairo University — Faculty of Nursing"
      >
        <div className="flex items-center gap-1.5 rounded-[12px] bg-white px-2 py-1 shadow-xs ring-1 ring-white/15 transition-opacity hover:opacity-95">
          <Image
            src="/brand/cairo-university-shield.png"
            alt="Cairo University Emblem"
            width={40}
            height={34}
            priority
            className="h-[28px] w-auto max-w-[36px] object-contain"
          />
          <div className="h-4 w-[1px] bg-gray-200" aria-hidden="true" />
          <Image
            src="/brand/faculty-nursing-cairo.png"
            alt="Faculty of Nursing Logo — Cairo University"
            width={34}
            height={34}
            priority
            className="h-[28px] w-auto max-w-[30px] object-contain"
          />
        </div>

        <div className="hidden min-[1020px]:flex flex-col text-start leading-none justify-center">
          <span className="text-[11px] font-bold text-white tracking-wide">
            Cairo University
          </span>
          <span className="text-[10px] font-medium text-rose-light mt-0.5">
            Faculty of Nursing
          </span>
        </div>
      </div>
    );
  }

  if (variant === "splash") {
    return (
      <div className={`flex flex-col items-center gap-3.5 ${className}`}>
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          {/* Cairo University Card */}
          <div className="flex items-center gap-3 rounded-2xl border border-border-subtle/80 bg-white px-4 py-2.5 shadow-card-soft transition-transform hover:-translate-y-0.5">
            <Image
              src="/brand/cairo-university-shield.png"
              alt="Cairo University Emblem"
              width={64}
              height={52}
              priority
              className="h-[44px] w-auto object-contain"
            />
            <div className="text-start leading-tight">
              <p className="text-[10px] font-bold uppercase tracking-wider text-navy/60">
                Est. 1908
              </p>
              <p className="text-xs font-bold text-navy">Cairo University</p>
            </div>
          </div>

          <div className="hidden sm:block h-8 w-[1px] bg-navy/15" aria-hidden="true" />

          {/* Faculty of Nursing Card */}
          <div className="flex items-center gap-3 rounded-2xl border border-border-subtle/80 bg-white px-4 py-2.5 shadow-card-soft transition-transform hover:-translate-y-0.5">
            <Image
              src="/brand/faculty-nursing-cairo.png"
              alt="Faculty of Nursing Logo — Cairo University"
              width={52}
              height={52}
              priority
              className="h-[44px] w-auto object-contain"
            />
            <div className="text-start leading-tight">
              <p className="text-[10px] font-bold uppercase tracking-wider text-rose-dark">
                NAQAAE Accredited
              </p>
              <p className="text-xs font-bold text-navy">Faculty of Nursing</p>
            </div>
          </div>
        </div>

        {showSubtitle && (
          <div className="text-center space-y-0.5">
            <p className="text-xs sm:text-sm font-bold tracking-wide text-navy">
              Cairo University • Faculty of Nursing
            </p>
            <p className="text-[11px] sm:text-xs font-semibold text-rose-dark">
              Department of Critical Care and Emergency Nursing
            </p>
          </div>
        )}
      </div>
    );
  }

  if (variant === "footer") {
    return (
      <div className={`flex flex-col items-center gap-4 ${className}`}>
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          {/* Cairo University Card */}
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white px-4 py-2.5 shadow-sm transition-transform hover:-translate-y-0.5">
            <Image
              src="/brand/cairo-university-shield.png"
              alt="Cairo University Emblem"
              width={64}
              height={52}
              className="h-[44px] w-auto object-contain"
            />
            <div className="text-start leading-tight">
              <p className="text-[10px] font-bold uppercase tracking-wider text-navy/60">
                Est. 1908
              </p>
              <p className="text-xs font-bold text-navy">Cairo University</p>
            </div>
          </div>

          <div className="hidden sm:block h-8 w-[1px] bg-white/20" aria-hidden="true" />

          {/* Faculty of Nursing Card */}
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white px-4 py-2.5 shadow-sm transition-transform hover:-translate-y-0.5">
            <Image
              src="/brand/faculty-nursing-cairo.png"
              alt="Faculty of Nursing Logo — Cairo University"
              width={52}
              height={52}
              className="h-[44px] w-auto object-contain"
            />
            <div className="text-start leading-tight">
              <p className="text-[10px] font-bold uppercase tracking-wider text-rose-dark">
                NAQAAE Accredited
              </p>
              <p className="text-xs font-bold text-navy">Faculty of Nursing</p>
            </div>
          </div>
        </div>

        <div className="text-center space-y-0.5">
          <p className="text-sm font-bold tracking-wide text-white">
            Cairo University • Faculty of Nursing
          </p>
          <p className="text-xs font-medium text-rose-light">
            Department of Critical Care and Emergency Nursing
          </p>
        </div>
      </div>
    );
  }

  if (variant === "about") {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Cairo University Showcase Card */}
          <div className="flex items-center gap-4 rounded-2xl border border-border-subtle bg-white p-5 shadow-sm">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-border-subtle/80 bg-light-1/60 p-2">
              <Image
                src="/brand/cairo-university-shield.png"
                alt="Cairo University Emblem"
                width={80}
                height={70}
                priority
                className="h-full w-auto object-contain"
              />
            </div>
            <div className="text-start">
              <span className="rounded-md border border-navy/15 bg-light-1 px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase text-navy">
                Est. 1908 • Cairo, Egypt
              </span>
              <h3 className="type-h3 font-bold text-navy mt-1.5">
                Cairo University
              </h3>
              <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                Egypt&apos;s premier higher education institution, leading academic and clinical medical education.
              </p>
            </div>
          </div>

          {/* Faculty of Nursing Showcase Card */}
          <div className="flex items-center gap-4 rounded-2xl border border-border-subtle bg-white p-5 shadow-sm">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-border-subtle/80 bg-light-1/60 p-2">
              <Image
                src="/brand/faculty-nursing-cairo.png"
                alt="Faculty of Nursing Logo — Cairo University"
                width={72}
                height={72}
                priority
                className="h-full w-auto object-contain"
              />
            </div>
            <div className="text-start">
              <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                NAQAAE & AHPGS Accredited
              </span>
              <h3 className="type-h3 font-bold text-navy mt-1.5">
                Faculty of Nursing
              </h3>
              <p className="text-xs text-rose-dark font-medium mt-1 leading-relaxed">
                Department of Critical Care & Emergency Nursing — Standardizing evidence-based acute care practice.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Hero variant
  return (
    <div
      className={`inline-flex items-center gap-2.5 rounded-pill border border-white/20 bg-white/10 px-3.5 py-1.5 shadow-sm backdrop-blur-xs ${className}`}
    >
      <div className="flex items-center gap-1.5 rounded-[10px] bg-white px-2 py-1 shadow-xs">
        <Image
          src="/brand/cairo-university-shield.png"
          alt="Cairo University"
          width={34}
          height={28}
          className="h-[24px] w-auto object-contain"
        />
        <div className="h-3.5 w-[1px] bg-gray-200" aria-hidden="true" />
        <Image
          src="/brand/faculty-nursing-cairo.png"
          alt="Faculty of Nursing"
          width={28}
          height={28}
          className="h-[24px] w-auto object-contain"
        />
      </div>
      <div className="text-start leading-tight">
        <p className="text-xs font-bold text-white">Cairo University</p>
        <p className="text-[11px] font-medium text-rose-light">Faculty of Nursing</p>
      </div>
    </div>
  );
}
