"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RotateCcw, Home } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Application Error Boundary Caught]:", error?.message);
  }, [error]);

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <Header />

      <main className="bg-grad-page flex flex-1 items-center justify-center px-4 py-16 sm:px-6">
        <div className="surface-light squircle-card mx-auto w-full max-w-lg border border-critical/30 bg-white p-8 text-center shadow-card-soft sm:p-10">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-tile bg-critical-surface text-critical">
            <AlertCircle className="h-8 w-8" aria-hidden="true" />
          </div>

          <div className="space-y-3">
            <p className="font-latin text-sm font-bold text-critical">
              <bdi dir="ltr" lang="en">
                500
              </bdi>{" "}
              • خطأ غير متوقع
            </p>
            <h1 className="type-h1 font-bold text-navy">
              حدث خطأ أثناء تحميل الصفحة
            </h1>
            <p className="type-body text-text-secondary">
              تعذّر إتمام الطلب في الوقت الحالي. يمكنك إعادة المحاولة أو العودة إلى الصفحة الرئيسية.
            </p>
          </div>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/home"
              className="btn-rose-cta squircle-pill type-button inline-flex min-h-[48px] w-full items-center justify-center gap-2 px-6 text-navy sm:w-auto"
            >
              <Home className="h-4 w-4" aria-hidden="true" />
              <span>العودة للرئيسية</span>
            </Link>

            <button
              onClick={() => reset()}
              type="button"
              className="squircle-pill type-button inline-flex min-h-[48px] w-full items-center justify-center gap-2 border border-border bg-light-1 px-6 text-rose-dark transition-colors hover:bg-page sm:w-auto"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              <span>إعادة المحاولة</span>
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
