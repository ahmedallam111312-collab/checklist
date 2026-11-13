"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail, Loader2, ArrowRight } from "lucide-react";
import { Logo } from "@/components/Logo";
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
        window.location.href = "/admin";
      }
    });
  };

  return (
    <div className="surface-light flex min-h-[100dvh] flex-col items-center justify-center p-4">
      <div className="squircle-card w-full max-w-sm rounded-card border border-border-subtle bg-white p-6 sm:p-8 shadow-card-soft text-start">
        {/* Logo and Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <Logo
            variant="light"
            width={190}
            height={97}
            priority
            className="h-auto w-[176px]"
          />
          <h1 className="mt-4 text-xl font-bold text-navy">
            <bdi dir="ltr">Critical Ease</bdi>: دخول الإدارة
          </h1>
          <p className="mt-1 text-xs text-text-secondary font-arabic">
            {AR_STRINGS.adminLoginSubtitle}
          </p>
        </div>

        {/* Error message (Generic Arabic: no user enumeration) */}
        {error && (
          <div
            role="alert"
            className="mb-4 rounded-lg border border-danger/40 bg-danger-surface p-3 text-xs font-semibold text-danger text-start"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="admin_email"
              className="block text-xs font-semibold text-text-secondary mb-1.5"
            >
              {AR_STRINGS.fieldEmail}
            </label>
            <div className="relative">
              <input
                id="admin_email"
                type="email"
                required
                autoComplete="username"
                enterKeyHint="next"
                dir="ltr"
                lang="en"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="squircle-pill w-full min-h-[44px] rounded-pill border border-border bg-search-bg px-3 ps-10 text-sm text-navy placeholder:text-text-secondary/70 focus:border-rose-dark focus:outline-none focus:ring-2 focus:ring-rose-dark/25 font-mono"
              />
              <Mail className="absolute start-3.5 top-3 h-4 w-4 text-text-secondary" aria-hidden="true" />
            </div>
          </div>

          <div>
            <label
              htmlFor="admin_password"
              className="block text-xs font-semibold text-text-secondary mb-1.5"
            >
              {AR_STRINGS.fieldPassword}
            </label>
            <div className="relative">
              <input
                id="admin_password"
                type="password"
                required
                autoComplete="current-password"
                enterKeyHint="go"
                dir="ltr"
                lang="en"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="squircle-pill w-full min-h-[44px] rounded-pill border border-border bg-search-bg px-3 ps-10 text-sm text-navy placeholder:text-text-secondary/70 focus:border-rose-dark focus:outline-none focus:ring-2 focus:ring-rose-dark/25 font-mono"
              />
              <Lock className="absolute start-3.5 top-3 h-4 w-4 text-text-secondary" aria-hidden="true" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="squircle-pill btn-rose-cta w-full min-h-[44px] mt-2 inline-flex items-center justify-center gap-2 rounded-pill px-4 py-2.5 text-sm font-bold text-navy active:scale-[0.98] disabled:opacity-50"
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
    </div>
  );
}
