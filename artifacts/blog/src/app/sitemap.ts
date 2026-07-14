import type { MetadataRoute } from "next";
import { getAllSlugs, getAllLanguages } from "@/lib/posts";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://commissionk.it";
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/blog`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
  ];

  const languages = getAllLanguages();

  const langIndexRoutes: MetadataRoute.Sitemap = languages.map((lang) => ({
    url: `${baseUrl}/blog/${lang}`,
    lastModified: now,
    changeFrequency: "daily",
    priority: 1.0,
    alternates: {
      languages: Object.fromEntries(languages.map((l) => [l, `${baseUrl}/blog/${l}`])),
    },
  }));

  const slugs = getAllSlugs();
  const postRoutes: MetadataRoute.Sitemap = slugs.flatMap(({ slug, languages }) => {
    return languages.map((lang) => ({
      url: `${baseUrl}/blog/${lang}/${slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: lang === "en" ? 0.9 : 0.8,
      alternates: {
        languages: Object.fromEntries(
          languages.map((l) => [l, `${baseUrl}/blog/${l}/${slug}`])
        ),
      },
    }));
  });

  return [...staticRoutes, ...langIndexRoutes, ...postRoutes];
}
