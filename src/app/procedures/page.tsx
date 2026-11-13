import React from "react";
import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProceduresLibraryClient } from "@/components/ProceduresLibraryClient";
import { getSiteSettings, getPublishedProcedures } from "@/lib/data";
import { AR_STRINGS } from "@/messages/ar";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: AR_STRINGS.libraryTitle,
};

export default async function ProceduresPage() {
  const [settings, procedures] = await Promise.all([
    getSiteSettings(),
    getPublishedProcedures(),
  ]);

  return (
    <div className="flex min-h-[100dvh] flex-col bg-list-page">
      <Header siteName={settings.site_name} logoPath={settings.logo_path} />

      <main className="flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <div className="mx-auto max-w-[70rem]">
          {/* Section Title with Vertical Rose Bar */}
          <div className="mb-8 flex items-center gap-3">
            <span
              className="h-8 w-1.5 rounded-full bg-rose"
              aria-hidden="true"
            />
            <h1 className="type-h1 font-bold text-navy">
              {AR_STRINGS.libraryTitle}
            </h1>
          </div>

          <ProceduresLibraryClient initialProcedures={procedures} />
        </div>
      </main>

      <Footer
        footerText={settings.footer_text}
        siteName={settings.site_name}
      />
    </div>
  );
}
