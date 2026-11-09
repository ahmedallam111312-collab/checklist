import React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { ProcedureEditor } from "@/components/admin/ProcedureEditor";
import { AR_STRINGS } from "@/messages/ar";

export const metadata: Metadata = {
  title: "إضافة إجراء جديد — ProfNurse",
};

export default function NewProcedurePage() {
  return (
    <div className="space-y-4 text-start">
      <div className="flex items-center gap-2">
        <Link
          href="/admin"
          className="inline-flex min-h-[44px] items-center gap-1.5 text-xs sm:text-sm font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)]"
        >
          <ArrowRight className="h-4 w-4 icon-mirror" />
          <span>{AR_STRINGS.adminBackToDashboard}</span>
        </Link>
      </div>

      <div className="border-b border-[var(--color-border-subtle)] pb-3">
        <h1 className="type-h1 text-[var(--color-text)]">
          {AR_STRINGS.adminAddProcedure}
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)] font-arabic">
          أدخل البيانات الأساسية للإجراء الجديد لبدء مسودة الإجراء.
        </p>
      </div>

      <ProcedureEditor isNew={true} />
    </div>
  );
}
