import Link from "next/link";
import { Clock, ArrowRight, Tag, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getAllPosts } from "@/lib/posts";
import { formatDate } from "@/lib/format";

export const dynamic = "force-static";

export default async function BlogIndex({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const allPosts = getAllPosts();
  const currentPage = Math.max(1, parseInt(params.page || "1", 10) || 1);
  const pageSize = 12;
  const totalPages = Math.ceil(allPosts.length / pageSize);
  const posts = allPosts.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  if (!allPosts.length) {
    return (
      <div className="text-center py-20">
        <h1 className="text-4xl font-bold text-foreground mb-4 tracking-tight">Blog</h1>
        <p className="text-muted-foreground mb-8">No articles yet. Create your first post in <code className="bg-muted px-1.5 py-0.5 rounded text-sm">articles/YYYY-MM-DD/slug/index.mdx</code>.</p>
        <Button asChild variant="outline">
          <a href="https://commissionk.it">Back to CommissionKit</a>
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
            "@type": "Blog",
            name: "CommissionKit Blog",
            description:
              "Expert insights on sales commission management, plan design, rep motivation, and revenue operations.",
            url: "https://commissionk.it/blog",
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
              url: `https://commissionk.it/blog/${p.slug}`,
              datePublished: p.date,
              ...(p.image && { image: p.image }),
            })),
          }),
        }}
      />
      <div className="mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/60 backdrop-blur-sm border border-border/60 text-xs font-medium text-muted-foreground mb-6">
          <Tag className="size-3.5 text-primary" />
          Insights
        </div>
        <h1 className="text-4xl font-bold text-foreground mb-4 tracking-tight">Blog</h1>
        <p className="text-lg text-muted-foreground max-w-2xl">
          Expert insights on sales commission management, plan design, rep motivation, and revenue operations.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <Link key={post.slug} href={`/${post.slug}`} className="group">
            <Card className="h-full overflow-hidden border-border hover:border-primary/20 transition-colors bg-card">
              {(post.image || post.coverImage) && (
                <div className="aspect-video w-full overflow-hidden bg-muted">
                  <img
                    src={post.image || post.coverImage}
                    alt={post.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
              )}
              <CardContent className={post.image || post.coverImage ? "pt-5" : "pt-6"}>
                {post.tags && post.tags.length > 0 && (
                  <div className="flex items-center gap-2 mb-3">
                    {post.tags.slice(0, 2).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-[10px]">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
                <h2 className="text-base font-semibold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                  {post.title}
                </h2>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                  {post.description}
                </p>
                <div className="flex items-center justify-between text-xs text-muted-foreground/70">
                  <span className="flex items-center gap-1">
                    <Clock className="size-3" />
                    {formatDate(post.date)}
                  </span>
                  <span>{post.readingTime}</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-16">
          {currentPage > 1 && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/?page=${currentPage - 1}`}>
                <ChevronLeft className="size-4 mr-1" />
                Previous
              </Link>
            </Button>
          )}
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          {currentPage < totalPages && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/?page=${currentPage + 1}`}>
                Next
                <ChevronRight className="size-4 ml-1" />
              </Link>
            </Button>
          )}
        </div>
      )}
    </>
  );
}
