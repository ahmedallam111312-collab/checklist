"use client";

import React, { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { Procedure } from "@/types/database";
import { ProcedureCard } from "@/components/ProcedureCard";
import { AR_STRINGS } from "@/messages/ar";

interface ProceduresLibraryClientProps {
  initialProcedures: Procedure[];
}

export function ProceduresLibraryClient({
  initialProcedures,
}: ProceduresLibraryClientProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProcedures = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return initialProcedures;

    return initialProcedures.filter((p) => {
      const matchTitle = p.title.toLowerCase().includes(query);
      const matchDesc = p.short_description?.toLowerCase().includes(query);
      return matchTitle || matchDesc;
    });
  }, [searchQuery, initialProcedures]);

  return (
    <div className="space-y-8">
      {/* Search Input Box */}
      <div className="relative mx-auto max-w-xl">
        <label htmlFor="procedure-search" className="sr-only">
          {AR_STRINGS.searchPlaceholder}
        </label>
        <div className="relative flex items-center">
          <input
            id="procedure-search"
            type="search"
            lang="en"
            dir="ltr"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={AR_STRINGS.searchPlaceholder}
            className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface-sunken)] px-4 py-3 pe-12 text-base text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] placeholder:text-end placeholder:font-arabic focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 min-h-[48px]"
          />
          <div className="pointer-events-none absolute inset-y-0 end-0 flex items-center pe-4 text-[var(--color-text-muted)]">
            <Search className="h-5 w-5" aria-hidden="true" />
          </div>
        </div>
      </div>

      {/* Grid of Procedures or Empty State */}
      {initialProcedures.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] py-16 px-4 text-center max-w-lg mx-auto">
          <h2 className="text-lg font-bold text-[var(--color-text)] mb-2">
            {AR_STRINGS.emptyLibraryTitle}
          </h2>
          <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed font-arabic">
            {AR_STRINGS.emptyLibraryDesc}
          </p>
        </div>
      ) : filteredProcedures.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 sm:gap-6">
          {filteredProcedures.map((proc) => (
            <ProcedureCard key={proc.id} procedure={proc} />
          ))}
        </div>
      ) : (
        <div className="py-16 text-center">
          <p className="text-base text-[var(--color-text-muted)]">
            {AR_STRINGS.noResults}
          </p>
        </div>
      )}
    </div>
  );
}
