import React from "react";
import { requireAdmin } from "@/lib/auth/admin";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { UndoToastProvider } from "@/components/admin/UndoToast";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side authentication check on all dashboard pages
  await requireAdmin();

  return (
    <UndoToastProvider>
      <AdminHeader />
      <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8 max-w-[76rem] mx-auto w-full">
        {children}
      </main>
    </UndoToastProvider>
  );
}
