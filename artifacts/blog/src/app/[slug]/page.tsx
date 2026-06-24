import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock, ArrowLeft, Tag, Share2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getPost } from "@/lib/posts";
import { formatDate } from "@/lib/format";
import { MDXRemote } from "next-mdx-remote/rsc";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return { title: "Post Not Found" };

  const ogImage = post.image || post.coverImage;
  return {
    title: post.title,
    description: post.description || "",
    alternates: { canonical: `https://commissionk.it/blog/${post.slug}` },
    openGraph: {
      type: "article",
      siteName: "CommissionKit",
      title: `${post.title} — Blog`,
      description: post.description || "",
      url: `https://commissionk.it/blog/${post.slug}`,
      publishedTime: post.date,
      images: ogImage ? [{ url: ogImage, width: 1200, height: 630 }] : undefined,
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
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

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
            url: `https://commissionk.it/blog/${post.slug}`,
            datePublished: post.date,
            dateModified: post.date,
            ...(post.image || post.coverImage
              ? { image: post.image || post.coverImage }
              : {}),
            ...(post.author ? { author: { "@type": "Person", name: post.author } } : {}),
            ...(post.tags?.length
              ? { keywords: post.tags.join(", ") }
              : {}),
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
              "@id": `https://commissionk.it/blog/${post.slug}`,
            },
          }),
        }}
      />
      <article className="max-w-3xl mx-auto">
      <div className="mb-8">
        <Button variant="ghost" size="sm" asChild className="mb-6 -ml-3 text-muted-foreground">
          <Link href="/">
            <ArrowLeft className="size-4 mr-1" />
            Back to Blog
          </Link>
        </Button>

        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-[10px]">
                <Tag className="size-3 mr-1" />
                {tag}
              </Badge>
            ))}
          </div>
        )}

        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4 tracking-tight">
          {post.title}
        </h1>

        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-8">
          <span className="flex items-center gap-1.5">
            <Clock className="size-4" />
            {formatDate(post.date)}
          </span>
          <span className="text-muted-foreground/40">&middot;</span>
          <span>{post.readingTime}</span>
        </div>
      </div>

      {(post.image || post.coverImage) && (
        <img
          src={post.image || post.coverImage}
          alt={post.title}
          className="w-full rounded-xl mb-10 object-cover max-h-[500px]"
        />
      )}

      <div className="blog-content">
        <MDXRemote source={post.content} />
      </div>

      <div className="mt-16 pt-8 border-t border-border">
        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" asChild>
            <Link href="/">
              <ArrowLeft className="size-4 mr-1" />
              Back to Blog
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(`https://commissionk.it/blog/${post.slug}`)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Share2 className="size-4 mr-1" />
              Share
            </a>
          </Button>
        </div>
      </div>
    </article>
    </>
  );
}
