"use client";

import Link from "next/link";
import { Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/format";
import type { Translations } from "@/lib/translations";
import { cn } from "@/lib/utils";

interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  author?: string;
  tags?: string[];
  image?: string;
  coverImage?: string;
  lang?: string;
  readingTime: string;
}

interface BlogGridProps {
  posts: BlogPost[];
  lang: string;
  t: Translations;
}

export function BlogGrid({ posts, lang, t }: BlogGridProps) {
  const isRtl = lang === "ar";

  return (
    <div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <Link key={`${post.slug}-${post.lang}`} href={`/blog/${lang}/${post.slug}`} className="group">
            <Card className="h-full overflow-hidden border-border hover:border-primary/20 transition-colors bg-card relative">
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
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{post.description}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground/70">
                  <span className="flex items-center gap-1">
                    <Clock className="size-3" />
                    {formatDate(post.date, lang)}
                  </span>
                  <span>{post.readingTime}</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {posts.length === 0 && (
        <div className="text-center py-16">
          <p className="text-muted-foreground">{t.noArticlesFilter}</p>
        </div>
      )}
    </div>
  );
}
