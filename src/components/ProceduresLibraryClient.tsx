"use client";

import React, { useState, useMemo } from "react";
import { Search, ClipboardList } from "lucide-react";
import { Procedure } from "@/types/database";
import { ProcedureCard } from "@/components/ProcedureCard";
import { AR_STRINGS } from "@/messages/ar";
import { normalizeSearchText } from "@/lib/search";

interface ProceduresLibraryClientProps {
  initialProcedures: Procedure[];
}

export function ProceduresLibraryClient({
  initialProcedures,
}: ProceduresLibraryClientProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProcedures = useMemo(() => {
    const query = normalizeSearchText(searchQuery);
    if (!query) return initialProcedures;

    return initialProcedures.filter((p) => {
      const haystack = normalizeSearchText(
        [p.title, p.short_description, p.definition, p.slug]
          .filter(Boolean)
          .join(" ")
      );
      return haystack.includes(query);
    });
  }, [searchQuery, initialProcedures]);

  return (
    <div className="space-y-8">
      {/* Search Field (search-bg rounded, supports Arabic & English queries) */}
      <div className="mx-auto max-w-xl">
        <label htmlFor="procedure-search" className="sr-only">
          {AR_STRINGS.searchPlaceholder}
        </label>
        <div className="surface-light relative flex items-center">
          <input
            id="procedure-search"
            type="search"
            dir="auto"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={AR_STRINGS.searchPlaceholder}
            className="squircle-pill min-h-[50px] w-full border border-border bg-search-bg px-4 py-3 ps-12 text-base text-navy shadow-sm transition-colors placeholder:text-text-muted focus:border-rose-dark focus:outline-none focus:ring-2 focus:ring-rose-dark/25"
          />
          <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-4 text-rose-dark">
            <Search className="h-5 w-5" aria-hidden="true" />
          </div>
        </div>
      </div>

      {/* Responsive Grid: 1 col mobile, 2 at >=768px, 3 at >=1100px */}
      {initialProcedures.length === 0 ? (
        <div className="surface-light squircle-card mx-auto max-w-lg border border-border-subtle bg-white px-6 py-14 text-center shadow-card-soft">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-pill bg-light-1 text-rose-dark">
            <ClipboardList className="h-6 w-6" aria-hidden="true" />
          </div>
          <h2 className="mb-2 text-lg font-bold text-navy">
            {AR_STRINGS.emptyLibraryTitle}
          </h2>
          <p className="text-sm leading-relaxed text-text-secondary">
            {AR_STRINGS.emptyLibraryDesc}
          </p>
        </div>
      ) : filteredProcedures.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 min-[1100px]:grid-cols-3 sm:gap-6">
          {filteredProcedures.map((proc) => (
            <ProcedureCard key={proc.id} procedure={proc} />
          ))}
        </div>
      ) : (
        <div className="surface-light squircle-card mx-auto max-w-md border border-border-subtle bg-white px-6 py-12 text-center shadow-sm">
          <p className="text-base font-medium text-navy">
            {AR_STRINGS.noResults}
          </p>
        </div>
      )}
    </div>
  );
}
