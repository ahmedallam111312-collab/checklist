"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  Download,
  LogOut,
  FileText,
  CornerDownLeft,
  X,
} from "lucide-react";
import { AR_STRINGS } from "@/messages/ar";
import { logoutAdmin } from "@/app/admin/actions/auth";

export function normalizeSearchQuery(text: string): string {
  return text
    .toLowerCase()
    .replace(/[أإآٱ]/g, "ا")
    .replace(/[ة]/g, "ه")
    .replace(/[ى]/g, "ي")
    .replace(/[\u064B-\u065F\u0670]/g, "") // Remove tashkeel/diacritics
    .trim();
}

interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
  category: "navigation" | "actions" | "settings";
}

interface CommandMenuProps {
  procedures?: Array<{ id: string; title: string; slug: string; published: boolean }>;
}

export function CommandMenu({ procedures = [] }: CommandMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isMac, setIsMac] = useState(false);
  const router = useRouter();

  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && navigator.platform) {
      setIsMac(/Mac|iPod|iPhone|iPad/.test(navigator.platform));
    }
  }, []);

  // Listen for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.code === "KeyK") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Focus management & Esc handling
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const handleExportBackup = useCallback(async () => {
    setIsOpen(false);
    window.location.href = "/api/admin/backup";
  }, []);

  const handleSignOut = useCallback(async () => {
    setIsOpen(false);
    await logoutAdmin();
  }, []);

  // Build items list
  const baseItems: CommandItem[] = useMemo(() => [
    {
      id: "new-proc",
      title: "Add New Clinical Procedure",
      subtitle: "Open procedure creation editor",
      icon: Plus,
      category: "actions",
      action: () => {
        setIsOpen(false);
        router.push("/admin/procedures/new");
      },
    },
    {
      id: "export-backup",
      title: "Export Full Database Backup (JSON)",
      subtitle: "Download procedures, checklist steps, and equipment",
      icon: Download,
      category: "actions",
      action: handleExportBackup,
    },
    {
      id: "sign-out",
      title: "Sign Out of Admin",
      subtitle: "End current administrator session",
      icon: LogOut,
      category: "settings",
      action: handleSignOut,
    },
  ], [router, handleExportBackup, handleSignOut]);

  // Procedure items
  const procItems: CommandItem[] = useMemo(() => {
    return procedures.map((p) => ({
      id: `proc-${p.id}`,
      title: p.title,
      subtitle: p.published ? "Published — Open editor" : "Draft — Open editor",
      icon: FileText,
      category: "navigation",
      action: () => {
        setIsOpen(false);
        router.push(`/admin/procedures/${p.id}`);
      },
    }));
  }, [procedures, router]);

  const allItems = useMemo(() => [...baseItems, ...procItems], [baseItems, procItems]);

  const filteredItems = useMemo(() => {
    if (!query.trim()) return allItems;
    const normQ = normalizeSearchQuery(query);
    return allItems.filter((item) => {
      const matchTitle = normalizeSearchQuery(item.title).includes(normQ);
      const matchSub = item.subtitle ? normalizeSearchQuery(item.subtitle).includes(normQ) : false;
      return matchTitle || matchSub;
    });
  }, [query, allItems]);

  // Keyboard navigation inside menu
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].action();
      }
    } else if (e.key === "Tab") {
      // Focus trap
      e.preventDefault();
      if (e.shiftKey) {
        setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
      } else {
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
      }
    }
  };

  return (
    <>
      {/* Search Trigger Pill Button (Header on Navy) */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Quick command search (Ctrl+K)"
        className="squircle-pill inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-2 rounded-pill border border-rose/40 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:border-rose hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-light"
      >
        <Search className="h-3.5 w-3.5 text-rose-light" aria-hidden="true" />
        <span className="hidden md:inline">Search & commands...</span>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-rose/40 bg-logo-navy px-1.5 py-0.5 text-[10px] font-mono font-medium text-rose-light">
          {isMac ? "⌘K" : "Ctrl+K"}
        </kbd>
      </button>

      {/* Modal Dialog Backdrop & Focus Trap */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Quick Command Palette"
          className="surface-light fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 sm:pt-24 bg-navy/60 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsOpen(false);
          }}
          onKeyDown={handleKeyDown}
        >
          <div
            ref={dialogRef}
            dir="ltr"
            className="squircle-card w-full max-w-xl overflow-hidden rounded-card border border-border-subtle bg-white text-navy shadow-card-soft animate-in zoom-in-95 duration-150"
          >
            {/* Search Header */}
            <div className="relative flex items-center border-b border-border-subtle px-4">
              <Search className="h-5 w-5 text-text-secondary shrink-0" aria-hidden="true" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                placeholder="Search procedures, actions, or settings..."
                className="w-full min-h-[52px] bg-transparent px-3 text-sm text-navy placeholder:text-text-secondary/70 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close"
                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-pill text-text-secondary hover:bg-light-1 hover:text-navy"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Results List */}
            <ul
              ref={listRef}
              role="listbox"
              className="max-h-80 overflow-y-auto p-2 space-y-1 focus:outline-none"
            >
              {filteredItems.length === 0 ? (
                <li className="py-8 text-center text-xs text-text-secondary">
                  {AR_STRINGS.noResults}
                </li>
              ) : (
                filteredItems.map((item, index) => {
                  const Icon = item.icon;
                  const isSelected = index === selectedIndex;

                  return (
                    <li
                      key={item.id}
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => item.action()}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`squircle-pill flex items-center justify-between gap-3 rounded-pill px-3.5 py-2.5 cursor-pointer text-start transition-colors ${
                        isSelected
                          ? "bg-light-1 text-rose-dark font-bold"
                          : "text-navy hover:bg-light-1/60"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Icon className="h-4 w-4 shrink-0" />
                        <div className="truncate">
                          <p className="text-sm truncate leading-snug">{item.title}</p>
                          {item.subtitle && (
                            <p className="text-[11px] text-text-secondary truncate mt-0.5">
                              {item.subtitle}
                            </p>
                          )}
                        </div>
                      </div>
                      {isSelected && (
                        <CornerDownLeft className="h-3.5 w-3.5 text-rose-dark shrink-0" />
                      )}
                    </li>
                  );
                })
              )}
            </ul>

            {/* Footer Shortcut Hints */}
            <div className="flex items-center justify-between border-t border-border-subtle bg-light-1 px-4 py-2.5 text-[11px] text-text-secondary">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="rounded border border-border bg-white px-1.5 py-0.5 font-mono text-navy">↑↓</kbd>
                  <span>Navigate</span>
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="rounded border border-border bg-white px-1.5 py-0.5 font-mono text-navy">↵</kbd>
                  <span>Select</span>
                </span>
              </div>
              <span className="flex items-center gap-1">
                <kbd className="rounded border border-border bg-white px-1.5 py-0.5 font-mono text-navy">Esc</kbd>
                <span>Close</span>
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
