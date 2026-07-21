import type { Metadata, Viewport } from "next";

export const viewport: Viewport = {
  themeColor: "#0D9488",
  width: "device-width",
  initialScale: 1,
};
import { ThemeProvider } from "next-themes";
import { ArrowLeft } from "lucide-react";
import { getAllLanguages } from "@/lib/posts";
import { t, formatAllRightsReserved } from "@/lib/translations";
import { cn } from "@/lib/utils";
import "../globals.css";

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}

export async function generateMetadata({
  params,
}: LayoutProps): Promise<Metadata> {
  const { lang } = await params;
  const languages = getAllLanguages();
  const dict = t(lang);

  const localeMap: Record<string, string> = {
    en: "en_US",
    ar: "ar_AR",
    es: "es_ES",
    fr: "fr_FR",
    de: "de_DE",
    pt: "pt_BR",
    hi: "hi_IN",
  };
  const locale = localeMap[lang] ?? "en_US";

  return {
    metadataBase: new URL("https://commissionk.it"),
    title: {
      default: dict.blog,
      template: "%s | CommissionKit Blog",
    },
    description: dict.blogDescription,
    keywords: [
      "commission management",
      "sales compensation",
      "commission plans",
      "B2B sales",
      "sales operations",
      "sales strategy",
    ],
    openGraph: {
      type: "website",
      siteName: "CommissionKit",
      locale,
      url: `https://commissionk.it/blog/${lang}`,
      title: dict.blog,
      description: dict.blogDescription,
      images: [{ url: "/blog/og.png", width: 1600, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      site: "@commissionkit",
      creator: "@commissionkit",
      title: dict.blog,
      description: dict.blogDescription,
      images: ["/blog/og.png"],
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
          type: "image/svg+xml",
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
      canonical: `/blog/${lang}`,
      languages: {
        ...Object.fromEntries(languages.map((l) => [l, `/blog/${l}`])),
        "x-default": "/blog/en",
      },
    },
  };
}

export default async function LangLayout({ children, params }: LayoutProps) {
  const { lang } = await params;
  const dict = t(lang);

  const dir = lang === "ar" ? "rtl" : "ltr";
  const isRtl = dir === "rtl";

  return (
    <html lang={lang} dir={dir} suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <div className="flex min-h-screen flex-col selection:bg-primary/20 selection:text-primary">
            <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-sm">
              <div className="max-w-6xl mx-auto flex h-14 items-center px-4 sm:px-6">
                <div className="flex items-center gap-6">
                  <a
                    href="https://commissionk.it"
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {isRtl ? (
                      <ArrowLeft
                        className={cn(
                          "size-4 rotate-180",
                          isRtl && "rtl:rotate-180",
                        )}
                      />
                    ) : (
                      <ArrowLeft className="size-4" />
                    )}
                    <span className="hidden sm:inline">{dict.backToSite}</span>
                  </a>
                  <a
                    href={`/blog/${lang}`}
                    className="text-sm font-semibold text-foreground hover:text-primary transition-colors"
                  >
                    {dict.blog}
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
                  {formatAllRightsReserved(dict, new Date().getFullYear())}
                </p>
                <nav className="flex gap-6">
                  <a
                    href="https://commissionk.it/privacy"
                    className="text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    {dict.privacy}
                  </a>
                  <a
                    href="https://commissionk.it/terms"
                    className="text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    {dict.terms}
                  </a>
                  <a
                    href="https://commissionk.it"
                    className="text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    {dict.home}
                  </a>
                </nav>
              </div>
            </footer>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
