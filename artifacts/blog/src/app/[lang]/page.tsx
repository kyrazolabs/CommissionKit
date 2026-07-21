import type { Metadata } from "next";
import Link from "next/link";
import { Tag, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAllPosts, getAllLanguages } from "@/lib/posts";
import { t, formatPageXofY } from "@/lib/translations";
import { BlogGrid } from "@/components/blog-grid";

interface PageProps {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ page?: string }>;
}

export const dynamic = "force-static";

export async function generateStaticParams() {
  const languages = getAllLanguages();
  return languages.map((lang) => ({ lang }));
}

export const dynamicParams = true;

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
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
    title: dict.blog,
    description: dict.blogDescription,
    keywords: [
      "commission management",
      "sales compensation",
      "commission plans",
      "B2B sales",
      "sales operations",
      "sales strategy",
    ],
    authors: [{ name: "CommissionKit" }],
    openGraph: {
      type: "website",
      siteName: "CommissionKit",
      locale,
      url: `https://commissionk.it/blog/${lang}`,
      title: dict.blog,
      description: dict.blogDescription,
      images: [
        {
          url: "/blog/og.png",
          width: 1600,
          height: 630,
          alt: "CommissionKit Blog - Sales Commission Management Guides",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      site: "@commissionkit",
      creator: "@commissionkit",
      title: dict.blog,
      description: dict.blogDescription,
      images: ["/blog/og.png"],
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

export default async function BlogIndex({ params, searchParams }: PageProps) {
  const { lang } = await params;
  const dict = t(lang);

  const search = await searchParams;
  // Get posts for current language only
  const allPosts = getAllPosts(lang);
  const currentPage = Math.max(1, parseInt(search.page || "1", 10) || 1);
  const pageSize = 12;
  const totalPages = Math.ceil(allPosts.length / pageSize);
  const posts = allPosts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const isRtl = lang === "ar";

  if (!allPosts.length) {
    return (
      <div className="text-center py-20">
        <h1 className="text-4xl font-bold text-foreground mb-4 tracking-tight font-display">
          {dict.blog}
        </h1>
        <p className="text-muted-foreground mb-8">{dict.noArticles}</p>
        <Button asChild variant="outline">
          <a href="https://commissionk.it">{dict.backToHome}</a>
        </Button>
      </div>
    );
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "CommissionKit Blog",
            description: dict.blogDescription,
            url: `https://commissionk.it/blog/${lang}`,
            publisher: {
              "@type": "Organization",
              name: "CommissionKit",
              url: "https://commissionk.it",
              logo: {
                "@type": "ImageObject",
                url: "https://commissionk.it/brand/logo-full.svg",
              },
              sameAs: [
                "https://twitter.com/commissionkit",
                "https://www.linkedin.com/company/commissionkit",
              ],
            },
            potentialAction: {
              "@type": "SearchAction",
              target: {
                "@type": "EntryPoint",
                urlTemplate: `https://commissionk.it/blog/${lang}?q={search_term_string}`,
              },
              "query-input": "required name=search_term_string",
            },
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Blog",
            name: "CommissionKit Blog",
            description: dict.blogDescription,
            url: `https://commissionk.it/blog/${lang}`,
            publisher: {
              "@type": "Organization",
              name: "CommissionKit",
              url: "https://commissionk.it",
              logo: {
                "@type": "ImageObject",
                url: "https://commissionk.it/brand/logo-full.svg",
              },
            },
            blogPost: allPosts.slice(0, 50).map((p) => ({
              "@type": "BlogPosting",
              headline: p.title,
              description: p.description,
              url: `https://commissionk.it/blog/${lang}/${p.slug}`,
              datePublished: p.date,
              ...(p.image && { image: p.image }),
            })),
          }),
        }}
      />
      <div className="mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/60 backdrop-blur-sm border border-border/60 text-xs font-medium text-muted-foreground mb-6">
          <Tag className="size-3.5 text-primary" />
          {dict.insights}
        </div>
        <h1 className="text-4xl font-bold text-foreground mb-4 tracking-tight font-display">
          {dict.blog}
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl">
          {dict.blogDescription}
        </p>
      </div>

      <BlogGrid posts={posts} lang={lang} t={dict} />

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-16">
          {currentPage > 1 && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/blog/${lang}?page=${currentPage - 1}`}>
                <ChevronLeft className="size-4 me-1" />
                {dict.previous}
              </Link>
            </Button>
          )}
          <span className="text-sm text-muted-foreground">
            {formatPageXofY(dict, currentPage, totalPages)}
          </span>
          {currentPage < totalPages && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/blog/${lang}?page=${currentPage + 1}`}>
                {dict.next}
                <ChevronRight className="size-4 ms-1" />
              </Link>
            </Button>
          )}
        </div>
      )}
    </>
  );
}
