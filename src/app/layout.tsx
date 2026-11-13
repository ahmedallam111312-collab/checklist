import type { Metadata, Viewport } from "next";
import { Roboto, IBM_Plex_Sans_Arabic } from "next/font/google";
import "./globals.css";
import { DemoBanner } from "@/components/DemoBanner";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { BRAND } from "@/config/brand";
import { getSiteUrl } from "@/lib/env";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-roboto",
  display: "swap",
  adjustFontFallback: true,
});

const ibmPlexSansArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "700"],
  variable: "--font-ibm-plex-sans-arabic",
  display: "swap",
  adjustFontFallback: true,
});

export const metadata: Metadata = {
  title: {
    default: `${BRAND.name} — ${BRAND.tagline}`,
    template: `%s | ${BRAND.name}`,
  },
  description: BRAND.heroDescription,
  metadataBase: new URL(getSiteUrl()),
  openGraph: {
    title: `${BRAND.name} — ${BRAND.tagline}`,
    description: BRAND.heroDescription,
    siteName: BRAND.name,
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/brand/og-image.png",
        width: 1200,
        height: 630,
        alt: `${BRAND.name} — ${BRAND.tagline}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${BRAND.name} — ${BRAND.tagline}`,
    description: BRAND.heroDescription,
    images: ["/brand/og-image.png"],
  },
  icons: {
    icon: [
      { url: "/brand/favicon.ico", sizes: "any" },
      { url: "/brand/favicon-32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      {
        url: "/brand/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0B2146",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      dir="ltr"
      className={`${roboto.variable} ${ibmPlexSansArabic.variable}`}
      suppressHydrationWarning
    >
      <body
        className="min-h-[100dvh] flex flex-col font-sans text-text antialiased selection:bg-rose/25 selection:text-navy"
        suppressHydrationWarning
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-pill focus:bg-rose focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-navy focus:shadow-lg"
        >
          Skip to main content
        </a>
        <DemoBanner />
        <OfflineIndicator />
        <div id="main-content" className="flex-1 flex flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
