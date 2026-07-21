import type { MetadataRoute } from "next";
import { getAllSlugs, getAllLanguages } from "@/lib/posts";
import { baseUrl } from "@/lib/baseUrl";

function buildAlternates(
  languages: string[],
  urlForLang: (lang: string) => string,
) {
  const map: Record<string, string> = Object.fromEntries(
    languages.map((l) => [l, urlForLang(l)]),
  );
  map["x-default"] = urlForLang("en");
  return map;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const languages = getAllLanguages();

  const langIndexRoutes: MetadataRoute.Sitemap = languages.map((lang) => ({
    url: `${baseUrl}/blog/${lang}`,
    lastModified: now,
    changeFrequency: "daily",
    priority: 1.0,
    alternates: {
      languages: buildAlternates(languages, (l) => `${baseUrl}/blog/${l}`),
    },
  }));

  const slugs = getAllSlugs();
  const postRoutes: MetadataRoute.Sitemap = slugs.flatMap(
    ({ slug, languages }) => {
      return languages.map((lang) => ({
        url: `${baseUrl}/blog/${lang}/${slug}`,
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: lang === "en" ? 0.9 : 0.8,
        alternates: {
          languages: buildAlternates(
            languages,
            (l) => `${baseUrl}/blog/${l}/${slug}`,
          ),
        },
      }));
    },
  );

  return [...langIndexRoutes, ...postRoutes];
}
