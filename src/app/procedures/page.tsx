import React from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProceduresLibraryClient } from "@/components/ProceduresLibraryClient";
import { getSiteSettings, getPublishedProcedures } from "@/lib/data";
import { AR_STRINGS } from "@/messages/ar";

export const dynamic = "force-dynamic";

export default async function ProceduresPage() {
  const [settings, procedures] = await Promise.all([
    getSiteSettings(),
    getPublishedProcedures(),
  ]);

  return (
    <div className="flex min-h-[100svh] flex-col">
      <Header siteName={settings.site_name} logoPath={settings.logo_path} />

      <main className="flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <div className="mx-auto max-w-[70rem]">
          {/* Header Title with type-h1 scale */}
          <div className="mb-8 text-center sm:text-start">
            <h1 className="type-h1 text-[var(--color-text)]">
              {AR_STRINGS.libraryTitle}
            </h1>
          </div>

          {/* Client Library with Search */}
          <ProceduresLibraryClient initialProcedures={procedures} />
        </div>
      </main>

      <Footer footerText={settings.footer_text} />
    </div>
  );
}
