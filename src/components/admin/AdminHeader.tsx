"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Settings, ExternalLink, LogOut, Menu, X } from "lucide-react";
import { Logo } from "@/components/Logo";
import { logoutAdmin } from "@/app/admin/actions/auth";
import { AR_STRINGS } from "@/messages/ar";
import dynamic from "next/dynamic";

const CommandMenu = dynamic(
  () => import("@/components/admin/CommandMenu").then((mod) => mod.CommandMenu),
  { ssr: false }
);

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
    <header className="surface-navy sticky top-0 z-40 w-full max-w-full border-b-[3px] border-rose bg-navy text-white shadow-sm">
      <div className="mx-auto flex min-h-[64px] max-w-[76rem] items-center justify-between gap-2 px-3 sm:px-6">
        {/* Brand & Admin Badge */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <Link
            href="/admin"
            className="inline-flex min-h-[44px] items-center gap-2.5 rounded-pill focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-light"
          >
            <Logo
              variant="chip"
              priority
              width={84}
              height={46}
              className="h-[42px] w-auto rounded-[10px]"
            />
            <span className="hidden sm:inline-flex items-center rounded-pill border border-rose/40 bg-white/10 px-2.5 py-1 text-xs font-bold text-rose-light">
              {AR_STRINGS.adminDashboard}
            </span>
          </Link>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden sm:flex items-center gap-1.5 sm:gap-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`squircle-pill inline-flex min-h-[44px] items-center gap-2 rounded-pill px-3.5 py-2 text-xs sm:text-sm font-bold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-light ${
                  link.active
                    ? "bg-rose text-navy shadow-rose-glow"
                    : "border border-rose/40 bg-white/10 text-white hover:border-rose hover:bg-white/15"
                }`}
              >
                <Icon
                  className={`h-4 w-4 shrink-0 ${link.active ? "text-navy" : "text-rose-light"}`}
                  aria-hidden="true"
                />
                <span className="hidden min-[720px]:inline">{link.label}</span>
              </Link>
            );
          })}

          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="squircle-pill inline-flex min-h-[44px] items-center gap-1.5 rounded-pill border border-rose/40 bg-white/10 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white transition-colors hover:border-rose hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-light"
            title={AR_STRINGS.adminViewPublicSite}
          >
            <ExternalLink className="h-4 w-4 shrink-0 text-rose-light" aria-hidden="true" />
            <span className="hidden md:inline">{AR_STRINGS.adminViewPublicSite}</span>
          </Link>
        </nav>

        {/* Left Controls: Command Menu, Desktop Logout, Mobile Menu */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <CommandMenu />

          {/* Desktop Logout Button */}
          <div className="hidden sm:block">
            <form action={logoutAdmin}>
              <button
                type="submit"
                aria-label={AR_STRINGS.adminLogout}
                title={AR_STRINGS.adminLogout}
                className="squircle-pill inline-flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-pill border border-rose/40 bg-white/10 text-white transition-colors hover:border-critical hover:bg-critical hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-light"
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
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            className="sm:hidden squircle-pill inline-flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-pill border border-rose/40 bg-white/10 text-white transition-colors hover:border-rose hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-light"
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
          className="sm:hidden border-t border-rose/40 bg-logo-navy px-4 py-3 space-y-2 text-white shadow-lg"
        >
          <nav className="flex flex-col gap-1.5">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`squircle-pill flex min-h-[44px] items-center gap-3 rounded-pill px-3.5 py-2 text-sm font-bold transition-colors ${
                    link.active
                      ? "bg-rose text-navy"
                      : "text-white hover:bg-white/10"
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 shrink-0 ${link.active ? "text-navy" : "text-rose-light"}`}
                    aria-hidden="true"
                  />
                  <span>{link.label}</span>
                </Link>
              );
            })}

            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMobileMenuOpen(false)}
              className="squircle-pill flex min-h-[44px] items-center gap-3 rounded-pill px-3.5 py-2 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
            >
              <ExternalLink className="h-4 w-4 shrink-0 text-rose-light" aria-hidden="true" />
              <span>{AR_STRINGS.adminViewPublicSite}</span>
            </Link>
          </nav>

          <div className="border-t border-rose/30 pt-2">
            <form action={logoutAdmin}>
              <button
                type="submit"
                className="squircle-pill flex w-full min-h-[44px] items-center gap-3 rounded-pill px-3.5 py-2 text-sm font-bold text-rose-light hover:bg-critical hover:text-white transition-colors"
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
