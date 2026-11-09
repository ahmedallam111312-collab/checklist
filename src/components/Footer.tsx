import React from "react";

interface FooterProps {
  footerText?: string;
}

export function Footer({ footerText }: FooterProps) {
  if (!footerText) return null;

  return (
    <footer className="mt-auto border-t border-[var(--color-border-subtle)] bg-[var(--color-surface)] py-8 text-center text-sm text-[var(--color-text-muted)]">
      <div className="mx-auto max-w-[70rem] px-4 sm:px-6">
        <p className="leading-relaxed">{footerText}</p>
      </div>
    </footer>
  );
}
