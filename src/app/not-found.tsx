import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Home, FileQuestion } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "الصفحة غير موجودة",
};

export default function NotFound() {
  return (
    <div className="flex min-h-[100dvh] flex-col">
      <Header />

      <main className="bg-grad-page flex flex-1 items-center justify-center px-4 py-16 sm:px-6">
        <div className="surface-light squircle-card mx-auto w-full max-w-lg border border-border-subtle bg-white p-8 text-center shadow-card-soft sm:p-10">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-tile bg-light-1 text-rose-dark">
            <FileQuestion className="h-8 w-8" aria-hidden="true" />
          </div>

          <div className="space-y-3">
            <p className="font-latin text-sm font-bold text-rose-dark">
              <bdi dir="ltr" lang="en">
                404
              </bdi>{" "}
              • الصفحة غير متوفرة
            </p>
            <h1 className="type-h1 font-bold text-navy">الصفحة غير موجودة</h1>
            <p className="type-body text-text-secondary">
              عذراً، لم نتمكن من العثور على الصفحة أو الإجراء السريري المطلوب. قد يكون الرابط تغيّر أو لم يُنشر بعد.
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

            <Link
              href="/procedures"
              className="squircle-pill type-button inline-flex min-h-[48px] w-full items-center justify-center gap-2 border border-border bg-light-1 px-6 text-rose-dark transition-colors hover:bg-page sm:w-auto"
            >
              <span>مكتبة الإجراءات</span>
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
