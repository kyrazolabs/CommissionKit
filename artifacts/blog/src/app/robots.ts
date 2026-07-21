import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/blog/",
        disallow: ["/blog/_next/", "/blog/api/"],
      },
      {
        userAgent: "GPTBot",
        allow: "/blog/",
        disallow: ["/blog/_next/", "/blog/api/"],
      },
      {
        userAgent: "ChatGPT-User",
        allow: "/blog/",
        disallow: ["/blog/_next/", "/blog/api/"],
      },
      {
        userAgent: "ClaudeBot",
        allow: "/blog/",
        disallow: ["/blog/_next/", "/blog/api/"],
      },
      {
        userAgent: "PerplexityBot",
        allow: "/blog/",
        disallow: ["/blog/_next/", "/blog/api/"],
      },
      {
        userAgent: "Google-Extended",
        allow: "/blog/",
        disallow: ["/blog/_next/", "/blog/api/"],
      },
      {
        userAgent: "meta-externalagent",
        allow: "/blog/",
        disallow: ["/blog/_next/", "/blog/api/"],
      },
      {
        userAgent: "cohere-ai",
        allow: "/blog/",
        disallow: ["/blog/_next/", "/blog/api/"],
      },
      {
        userAgent: "Googlebot",
        allow: "/blog/",
        disallow: ["/blog/_next/", "/blog/api/"],
      },
      {
        userAgent: "Bingbot",
        allow: "/blog/",
        disallow: ["/blog/_next/", "/blog/api/"],
      },
    ],
    sitemap: "https://commissionk.it/blog/sitemap.xml",
  };
}
