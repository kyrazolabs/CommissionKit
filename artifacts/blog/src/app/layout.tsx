import type { Metadata, Viewport } from "next";
import { baseUrl } from "@/lib/baseUrl";

export const viewport: Viewport = {
  themeColor: "#0D9488",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "CommissionKit Blog | Sales Commission Management Guides",
    template: "%s | CommissionKit Blog",
  },
  description:
    "Expert guides on sales commission management, plan design, deal tracking, and automating commission calculations for B2B sales teams.",
  keywords: [
    "commission management",
    "sales compensation",
    "commission plans",
    "B2B sales",
    "spreadsheets",
    "commission tracking",
    "sales operations",
  ],
  authors: [{ name: "CommissionKit" }],
  creator: "CommissionKit",
  publisher: "CommissionKit",
  openGraph: {
    type: "website",
    siteName: "CommissionKit",
    locale: "en_US",
    url: `${baseUrl}/blog`,
    images: [{ url: `${baseUrl}/blog/og.png`, width: 1600, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    site: "@commissionkit",
    creator: "@commissionkit",
    images: [`${baseUrl}/blog/og.png`],
  },
  icons: {
    icon: [
      {
        url: "/blog/favicon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: [
      {
        url: "/blog/logo-symbol.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
    other: [
      {
        rel: "manifest",
        url: "/blog/manifest.webmanifest",
      },
    ],
  },
  manifest: "/blog/manifest.webmanifest",
  robots: {
    index: true,
    follow: true,
    "max-image-preview": "large",
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
    },
  },
  alternates: {
    canonical: "/blog",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
