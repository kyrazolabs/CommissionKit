import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "CommissionKit Blog — Sales Commission Insights",
    template: "%s — CommissionKit Blog",
  },
  description:
    "Expert insights on sales commission management, plan design, rep motivation, and revenue operations. Articles on flat-rate, tiered, and accelerator commission structures.",
  metadataBase: new URL("https://commissionk.it"),
  alternates: {
    canonical: "/blog",
    types: { "application/rss+xml": [{ url: "/blog/rss.xml", title: "CommissionKit Blog" }] },
  },
  openGraph: {
    type: "website",
    siteName: "CommissionKit Blog",
    locale: "en",
    url: "https://commissionk.it/blog",
    title: "CommissionKit Blog — Sales Commission Insights",
    description:
      "Expert insights on sales commission management, plan design, rep motivation, and revenue operations.",
    images: [
      { url: "https://commissionk.it/brand/og-image.png", width: 1200, height: 630, alt: "CommissionKit Blog" },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CommissionKit Blog — Sales Commission Insights",
    description:
      "Expert insights on sales commission management, plan design, rep motivation, and revenue operations.",
    images: ["https://commissionk.it/brand/og-image.png"],
  },
  robots: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
  other: {
    "llms:full": "https://commissionk.it/blog/llms.txt",
    "llms:description":
      "CommissionKit Blog — expert articles on sales commission management, plan design, rep motivation, and revenue operations. Open to AI crawlers for search and grounding.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <meta name="theme-color" content="#0D9488" />
        {/* Umami Analytics — privacy-first analytics */}
        <script defer src="https://a.commissionk.it/script.js" data-website-id="75bac959-4dc2-414b-b9c7-bafaeeff3db2"></script>
      </head>
      <body className={cn("min-h-screen bg-sidebar font-sans antialiased")}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
          <div className="flex min-h-screen flex-col selection:bg-primary/20 selection:text-primary">
            <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-sm">
              <div className="max-w-6xl mx-auto flex h-14 items-center px-4 sm:px-6">
                <div className="flex items-center gap-6">
                  <a href="https://commissionk.it" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft className="size-4" />
                    <span className="hidden sm:inline">commissionk.it</span>
                  </a>
                  <a href="/blog" className="text-sm font-semibold text-foreground hover:text-primary transition-colors">
                    Blog
                  </a>
                </div>
              </div>
            </header>
            <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 pt-12 md:pt-20 pb-16 md:pb-28">
              {children}
            </main>
            <footer className="border-t border-border bg-background">
              <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center px-4 sm:px-6 py-6 gap-4">
                <p className="text-[11px] text-muted-foreground/80 font-medium tracking-wide">
                  &copy; {new Date().getFullYear()} COMMISSIONKIT. ALL RIGHTS RESERVED.
                </p>
                <nav className="flex gap-6">
                  <a href="https://commissionk.it/privacy" className="text-xs text-muted-foreground hover:text-primary transition-colors">Privacy</a>
                  <a href="https://commissionk.it/terms" className="text-xs text-muted-foreground hover:text-primary transition-colors">Terms</a>
                  <a href="https://commissionk.it" className="text-xs text-muted-foreground hover:text-primary transition-colors">Home</a>
                </nav>
              </div>
            </footer>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
