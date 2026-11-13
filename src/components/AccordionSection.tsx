"use client";

import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, AlertCircle } from "lucide-react";

interface AccordionSectionProps {
  number: number;
  title: string;
  sectionId?: string;
  hashAliases?: string[];
  defaultOpen?: boolean;
  isDanger?: boolean;
  children: React.ReactNode;
}

export function AccordionSection({
  number,
  title,
  sectionId,
  hashAliases = [],
  defaultOpen = false,
  isDanger = false,
  children,
}: AccordionSectionProps) {
  const canonicalId = sectionId || `section-${number}`;
  const contentId = `section-content-${number}`;
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const matchesHash = (rawHash: string) => {
      const cleaned = rawHash.replace(/^#/, "").trim().toLowerCase();
      if (!cleaned) return false;
      if (cleaned === canonicalId.toLowerCase()) return true;
      return hashAliases.some((a) => a.toLowerCase() === cleaned);
    };

    const syncHash = () => {
      if (typeof window === "undefined") return;
      if (matchesHash(window.location.hash)) {
        setIsOpen(true);
        requestAnimationFrame(() => {
          const reduced = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
          ).matches;
          cardRef.current?.scrollIntoView({
            behavior: reduced ? "auto" : "smooth",
            block: "start",
          });
        });
      }
    };

    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, [canonicalId, hashAliases]);

  const handleToggle = () => {
    const next = !isOpen;
    setIsOpen(next);
    if (next && typeof window !== "undefined") {
      try {
        window.history.replaceState(null, "", `#${canonicalId}`);
      } catch {}
    }
  };

  return (
    <section
      id={canonicalId}
      ref={cardRef}
      data-testid={`accordion-section-${number}`}
      className="card-navy-rose squircle-card surface-navy scroll-mt-20 overflow-hidden transition-shadow"
    >
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={contentId}
        onClick={handleToggle}
        className="flex min-h-[76px] w-full items-center justify-between gap-4 p-4 text-start transition-colors hover:bg-white/5 sm:p-5"
      >
        <div className="flex items-center gap-4">
          {/* Rose -> Tile-Blue Number Tile (~24px squircle) */}
          <span className="squircle-tile bg-grad-tile flex h-12 w-12 shrink-0 items-center justify-center shadow-sm sm:h-14 sm:w-14">
            <span className="font-latin text-2xl font-bold leading-none text-white tabular-nums">
              {number}
            </span>
          </span>

          <div className="flex items-center gap-2.5">
            {isDanger && (
              <AlertCircle
                className="h-5 w-5 shrink-0 text-rose-light"
                aria-hidden="true"
              />
            )}
            <h3 className="text-lg font-bold text-white sm:text-xl">{title}</h3>
          </div>
        </div>

        <ChevronDown
          className={`h-5 w-5 shrink-0 text-rose-light transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            isOpen ? "rotate-180" : ""
          }`}
          aria-hidden="true"
        />
      </button>

      {/* Interruptible CSS Grid accordion collapse/expand */}
      <div
        id={contentId}
        aria-hidden={!isOpen}
        style={{
          visibility: isOpen ? "visible" : "hidden",
        }}
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isOpen
            ? "grid-rows-[1fr] opacity-100"
            : "pointer-events-none grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="surface-light m-3 mt-0 rounded-[20px] border border-border-subtle bg-white p-5 text-navy shadow-sm sm:m-4 sm:mt-0 sm:p-6">
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}
