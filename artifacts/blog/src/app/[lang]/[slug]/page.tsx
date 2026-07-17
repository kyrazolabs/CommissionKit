import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock, ArrowLeft, Tag, Share2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getPost, getAvailableLanguages, getAllSlugs } from "@/lib/posts";
import { t, formatFallbackBanner, formatReadIn } from "@/lib/translations";
import { formatRelativeDate } from "@/lib/format";
import { MDXRemote } from "next-mdx-remote/rsc";
import { LanguagePills } from "@/components/language-pills";
import { FallbackBanner } from "@/components/fallback-banner";
import { cn } from "@/lib/utils";

interface Props {
  params: Promise<{ lang: string; slug: string }>;
}

export async function generateStaticParams() {
  const slugs = getAllSlugs();
  const params: { lang: string; slug: string }[] = [];

  for (const { slug, languages } of slugs) {
    for (const lang of languages) {
      params.push({ lang, slug });
    }
  }

  return params;
}

export const dynamicParams = true;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, slug } = await params;
  const post = getPost(slug, lang);
  const dict = t(lang);
  if (!post) return { title: dict.postNotFound };

  const availableLanguages = getAvailableLanguages(slug);
  const ogImage = post.coverImage || post.image;
  const canonicalUrl = `https://commissionk.it/blog/${lang}/${slug}`;

  const hreflangLanguages: Record<string, string> = {};
  for (const l of availableLanguages) {
    hreflangLanguages[l] = `https://commissionk.it/blog/${l}/${slug}`;
  }
  hreflangLanguages["x-default"] = `https://commissionk.it/blog/en/${slug}`;

  return {
    metadataBase: new URL("https://commissionk.it"),
    title: post.title,
    description: post.description || "",
    alternates: {
      canonical: canonicalUrl,
      languages: hreflangLanguages,
    },
    openGraph: {
      type: "article",
      siteName: "CommissionKit",
      locale: lang === "ar" ? "ar_AR" : lang,
      title: `${post.title} — Blog`,
      description: post.description || "",
      url: canonicalUrl,
      publishedTime: post.date,
      images: ogImage
        ? [{ url: ogImage, width: 1200, height: 630 }]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: `${post.title} — Blog`,
      description: post.description || "",
      images: ogImage ? [ogImage] : undefined,
    },
    robots: "index, follow, max-image-preview:large, max-snippet:-1",
    other: {
      "article:published_time": post.date,
      ...(post.tags?.length && { "article:tag": post.tags.join(",") }),
    },
  };
}

export default async function BlogPost({ params }: Props) {
  const { lang, slug } = await params;
  const dict = t(lang);

  let post = getPost(slug, lang);
  let isFallback = false;

  if (!post && lang !== "en") {
    post = getPost(slug, "en");
    isFallback = true;
  }

  if (!post) notFound();

  const availableLanguages = getAvailableLanguages(slug);
  const isRtl = lang === "ar";
  const fallbackUrl = `/blog/en/${slug}`;
  const ogImage = post.coverImage || post.image;
  const canonicalUrl = `https://commissionk.it/blog/${lang}/${slug}`;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: post.title,
            description: post.description,
            url: canonicalUrl,
            datePublished: post.date,
            dateModified: post.date,
            ...(ogImage ? { image: ogImage } : {}),
            ...(post.author
              ? { author: { "@type": "Person", name: post.author } }
              : {}),
            ...(post.tags?.length ? { keywords: post.tags.join(", ") } : {}),
            publisher: {
              "@type": "Organization",
              name: "CommissionKit",
              url: "https://commissionk.it",
              logo: {
                "@type": "ImageObject",
                url: "https://commissionk.it/brand/logo-full.svg",
              },
            },
            mainEntityOfPage: {
              "@type": "WebPage",
              "@id": canonicalUrl,
            },
          }),
        }}
      />
      <article className="max-w-3xl mx-auto">
        {isFallback && (
          <FallbackBanner
            message={formatFallbackBanner(
              dict,
              dict.languageNames[lang] ?? lang,
              dict.languageNames.en ?? "en",
            )}
            readInLabel={formatReadIn(dict, dict.languageNames.en ?? "en")}
            fallbackUrl={fallbackUrl}
          />
        )}

        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="mb-0 -ms-3 text-muted-foreground"
            >
              <Link href={`/blog/${lang}`}>
                <ArrowLeft
                  className={cn("size-4 me-1", isRtl && "rtl:rotate-180")}
                />
                {dict.backToBlog}
              </Link>
            </Button>

            {availableLanguages.length >= 2 && (
              <LanguagePills
                slug={slug}
                currentLang={lang}
                availableLanguages={availableLanguages}
                t={dict}
              />
            )}
          </div>

          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {post.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-[10px]">
                  <Tag className="size-3 me-1" />
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4 tracking-tight">
            {post.title}
          </h1>

          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6 flex-wrap">
            <span className="flex items-center gap-1.5">
              <Clock className="size-4" />
              {formatRelativeDate(post.date, lang)}
            </span>
            <span className="text-muted-foreground/40">&middot;</span>
            <span>{post.readingTime}</span>
          </div>
        </div>

        {ogImage && (
          <img
            src={ogImage}
            alt={post.title}
            className="w-full rounded-xl mb-10 object-cover max-h-[500px]"
          />
        )}

        <div className="blog-content" dir={isRtl ? "rtl" : "ltr"}>
          <MDXRemote source={post.content} />
        </div>

        <div className="mt-16 pt-8 border-t border-border">
          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/blog/${lang}`}>
                <ArrowLeft
                  className={cn("size-4 me-1", isRtl && "rtl:rotate-180")}
                />
                {dict.backToBlog}
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(canonicalUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Share2 className={cn("size-4 me-1", isRtl && "ms-1")} />
                {dict.share}
              </a>
            </Button>
          </div>
        </div>
      </article>
    </>
  );
}
