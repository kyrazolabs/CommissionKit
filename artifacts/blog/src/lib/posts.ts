import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const ARTICLES_DIR = process.env.BLOG_ARTICLES_DIR
  ? path.resolve(process.env.BLOG_ARTICLES_DIR)
  : path.join(process.cwd(), "articles");

export interface BlogPostMeta {
  slug: string;
  title: string;
  description: string;
  date: string;
  author?: string;
  tags?: string[];
  keywords?: string[];
  image?: string;
  coverImage?: string;
  lang?: string;
  availableLanguages?: string[];
  ogImage?: string;
}

export interface BlogPost extends BlogPostMeta {
  content: string;
  readingTime: string;
}

function extractSlug(dirPath: string): string {
  return path.basename(dirPath);
}

function parseDate(dirPath: string): string {
  const parent = path.basename(path.dirname(dirPath));
  const match = parent.match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : "";
}

function calcReadingTime(content: string): string {
  const words = content.split(/\s+/).filter(Boolean).length;
  const minutes = Math.ceil(words / 200);
  return `${minutes} min read`;
}

function getLanguageFilePath(slugDir: string, lang: string): string | null {
  const mdxPath = path.join(slugDir, `${lang}.mdx`);
  const mdPath = path.join(slugDir, `${lang}.md`);
  if (fs.existsSync(mdxPath)) return mdxPath;
  if (fs.existsSync(mdPath)) return mdPath;
  return null;
}

function readPostFile(slugDir: string, filePath: string, slug: string, lang: string): BlogPost {
  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);

  const coverPath = (["cover.webp", "cover.png", "cover.jpg", "cover.jpeg"] as const)
    .map((ext) => path.join(slugDir, ext))
    .find((p) => fs.existsSync(p));
  const coverImage = coverPath ? `/blog/api/cover/${slug}` : undefined;

  // OG image: use the article cover, or fall back to the generic og.png
  const ogImage = coverImage || "/blog/og.png";

  return {
    slug,
    title: data.title || slug.replace(/-/g, " "),
    description: data.description || "",
    date: data.date || parseDate(slugDir),
    author: data.author,
    tags: data.tags || [],
    keywords: data.keywords || [],
    image: data.image,
    coverImage,
    ogImage,
    content,
    readingTime: calcReadingTime(content),
    lang,
  };
}

export function getPost(slug: string, lang: string): BlogPost | null {
  if (!fs.existsSync(ARTICLES_DIR)) return null;

  const entries = fs.readdirSync(ARTICLES_DIR, { withFileTypes: true });
  for (const dateEntry of entries) {
    if (!dateEntry.isDirectory()) continue;

    const slugDir = path.join(ARTICLES_DIR, dateEntry.name, slug);
    if (!fs.existsSync(slugDir) || !fs.statSync(slugDir).isDirectory()) continue;

    const filePath = getLanguageFilePath(slugDir, lang);
    if (!filePath) return null;

    return readPostFile(slugDir, filePath, slug, lang);
  }

  return null;
}

export function getAllPosts(lang?: string): BlogPost[] {
  const posts: BlogPost[] = [];

  if (!fs.existsSync(ARTICLES_DIR)) return posts;

  const dateEntries = fs.readdirSync(ARTICLES_DIR, { withFileTypes: true });

  for (const dateEntry of dateEntries) {
    if (!dateEntry.isDirectory()) continue;
    const dateDir = path.join(ARTICLES_DIR, dateEntry.name);

    const slugEntries = fs.readdirSync(dateDir, { withFileTypes: true });
    for (const slugEntry of slugEntries) {
      if (!slugEntry.isDirectory()) continue;

      const slugDir = path.join(dateDir, slugEntry.name);
      const slug = extractSlug(slugDir);

      if (lang) {
        const filePath = getLanguageFilePath(slugDir, lang);
        if (!filePath) continue;
        const post = readPostFile(slugDir, filePath, slug, lang);
        if (!post.date || post.date === "") {
          post.date = parseDate(slugDir);
        }
        posts.push(post);
      } else {
        for (const file of fs.readdirSync(slugDir)) {
          const match = file.match(/^([a-z]{2})\.(mdx|md)$/);
          if (!match) continue;
          const fileLang = match[1];
          const filePath = path.join(slugDir, file);
          const post = readPostFile(slugDir, filePath, slug, fileLang);
          if (!post.date || post.date === "") {
            post.date = parseDate(slugDir);
          }
          posts.push(post);
        }
      }
    }
  }

  posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return posts;
}

export function getAvailableLanguages(slug: string): string[] {
  const languages: string[] = [];

  if (!fs.existsSync(ARTICLES_DIR)) return languages;

  const entries = fs.readdirSync(ARTICLES_DIR, { withFileTypes: true });
  for (const dateEntry of entries) {
    if (!dateEntry.isDirectory()) continue;

    const slugDir = path.join(ARTICLES_DIR, dateEntry.name, slug);
    if (!fs.existsSync(slugDir) || !fs.statSync(slugDir).isDirectory()) continue;

    for (const file of fs.readdirSync(slugDir)) {
      const match = file.match(/^([a-z]{2})\.(mdx|md)$/);
      if (match) {
        languages.push(match[1]);
      }
    }
    break;
  }

  return [...new Set(languages)].sort();
}

export function getAllSlugs(): { slug: string; languages: string[] }[] {
  const result: { slug: string; languages: string[] }[] = [];

  if (!fs.existsSync(ARTICLES_DIR)) return result;

  const dateEntries = fs.readdirSync(ARTICLES_DIR, { withFileTypes: true });
  for (const dateEntry of dateEntries) {
    if (!dateEntry.isDirectory()) continue;
    const dateDir = path.join(ARTICLES_DIR, dateEntry.name);

    const slugEntries = fs.readdirSync(dateDir, { withFileTypes: true });
    for (const slugEntry of slugEntries) {
      if (!slugEntry.isDirectory()) continue;

      const slugDir = path.join(dateDir, slugEntry.name);
      const slug = extractSlug(slugDir);
      const languages = getAvailableLanguages(slug);

      if (languages.length > 0) {
        result.push({ slug, languages });
      }
    }
  }

  return result;
}

export function getAllLanguages(): string[] {
  const slugs = getAllSlugs();
  const languages = new Set<string>();
  for (const { languages: langs } of slugs) {
    for (const lang of langs) {
      languages.add(lang);
    }
  }
  return [...languages].sort();
}

export function getRelatedPosts(slug: string, tags: string[], lang: string, limit = 3): BlogPost[] {
  if (!tags.length) return [];

  const allPosts = getAllPosts(lang);

  // Filter out the current post and match by shared tags
  const scored = allPosts
    .filter((p) => p.slug !== slug)
    .map((p) => {
      const sharedTags = (p.tags || []).filter((t) => tags.includes(t));
      return { post: p, sharedCount: sharedTags.length };
    })
    .filter((s) => s.sharedCount > 0)
    .sort((a, b) => {
      // Primary: shared tag count descending
      const tagDiff = b.sharedCount - a.sharedCount;
      if (tagDiff !== 0) return tagDiff;
      // Secondary: most recent first
      return new Date(b.post.date).getTime() - new Date(a.post.date).getTime();
    });

  return scored.slice(0, limit).map((s) => s.post);
}

export function findArticleDir(slug: string): string | null {
  if (!fs.existsSync(ARTICLES_DIR)) return null;

  const dateEntries = fs.readdirSync(ARTICLES_DIR, { withFileTypes: true });
  for (const dateEntry of dateEntries) {
    if (!dateEntry.isDirectory()) continue;
    const dateDir = path.join(ARTICLES_DIR, dateEntry.name);
    const slugDir = path.join(dateDir, slug);
    if (fs.existsSync(slugDir) && fs.statSync(slugDir).isDirectory()) {
      return slugDir;
    }
  }
  return null;
}
