"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Home, ClipboardList, Info } from "lucide-react";
import { Logo } from "@/components/Logo";
import { InstitutionalBadges } from "@/components/InstitutionalBadges";
import { CreativeCommonsNotice } from "@/components/CreativeCommonsNotice";
import { AR_STRINGS } from "@/messages/ar";

interface HeaderProps {
  siteName?: string;
  logoPath?: string | null;
}

export function Header({ siteName, logoPath }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const menuBtnRef = useRef<HTMLButtonElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const wasOpenRef = useRef(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Escape key, body scroll lock, and accessible focus management
  useEffect(() => {
    if (mobileMenuOpen) {
      wasOpenRef.current = true;
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      requestAnimationFrame(() => {
        closeBtnRef.current?.focus();
      });

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          setMobileMenuOpen(false);
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        window.removeEventListener("keydown", handleKeyDown);
        document.body.style.overflow = prevOverflow;
      };
    } else if (wasOpenRef.current) {
      wasOpenRef.current = false;
      menuBtnRef.current?.focus();
    }
  }, [mobileMenuOpen]);

  const navLinks = [
    { href: "/home", label: AR_STRINGS.home, icon: Home },
    { href: "/procedures", label: AR_STRINGS.navProcedures, icon: ClipboardList },
    { href: "/about", label: AR_STRINGS.navAbout, icon: Info },
  ];

  const isHomeActive = pathname === "/" || pathname === "/home";

  return (
    <>
      <header className="surface-navy sticky top-0 z-40 h-[64px] w-full border-b-[3px] border-rose bg-navy text-white shadow-sm">
        <div className="mx-auto flex h-full max-w-[70rem] items-center justify-between gap-2 px-4 sm:px-6">
          {/* Start (Left): Brand Logo + Institutional Badges (Cairo University & Faculty of Nursing) */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/"
              aria-label={siteName || "Critical Ease"}
              className="surface-light inline-flex min-h-[44px] shrink-0 items-center rounded-[14px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-light"
            >
              <Logo
                variant="chip"
                name={siteName}
                logoPath={logoPath}
                width={84}
                height={46}
                priority
                className="h-[42px] w-auto rounded-[12px]"
              />
            </Link>

            {/* University & Faculty of Nursing Logos on Every Page */}
            <InstitutionalBadges variant="header" />

            <Link
              href="/home"
              className={`squircle-pill hidden sm:inline-flex min-h-[40px] items-center gap-2 border px-3 text-sm font-semibold transition-colors ${
                isHomeActive
                  ? "border-rose bg-white/15 text-white"
                  : "border-white/25 bg-white/10 text-white hover:border-rose/70 hover:bg-white/15"
              }`}
            >
              <Home className="h-4 w-4 text-rose-light" aria-hidden="true" />
              <span>{AR_STRINGS.home}</span>
            </Link>
          </div>

          {/* Desktop Navigation Pills (>= md) */}
          <nav
            className="hidden md:flex items-center gap-2"
            aria-label="Main Navigation"
          >
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive =
                link.href === "/home"
                  ? isHomeActive
                  : pathname.startsWith(link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`squircle-pill inline-flex min-h-[40px] items-center gap-2 border px-4 text-sm font-semibold transition-colors ${
                    isActive
                      ? "border-rose bg-rose text-navy font-bold"
                      : "border-white/20 bg-white/5 text-white hover:border-rose/60 hover:bg-white/10"
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 ${
                      isActive ? "text-navy" : "text-rose-light"
                    }`}
                    aria-hidden="true"
                  />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Mobile Menu Trigger Button (< md) */}
          <button
            ref={menuBtnRef}
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-nav-drawer"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            className="squircle-pill inline-flex md:hidden min-h-[44px] min-w-[44px] items-center justify-center border border-rose/60 bg-white/10 text-white transition-colors hover:bg-white/15 active:scale-95"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </header>

      {/* Accessible Slide-Over Mobile Drawer (< md) */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile Navigation"
          id="mobile-nav-drawer"
        >
          {/* Scrim Backdrop */}
          <div
            className="fixed inset-0 bg-navy/60 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Slide-over panel */}
          <aside className="surface-navy fixed inset-y-0 right-0 flex w-[min(85vw,340px)] flex-col justify-between border-l-[3px] border-rose bg-navy p-5 text-white shadow-2xl safe-pt safe-pb">
            <div>
              <div className="flex items-center justify-between border-b border-rose/40 pb-4">
                <div className="flex items-center gap-2">
                  <Logo
                    variant="chip"
                    name={siteName}
                    logoPath={logoPath}
                    width={84}
                    height={46}
                    className="h-[38px] w-auto rounded-[10px]"
                  />
                  <InstitutionalBadges variant="header" />
                </div>
                <button
                  ref={closeBtnRef}
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Close menu"
                  className="squircle-pill inline-flex min-h-[44px] min-w-[44px] items-center justify-center border border-rose/60 bg-white/10 text-white hover:bg-white/15"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>

              <div className="mt-4 border-b border-white/10 pb-3 text-xs text-rose-light">
                <p className="font-bold text-white">Cairo University — Faculty of Nursing</p>
                <p>Dept. of Critical Care & Emergency Nursing</p>
              </div>

              <nav
                className="mt-6 flex flex-col gap-2.5"
                aria-label="Mobile navigation links"
              >
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive =
                    link.href === "/home"
                      ? isHomeActive
                      : pathname.startsWith(link.href);

                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`squircle-pill flex min-h-[48px] items-center gap-3 border px-4 text-base font-semibold transition-colors ${
                        isActive
                          ? "border-rose bg-rose text-navy font-bold"
                          : "border-white/15 bg-white/5 text-white hover:border-rose/60 hover:bg-white/10"
                      }`}
                    >
                      <Icon
                        className={`h-5 w-5 ${
                          isActive ? "text-navy" : "text-rose-light"
                        }`}
                        aria-hidden="true"
                      />
                      <span>{link.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Bottom Drawer Footer: CC Rights */}
            <div className="border-t border-rose/30 pt-4 text-center">
              <CreativeCommonsNotice variant="inline" />
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
