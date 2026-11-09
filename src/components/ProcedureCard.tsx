import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Activity } from "lucide-react";
import { Procedure } from "@/types/database";
import { AR_STRINGS } from "@/messages/ar";

interface ProcedureCardProps {
  procedure: Procedure;
}

export function ProcedureCard({ procedure }: ProcedureCardProps) {
  return (
    <Link
      href={`/procedures/${procedure.slug}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface)] shadow-sm transition-all duration-200 hover:border-[var(--color-primary)] hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus-ring)]"
    >
      {/* 16:10 Image area */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-[var(--color-surface-sunken)] border-b border-[var(--color-border-subtle)]">
        {procedure.cover_path ? (
          <Image
            src={procedure.cover_path}
            alt={procedure.cover_alt || procedure.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[var(--color-primary)]/40 group-hover:text-[var(--color-primary)] transition-colors">
            <Activity className="h-12 w-12" aria-hidden="true" />
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="flex flex-1 flex-col justify-between p-5">
        <div dir="ltr" lang="en" className="text-start mb-4">
          <h3 className="text-lg font-semibold text-[var(--color-text)] transition-colors group-hover:text-[var(--color-primary)]">
            <bdi dir="ltr" lang="en">{procedure.title}</bdi>
          </h3>
          {procedure.short_description && (
            <p className="mt-1.5 text-sm text-[var(--color-text-secondary)] line-clamp-2">
              {procedure.short_description}
            </p>
          )}
        </div>

        {/* Footer with Arabic "استكشف" button and mirrored icon */}
        <div className="flex items-center justify-end pt-2 border-t border-[var(--color-border-subtle)]">
          <span className="inline-flex min-h-[44px] items-center gap-2 text-sm font-semibold text-[var(--color-primary)] group-hover:underline">
            <span>{AR_STRINGS.explore}</span>
            <ArrowLeft className="h-4 w-4 icon-mirror transition-transform group-hover:-translate-x-1" aria-hidden="true" />
          </span>
        </div>
      </div>
    </Link>
  );
}
