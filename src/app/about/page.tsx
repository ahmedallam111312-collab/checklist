import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Info, Users, ShieldAlert } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { getSiteSettings } from "@/lib/data";
import { BRAND } from "@/config/brand";
import { AR_STRINGS } from "@/messages/ar";

export const metadata: Metadata = {
  title: AR_STRINGS.navAbout,
};

export default async function AboutPage() {
  const settings = await getSiteSettings();

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <Header siteName={settings.site_name} logoPath={settings.logo_path} />

      {/* Navy -> Plum About Hero */}
      <section className="bg-grad-hero surface-navy border-b-[3px] border-rose px-4 py-10 text-white sm:px-6 sm:py-14">
        <div className="mx-auto max-w-3xl space-y-3 text-start">
          <p className="text-xs font-bold text-rose-light">
            دليل الإجراءات التمريضية السريرية
          </p>
          <h1 className="type-display font-bold text-white">
            {AR_STRINGS.navAbout}
          </h1>
          <p className="type-body max-w-2xl leading-relaxed text-text-muted-navy">
            منصة مرجعية رقمية متخصصة في توثيق وتبسيط الإجراءات السريرية والتدريبية لتمريض الطوارئ والحالات الحرجة، تهدف لدعم الممارسة العملية الآمنة ورفع جاهزية الطلبة والكوادر التمريضية.
          </p>
        </div>
      </section>

      <main className="bg-grad-page flex-1 px-4 py-10 sm:px-6 lg:py-14">
        <div className="mx-auto max-w-3xl space-y-6">
          {/* Card 1: Educational Purpose */}
          <div className="surface-light squircle-card border border-border-subtle bg-white p-6 shadow-card-soft sm:p-8">
            <div className="mb-3 flex items-center gap-3 text-rose-dark">
              <Info className="h-5 w-5 shrink-0" aria-hidden="true" />
              <h2 className="type-h2 font-bold text-navy">الهدف التعليمي</h2>
            </div>
            <p className="type-body leading-relaxed text-text-secondary">
              تهدف منصة <bdi dir="ltr" lang="en" className="font-latin font-semibold text-navy">Critical Ease</bdi> إلى توفير مرجع سريري سريع وموثوق لطلبة وخريجي التمريض، يركز على الخطوات التنفيذية الدقيقة، وإبراز الخطوات الحرجة لسلامة المريض، مع تفصيل الأدوات والمعدات وموانع الاستخدام، للمساهمة في اتخاذ القرارات السريرية السليمة داخل أقسام الطوارئ والعناية المركزة.
            </p>
          </div>

          {/* Card 2: Team & Institutional Information */}
          <div className="surface-light squircle-card border border-border-subtle bg-white p-6 shadow-card-soft sm:p-8">
            <div className="mb-3 flex items-center gap-3 text-rose-dark">
              <Users className="h-5 w-5 shrink-0" aria-hidden="true" />
              <h2 className="type-h2 font-bold text-navy">
                معلومات الفريق والجهة
              </h2>
            </div>
            <p className="type-body leading-relaxed text-text-secondary">
              تم إعداد وتطوير هذا المحتوى بإشراف أكاديمي وسريري متخصص في تمريض الحالات الحرجة والطوارئ، بالتعاون مع الكوادر التدريبية والسريرية، بهدف توحيد المعايير الإجرائية وتيسير مراجعتها وفق أفضل الممارسات التمريضية المعتمدة.
            </p>
          </div>

          {/* Card 3: Educational Disclaimer */}
          <div className="surface-light squircle-card border border-warning/40 bg-warning-surface p-6 shadow-sm sm:p-8">
            <div className="mb-3 flex items-center gap-3 text-warning">
              <ShieldAlert className="h-5 w-5 shrink-0" aria-hidden="true" />
              <h2 className="type-h2 font-bold text-navy">
                إخلاء المسؤولية التعليمية
              </h2>
            </div>
            <p className="type-body leading-relaxed text-navy">
              {BRAND.footerDisclaimer}
            </p>
          </div>

          <div className="flex justify-start pt-2">
            <Link
              href="/procedures"
              className="btn-rose-cta squircle-pill type-button inline-flex min-h-[48px] items-center justify-center gap-3 px-7 text-navy"
            >
              <span>{AR_STRINGS.backToProcedures}</span>
              <ArrowLeft className="h-5 w-5 icon-mirror" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </main>

      <Footer
        footerText={settings.footer_text}
        siteName={settings.site_name}
      />
    </div>
  );
}
