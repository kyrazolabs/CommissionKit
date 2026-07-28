import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatRelativeDate } from "@/lib/format";
import { getRelatedPosts } from "@/lib/posts";
import type { Translations } from "@/lib/translations";

interface RelatedArticlesProps {
  slug: string;
  tags: string[];
  lang: string;
  t: Translations;
}

export function RelatedArticles({ slug, tags, lang, t }: RelatedArticlesProps) {
  const related = getRelatedPosts(slug, tags, lang);

  if (related.length === 0) return null;

  return (
    <section className="mt-16 pt-8 border-t border-border">
      <h2 className="text-lg font-semibold text-foreground mb-6">
        {t.readAlso}
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {related.map((post) => (
          <Link
            key={`${post.slug}-${post.lang}`}
            href={`/blog/${lang}/${post.slug}`}
            className="group"
          >
            <Card className="h-full overflow-hidden border-border hover:border-primary/30 transition-colors bg-card">
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
              <CardHeader className="pb-2">
                <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors">
                  {post.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {post.description}
                </p>
                <div className="flex items-center justify-between text-xs text-muted-foreground/70">
                  <span className="flex items-center gap-1">
                    <Clock className="size-3" />
                    {formatRelativeDate(post.date, lang)}
                  </span>
                  <span>{post.readingTime}</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
