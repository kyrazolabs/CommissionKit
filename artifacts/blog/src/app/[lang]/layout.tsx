import type { Metadata } from "next";
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

export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
  const { lang } = await params;
  const languages = getAllLanguages();

  return {
    alternates: {
      canonical: `/blog/${lang}`,
      languages: Object.fromEntries(languages.map((l) => [l, `/blog/${l}`])),
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
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
          <div className="flex min-h-screen flex-col selection:bg-primary/20 selection:text-primary">
            <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-sm">
              <div className="max-w-6xl mx-auto flex h-14 items-center px-4 sm:px-6">
                <div className="flex items-center gap-6">
                  <a
                    href="https://commissionk.it"
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {isRtl ? (
                      <ArrowLeft className={cn("size-4 rotate-180", isRtl && "rtl:rotate-180")} />
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
