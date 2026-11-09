"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail, Loader2, ArrowRight } from "lucide-react";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { loginAdmin } from "@/app/admin/actions/auth";
import { AR_STRINGS } from "@/messages/ar";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData();
    formData.append("email", email);
    formData.append("password", password);

    startTransition(async () => {
      const result = await loginAdmin(null, formData);
      if (result.error) {
        setError(result.error);
      } else if (result.success) {
        router.push("/admin");
        router.refresh();
      }
    });
  };

  return (
    <div className="flex min-h-[100svh] flex-col items-center justify-between p-4">
      {/* Top Bar with Theme Toggle (In-flow to prevent overlap with DemoBanner) */}
      <div className="w-full max-w-sm flex items-center justify-end pt-2 pb-2">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-sm rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-6 sm:p-8 shadow-xl text-start my-auto">
        {/* Logo and Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <Logo size={48} />
          <h1 className="mt-4 text-xl font-bold text-[var(--color-text)]">
            {AR_STRINGS.adminLoginTitle}
          </h1>
          <p className="mt-1 text-xs text-[var(--color-text-muted)] font-arabic">
            {AR_STRINGS.adminLoginSubtitle}
          </p>
        </div>

        {/* Error message (Generic Arabic: no user enumeration) */}
        {error && (
          <div
            role="alert"
            className="mb-4 rounded-md border border-[var(--color-danger)]/40 bg-[var(--color-danger-surface)] p-3 text-xs font-semibold text-[var(--color-danger)] text-start animate-in fade-in"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="admin_email"
              className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1"
            >
              {AR_STRINGS.fieldEmail}
            </label>
            <div className="relative">
              <input
                id="admin_email"
                type="email"
                required
                autoComplete="email"
                dir="ltr"
                lang="en"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full min-h-[44px] rounded-md border border-[var(--color-border)] bg-[var(--color-surface-sunken)] px-3 ps-9 text-sm text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] font-mono"
              />
              <Mail className="absolute start-3 top-3 h-4 w-4 text-[var(--color-text-muted)]" aria-hidden="true" />
            </div>
          </div>

          <div>
            <label
              htmlFor="admin_password"
              className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1"
            >
              {AR_STRINGS.fieldPassword}
            </label>
            <div className="relative">
              <input
                id="admin_password"
                type="password"
                required
                autoComplete="current-password"
                dir="ltr"
                lang="en"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full min-h-[44px] rounded-md border border-[var(--color-border)] bg-[var(--color-surface-sunken)] px-3 ps-9 text-sm text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] font-mono"
              />
              <Lock className="absolute start-3 top-3 h-4 w-4 text-[var(--color-text-muted)]" aria-hidden="true" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full min-h-[44px] mt-2 inline-flex items-center justify-center gap-2 rounded-md bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-[var(--color-on-primary)] transition-transform active:scale-95 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)]"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>جاري تسجيل الدخول...</span>
              </>
            ) : (
              <>
                <span>{AR_STRINGS.loginButton}</span>
                <ArrowRight className="h-4 w-4 icon-mirror" />
              </>
            )}
          </button>
        </form>
      </div>

      <div className="h-4 sm:h-6" aria-hidden="true" />
    </div>
  );
}
