"use client";

import React from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AR_STRINGS } from "@/messages/ar";

interface HeaderProps {
  siteName?: string;
  logoPath?: string | null;
}

export function Header({ siteName, logoPath }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 h-[56px] max-h-[56px] box-border w-full border-b border-[var(--color-border-subtle)] bg-[var(--color-surface)]/90 backdrop-blur-md">
      <div className="mx-auto flex h-full max-w-[70rem] items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus-ring)]"
        >
          <Logo
            name={siteName}
            logoPath={logoPath}
            size={32}
            hideNameBelow360={true}
          />
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/home"
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md px-3 text-sm font-semibold text-[var(--color-text)] transition-colors hover:text-[var(--color-primary)] active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus-ring)]"
          >
            {AR_STRINGS.home}
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
