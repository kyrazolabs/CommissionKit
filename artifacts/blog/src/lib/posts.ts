import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const ARTICLES_DIR = path.join(process.cwd(), "articles");

export interface BlogPostMeta {
  slug: string;
  title: string;
  description: string;
  date: string;
  author?: string;
  tags?: string[];
  image?: string;
  coverImage?: string;
}

export interface BlogPost extends BlogPostMeta {
  content: string;
  readingTime: string;
}

function extractSlug(dirPath: string): string {
  // articles/2024-06-01/my-post-slug → my-post-slug
  return path.basename(dirPath);
}

function parseDate(dirPath: string): string {
  // articles/2024-06-01/my-post-slug → 2024-06-01
  const parent = path.basename(path.dirname(dirPath));
  const match = parent.match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : "";
}

function readingTime(content: string): string {
  const words = content.split(/\s+/).length;
  const minutes = Math.ceil(words / 200);
  return `${minutes} min read`;
}

function readPost(slug: string): BlogPost | null {
  const entries = fs.readdirSync(ARTICLES_DIR, { withFileTypes: true });

  for (const dateEntry of entries) {
    if (!dateEntry.isDirectory()) continue;
    const dateDir = path.join(ARTICLES_DIR, dateEntry.name);

    const slugEntries = fs.readdirSync(dateDir, { withFileTypes: true });
    for (const slugEntry of slugEntries) {
      if (!slugEntry.isDirectory()) continue;
      if (slugEntry.name !== slug) continue;

      const slugDir = path.join(dateDir, slugEntry.name);
      const mdxPath = path.join(slugDir, "index.mdx");
      const mdPath = path.join(slugDir, "index.md");

      const filePath = fs.existsSync(mdxPath) ? mdxPath : fs.existsSync(mdPath) ? mdPath : null;
      if (!filePath) continue;

      const raw = fs.readFileSync(filePath, "utf-8");
      const { data, content } = matter(raw);

      // Auto-detect cover.png
      const coverPath = path.join(slugDir, "cover.png");
      const coverImage = fs.existsSync(coverPath) ? `/blog/api/cover/${slug}` : undefined;

      return {
        slug,
        title: data.title || slug.replace(/-/g, " "),
        description: data.description || "",
        date: data.date || parseDate(slugDir),
        author: data.author,
        tags: data.tags || [],
        image: data.image,
        coverImage,
        content,
        readingTime: readingTime(content),
      };
    }
  }

  return null;
}

export function getAllPosts(): BlogPost[] {
  const posts: BlogPost[] = [];

  if (!fs.existsSync(ARTICLES_DIR)) return posts;

  const dateEntries = fs.readdirSync(ARTICLES_DIR, { withFileTypes: true });

  for (const dateEntry of dateEntries) {
    if (!dateEntry.isDirectory()) continue;
    const dateDir = path.join(ARTICLES_DIR, dateEntry.name);

    const slugEntries = fs.readdirSync(dateDir, { withFileTypes: true });
    for (const slugEntry of slugEntries) {
      if (!slugEntry.isDirectory()) continue;

      const post = readPost(slugEntry.name);
      if (post) {
        // Use directory date if not overridden in frontmatter
        if (!post.date || post.date === "") {
          post.date = parseDate(path.join(dateDir, slugEntry.name));
        }
        posts.push(post);
      }
    }
  }

  // Sort by date descending
  posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return posts;
}

export function getPost(slug: string): BlogPost | null {
  return readPost(slug);
}

export function getAllSlugs(): string[] {
  const slugs: string[] = [];

  if (!fs.existsSync(ARTICLES_DIR)) return slugs;

  const dateEntries = fs.readdirSync(ARTICLES_DIR, { withFileTypes: true });

  for (const dateEntry of dateEntries) {
    if (!dateEntry.isDirectory()) continue;
    const dateDir = path.join(ARTICLES_DIR, dateEntry.name);

    const slugEntries = fs.readdirSync(dateDir, { withFileTypes: true });
    for (const slugEntry of slugEntries) {
      if (!slugEntry.isDirectory()) continue;
      const mdxPath = path.join(dateDir, slugEntry.name, "index.mdx");
      const mdPath = path.join(dateDir, slugEntry.name, "index.md");
      if (fs.existsSync(mdxPath) || fs.existsSync(mdPath)) {
        slugs.push(slugEntry.name);
      }
    }
  }

  return slugs;
}
