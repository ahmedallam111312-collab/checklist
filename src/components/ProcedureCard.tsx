"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowRight, Activity } from "lucide-react";
import { Procedure } from "@/types/database";
import { AR_STRINGS } from "@/messages/ar";
import { getPublicImageUrl } from "@/lib/images/url";

interface ProcedureCardProps {
  procedure: Procedure;
}

export function ProcedureCard({ procedure }: ProcedureCardProps) {
  const router = useRouter();
  const [imageError, setImageError] = useState(false);
  const coverUrl = !imageError ? getPublicImageUrl(procedure.cover_path) : null;

  const handleNavigation = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (
      typeof document !== "undefined" &&
      "startViewTransition" in document &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      e.preventDefault();
      (document as any).startViewTransition(() => {
        router.push(`/procedures/${procedure.slug}`);
      });
    }
  };

  return (
    <Link
      href={`/procedures/${procedure.slug}`}
      onClick={handleNavigation}
      prefetch={true}
      className="card-navy-rose squircle-card surface-navy group flex flex-col overflow-hidden p-4 text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl sm:p-5"
    >
      {/* Inner Rounded Cover Panel (reference 03-procedures-list.jpg) */}
      <div
        className="relative aspect-[16/10] w-full overflow-hidden rounded-[20px] border border-white/10 bg-navy/90"
        style={{ viewTransitionName: `procedure-cover-${procedure.slug}` }}
      >
        {coverUrl ? (
          <Image
            src={coverUrl}
            alt={procedure.cover_alt || procedure.title}
            fill
            placeholder={procedure.blur_data_url ? "blur" : "empty"}
            blurDataURL={procedure.blur_data_url || undefined}
            sizes="(max-width: 767px) 100vw, (max-width: 1099px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-navy to-plum/80 text-rose-light transition-transform duration-300 group-hover:scale-105">
            <Activity className="h-12 w-12" aria-hidden="true" />
          </div>
        )}
      </div>

      {/* Card Body (English title & short description) */}
      <div className="mt-4 flex flex-1 flex-col justify-between">
        <div dir="ltr" lang="en" className="text-start">
          <h2 className="font-latin text-xl font-bold leading-snug text-white transition-colors group-hover:text-rose-light">
            <bdi dir="ltr" lang="en">
              {procedure.title}
            </bdi>
          </h2>
          {procedure.short_description && (
            <p className="mt-2 font-latin text-sm leading-relaxed text-text-muted-navy line-clamp-2">
              {procedure.short_description}
            </p>
          )}
        </div>

        {/* Full-Width Rose Explore CTA Button */}
        <div className="mt-5">
          <span className="btn-rose-cta squircle-pill type-button flex min-h-[48px] w-full items-center justify-center gap-2 px-5 text-base font-bold text-navy">
            <span>{AR_STRINGS.explore}</span>
            <ArrowRight
              className="h-4 w-4 transition-transform group-hover:translate-x-1"
              aria-hidden="true"
            />
          </span>
        </div>
      </div>
    </Link>
  );
}
