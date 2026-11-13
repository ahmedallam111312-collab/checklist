import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    absolute: "Critical Ease: دخول الإدارة",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
