import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "إدارة ProfNurse — لوحة التحكم",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-[100svh] bg-[var(--color-background)] text-[var(--color-text)] flex flex-col">
      {children}
    </div>
  );
}
