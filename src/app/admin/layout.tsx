import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Dashboard | Critical Ease",
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
    <div className="surface-light min-h-[100svh] bg-grad-page text-navy flex flex-col" dir="ltr">
      {children}
    </div>
  );
}
