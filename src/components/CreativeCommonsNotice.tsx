import React from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";

interface CreativeCommonsNoticeProps {
  variant?: "footer" | "card" | "boxed" | "inline";
  className?: string;
}

export function CreativeCommonsNotice({
  variant = "footer",
  className = "",
}: CreativeCommonsNoticeProps) {
  if (variant === "inline") {
    return (
      <div
        className={`inline-flex items-center gap-2 text-xs text-text-muted-navy ${className}`}
        dir="ltr"
      >
        <span className="font-semibold text-rose-light">CC BY-NC-ND 4.0</span>
        <span>•</span>
        <span>Dept. of Critical Care & Emergency Nursing, Faculty of Nursing, Cairo University</span>
      </div>
    );
  }

  if (variant === "card" || variant === "boxed") {
    return (
      <div
        dir="ltr"
        className={`squircle-card border border-border-subtle bg-white p-6 shadow-card-soft text-start ${className}`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-pill bg-light-1 text-rose-dark">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h3 className="type-h3 font-bold text-navy">
                Intellectual Property & Licensing Rights
              </h3>
              <p className="text-xs font-medium text-text-secondary">
                Department of Critical Care and Emergency Nursing — Faculty of Nursing, Cairo University
              </p>
            </div>
          </div>

          {/* CC Icons Lockup */}
          <div
            className="flex items-center gap-1.5 rounded-pill border border-rose/30 bg-light-1 px-3 py-1 text-xs font-bold text-rose-dark"
            title="Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International"
          >
            <span>CC</span>
            <span>BY</span>
            <span>NC</span>
            <span>ND</span>
            <span className="ms-1 font-semibold text-navy">4.0</span>
          </div>
        </div>

        <div className="mt-4 space-y-3 text-sm leading-relaxed text-text-secondary">
          <p>
            All procedural checklists, clinical definitions, equipment guides, and educational media hosted on <strong className="font-semibold text-navy">Critical Ease</strong> are the intellectual property of the <strong className="font-semibold text-navy">Department of Critical Care and Emergency Nursing, Faculty of Nursing, Cairo University</strong>.
          </p>
          <p>
            This work is officially licensed under the{" "}
            <Link
              href="https://creativecommons.org/licenses/by-nc-nd/4.0/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-rose-dark underline decoration-rose/40 underline-offset-2 transition-colors hover:text-navy hover:decoration-navy"
            >
              Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International License (CC BY-NC-ND 4.0)
            </Link>
            .
          </p>
          <div className="rounded-xl border border-border-subtle bg-light-1/70 p-3.5 text-xs text-text-secondary">
            <span className="font-bold text-navy">Permitted Terms:</span> You are free to share, copy, and redistribute this material in any medium or format for non-commercial educational purposes, provided appropriate academic attribution is given to the Department and Faculty of Nursing, Cairo University. No alterations, transformations, derivatives, or commercial uses are allowed without prior written departmental authorization.
          </div>
        </div>
      </div>
    );
  }

  // Default 'footer' variant
  return (
    <div
      dir="ltr"
      className={`mx-auto max-w-2xl rounded-2xl border border-white/10 bg-white/5 p-4 text-center sm:p-5 ${className}`}
    >
      <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-bold text-rose-light">
        <span className="rounded-md border border-rose/40 bg-navy/60 px-2 py-0.5">CC</span>
        <span className="rounded-md border border-rose/40 bg-navy/60 px-2 py-0.5">BY</span>
        <span className="rounded-md border border-rose/40 bg-navy/60 px-2 py-0.5">NC</span>
        <span className="rounded-md border border-rose/40 bg-navy/60 px-2 py-0.5">ND</span>
        <span className="text-white">4.0 International</span>
      </div>

      <p className="mt-2.5 text-xs leading-relaxed text-text-muted-navy">
        © <strong className="font-semibold text-white">Department of Critical Care and Emergency Nursing</strong>, Faculty of Nursing, Cairo University.
      </p>
      <p className="mt-1 text-xs text-text-muted-navy/80">
        Licensed under{" "}
        <Link
          href="https://creativecommons.org/licenses/by-nc-nd/4.0/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-rose-light underline decoration-rose-light/40 underline-offset-2 hover:text-white"
        >
          Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International (CC BY-NC-ND 4.0)
        </Link>
        . Non-commercial educational distribution authorized with full attribution.
      </p>
    </div>
  );
}
