import React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { getSiteSettings } from "@/lib/data";
import { AdminSettingsClient } from "@/components/admin/AdminSettingsClient";
import { AR_STRINGS } from "@/messages/ar";

export const metadata: Metadata = {
  title: "Platform Settings | Critical Ease",
};

export default async function AdminSettingsPage() {
  const settings = await getSiteSettings();

  return (
    <div className="space-y-4 text-start">
      <div className="flex items-center gap-2">
        <Link
          href="/admin"
          className="inline-flex min-h-[44px] items-center gap-1.5 text-xs sm:text-sm font-bold text-rose-dark hover:underline transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{AR_STRINGS.adminBackToDashboard}</span>
        </Link>
      </div>

      <div className="border-b border-border-subtle pb-3">
        <h1 className="type-h1 text-navy">
          {AR_STRINGS.adminSettings}
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Configure platform branding, homepage hero copy, and custom logo.
        </p>
      </div>

      <AdminSettingsClient initialSettings={settings} />
    </div>
  );
}
