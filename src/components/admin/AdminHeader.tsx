"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Settings, ExternalLink, LogOut, Menu, X } from "lucide-react";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { logoutAdmin } from "@/app/admin/actions/auth";
import { AR_STRINGS } from "@/messages/ar";

export function AdminHeader() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    {
      href: "/admin",
      label: AR_STRINGS.adminDashboard,
      icon: LayoutDashboard,
      active: pathname === "/admin",
    },
    {
      href: "/admin/settings",
      label: AR_STRINGS.adminSettings,
      icon: Settings,
      active: pathname.startsWith("/admin/settings"),
    },
  ];

  return (
    <header className="sticky top-0 z-40 w-full max-w-full border-b border-[var(--color-border-subtle)] bg-[var(--color-surface)]/95 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-h-[56px] max-w-[76rem] items-center justify-between px-3 sm:px-6">
        {/* Brand & Admin Badge */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <Link
            href="/admin"
            className="flex items-center gap-2 rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus-ring)]"
          >
            <Logo size={32} hideNameBelow360={true} />
            <span className="hidden sm:inline-block rounded bg-[var(--color-primary)]/15 px-2 py-0.5 text-xs font-bold text-[var(--color-primary)]">
              {AR_STRINGS.adminDashboard}
            </span>
          </Link>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden sm:flex items-center gap-1 sm:gap-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`inline-flex min-h-[44px] items-center gap-2 rounded-md px-3 py-2 text-xs sm:text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)] ${
                  link.active
                    ? "bg-[var(--color-surface-raised)] text-[var(--color-primary)]"
                    : "text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="hidden min-[720px]:inline">{link.label}</span>
              </Link>
            );
          })}

          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-md px-3 py-2 text-xs sm:text-sm font-semibold text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)]"
            title={AR_STRINGS.adminViewPublicSite}
          >
            <ExternalLink className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="hidden md:inline">{AR_STRINGS.adminViewPublicSite}</span>
          </Link>
        </nav>

        {/* Right Controls: Desktop Theme & Logout, Mobile Theme & Hamburger Menu */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <ThemeToggle />

          {/* Desktop Logout Button */}
          <div className="hidden sm:block">
            <form action={logoutAdmin}>
              <button
                type="submit"
                aria-label={AR_STRINGS.adminLogout}
                title={AR_STRINGS.adminLogout}
                className="inline-flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-danger)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)]"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
              </button>
            </form>
          </div>

          {/* Mobile Hamburger Menu Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-controls="admin-mobile-menu"
            aria-label={mobileMenuOpen ? "إغلاق القائمة" : "فتح القائمة"}
            className="sm:hidden inline-flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)]"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Collapsible Navigation Menu Drawer */}
      {mobileMenuOpen && (
        <div
          id="admin-mobile-menu"
          className="sm:hidden border-t border-[var(--color-border-subtle)] bg-[var(--color-surface)] px-4 py-3 space-y-2 shadow-lg animate-in slide-in-from-top-2"
        >
          <nav className="flex flex-col gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex min-h-[44px] items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold transition-colors ${
                    link.active
                      ? "bg-[var(--color-surface-raised)] text-[var(--color-primary)]"
                      : "text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{link.label}</span>
                </Link>
              );
            })}

            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMobileMenuOpen(false)}
              className="flex min-h-[44px] items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors"
            >
              <ExternalLink className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{AR_STRINGS.adminViewPublicSite}</span>
            </Link>
          </nav>

          <div className="border-t border-[var(--color-border-subtle)] pt-2">
            <form action={logoutAdmin}>
              <button
                type="submit"
                className="flex w-full min-h-[44px] items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold text-[var(--color-danger)] hover:bg-[var(--color-danger-surface)] transition-colors"
              >
                <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{AR_STRINGS.adminLogout}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}
