import React from "react";
import Image from "next/image";

interface InstitutionalBadgesProps {
  variant?: "header" | "footer" | "hero" | "about";
  className?: string;
}

export function InstitutionalBadges({
  variant = "header",
  className = "",
}: InstitutionalBadgesProps) {
  if (variant === "header") {
    return (
      <div
        className={`flex items-center gap-1.5 rounded-[12px] bg-white p-1 shadow-xs transition-opacity hover:opacity-95 ${className}`}
        title="Cairo University — Faculty of Nursing"
      >
        <Image
          src="/brand/cairo-university.png"
          alt="Cairo University Emblem"
          width={72}
          height={52}
          priority
          className="h-[32px] w-auto max-w-[44px] object-contain"
        />
        <div className="h-4 w-[1px] bg-gray-200" aria-hidden="true" />
        <Image
          src="/brand/faculty-nursing-cairo.png"
          alt="Faculty of Nursing Logo — Cairo University"
          width={52}
          height={52}
          priority
          className="h-[32px] w-auto max-w-[34px] object-contain"
        />
      </div>
    );
  }

  if (variant === "footer") {
    return (
      <div className={`flex flex-col items-center gap-3 ${className}`}>
        <div className="flex items-center justify-center gap-4 rounded-2xl bg-white px-4 py-2 shadow-sm">
          <Image
            src="/brand/cairo-university.png"
            alt="Cairo University Emblem"
            width={120}
            height={88}
            className="h-[46px] w-auto object-contain"
          />
          <div className="h-8 w-[1.5px] bg-gray-200" aria-hidden="true" />
          <Image
            src="/brand/faculty-nursing-cairo.png"
            alt="Faculty of Nursing Logo — Cairo University"
            width={88}
            height={88}
            className="h-[46px] w-auto object-contain"
          />
        </div>
        <div className="text-center">
          <p className="text-sm font-bold tracking-wide text-white">
            Cairo University • Faculty of Nursing
          </p>
          <p className="text-xs text-rose-light">
            Department of Critical Care and Emergency Nursing
          </p>
        </div>
      </div>
    );
  }

  if (variant === "about") {
    return (
      <div className={`flex flex-wrap items-center justify-between gap-6 ${className}`}>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 rounded-2xl border border-border-subtle bg-white p-2.5 shadow-sm">
            <Image
              src="/brand/cairo-university.png"
              alt="Cairo University Emblem"
              width={140}
              height={100}
              className="h-[54px] w-auto object-contain"
            />
            <div className="h-10 w-[1.5px] bg-border-subtle" aria-hidden="true" />
            <Image
              src="/brand/faculty-nursing-cairo.png"
              alt="Faculty of Nursing Logo — Cairo University"
              width={100}
              height={100}
              className="h-[54px] w-auto object-contain"
            />
          </div>
          <div>
            <h3 className="type-h3 font-bold text-navy">
              Cairo University
            </h3>
            <p className="text-sm font-semibold text-rose-dark">
              Faculty of Nursing — Department of Critical Care & Emergency Nursing
            </p>
          </div>
        </div>

        <div className="inline-flex items-center gap-2 rounded-pill border border-emerald-200 bg-emerald-50 px-3.5 py-1.5 text-xs font-bold text-emerald-800">
          <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
          <span>NAQAAE Accredited Institution</span>
        </div>
      </div>
    );
  }

  // Hero variant
  return (
    <div
      className={`inline-flex items-center gap-3 rounded-pill border border-white/20 bg-white/10 px-3.5 py-1.5 backdrop-blur-xs ${className}`}
    >
      <div className="flex items-center gap-2 rounded-[10px] bg-white p-1">
        <Image
          src="/brand/cairo-university.png"
          alt="Cairo University"
          width={60}
          height={44}
          className="h-[26px] w-auto object-contain"
        />
        <div className="h-3.5 w-[1px] bg-gray-200" aria-hidden="true" />
        <Image
          src="/brand/faculty-nursing-cairo.png"
          alt="Faculty of Nursing"
          width={44}
          height={44}
          className="h-[26px] w-auto object-contain"
        />
      </div>
      <div className="text-start">
        <p className="text-xs font-semibold text-white">Cairo University</p>
        <p className="text-[11px] text-rose-light">Faculty of Nursing</p>
      </div>
    </div>
  );
}
