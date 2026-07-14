# UX Spec — Blog Multi-Language Support

**Author:** @craft (UX Designer)
**Date:** 2026-07-13
**Status:** Draft
**Target:** CommissionKit Blog (`artifacts/blog/`)

---

## Table of Contents

1. [Overview](#overview)
2. [Language Data Model](#language-data-model)
3. [Article Page — Language Selector](#article-page--language-selector)
4. [Blog Index — Language Filter](#blog-index--language-filter)
5. [Fallback UX](#fallback-ux)
6. [SEO & hreflang](#seo--hreflang)
7. [RTL Support (Arabic, Hebrew)](#rtl-support)
8. [Edge Cases](#edge-cases)
9. [Component Specs](#component-specs)
10. [Interaction Flows](#interaction-flows)
11. [Accessibility](#accessibility)
12. [File Structure](#file-structure)

---

## Overview

CommissionKit's blog is expanding to multi-language support. Articles live in `articles/YYYY-MM-DD/slug/` with per-language MDX files (e.g., `index.mdx` for English, `ar.mdx` for Arabic, `es.mdx` for Spanish). The URL structure becomes `/blog/:lang/:slug`.

This spec defines how users discover, switch, and interact with language content across the blog.

### Design Principles

- **Progressive disclosure** — Don't overwhelm with language options when there's only one translation
- **Graceful degradation** — Missing translations never feel broken; they feel helpful
- **Visual consistency** — Language UI matches the existing teal-accent, clean-card design system
- **RTL-native** — Arabic/Hebrew pages are fully mirrored, not hacked

---

## Language Data Model

### Supported Languages

| Code | Label | Native Label | Direction | Font Stack |
|------|-------|-------------|-----------|------------|
| `en` | English | English | LTR | Outfit/Inter |
| `es` | Spanish | Espanol | LTR | Outfit/Inter |
| `ar` | Arabic | | RTL | Outfit/Inter (with `dir="rtl"`) |
| `fr` | French | Francais | LTR | Outfit/Inter |
| `de` | German | Deutsch | LTR | Outfit/Inter |
| `pt` | Portuguese | Portugues | LTR | Outfit/Inter |

### Article Directory Structure (After Migration)

```
articles/
  2026-06-24/
    welcome-to-commissionkit/
      index.mdx          # English (default/fallback)
      ar.mdx             # Arabic
      es.mdx             # Spanish
      cover.png
      cover.webp
```

### Frontmatter Extensions

Each language file may include:

```yaml
---
title: "Welcome to CommissionKit"
description: "Introducing CommissionKit..."
date: "2026-06-24"
author: "CommissionKit Team"
tags: [Product, Announcement]
lang: "en"                    # NEW: explicit language code
availableLanguages: ["en", "ar", "es"]  # NEW: computed at build time
---
```

> **Note:** `availableLanguages` is computed server-side by scanning the article directory. Authors don't maintain it manually.

---

## Article Page — Language Selector

### Design: Compact Pill Selector

The language selector appears **below the article title, above the cover image**, inline with the meta row (date + reading time). It uses a horizontal pill/chip layout.

#### Desktop Layout

```
+------------------------------------------------------------------+
| Back to Blog                                                      |
|                                                                    |
| [Product] [Announcement]                                           |
|                                                                    |
| Welcome to CommissionKit                                           |
|                                                                    |
| Jun 24, 2026  |  3 min read  |  [ EN  ES  AR ]                   |
|                                                                    |
| [Cover Image]                                                      |
|                                                                    |
| ... article content ...                                            |
+------------------------------------------------------------------+
```

#### Selector Behavior

- **Only shown when 2+ translations exist** for this article
- Current language: solid teal pill (`bg-primary text-primary-foreground`)
- Available but not current: outline pill (`border-border text-muted-foreground hover:border-primary/40 hover:text-foreground`)
- **Missing translations are hidden** — not greyed out, not shown at all
- Each pill shows the **native language name** (e.g., "EN", "ES", "AR")
- Pills are compact: `text-[10px] font-semibold uppercase tracking-wider` with `px-2 py-0.5`
- Clicking navigates to `/blog/{lang}/{slug}`
- Tooltip on hover shows full language name (e.g., "Read in Arabic")

#### Visual Spec

```
┌─────────────────────────────────────────────────┐
│  Jun 24, 2026  ·  3 min read  ·  [EN] [ES] [AR] │
│                                                   │
│  [EN]  = bg-primary text-primary-foreground       │
│          border border-primary-border             │
│          shadow-xs                                │
│                                                   │
│  [ES]  = bg-transparent text-muted-foreground     │
│          border border-border                     │
│          hover:border-primary/40                  │
│          hover:text-foreground                    │
│                                                   │
│  [AR]  = same as [ES]                             │
└─────────────────────────────────────────────────┘
```

#### Spacing

- Meta row: `flex items-center gap-4 text-sm text-muted-foreground`
- Separator between reading time and language pills: `text-muted-foreground/40` middot (`·`)
- Language pills group: `flex items-center gap-1.5 ml-2`
- Each pill: `rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider cursor-pointer transition-colors`

### Mobile Layout (below `md` breakpoint)

On mobile, the language selector moves to a **compact dropdown** to save horizontal space:

```
+-----------------------------------------------|
| Back to Blog                                   |
|                                                |
| [Product] [Announcement]                       |
|                                                |
| Welcome to CommissionKit                       |
|                                                |
| Jun 24, 2026  ·  3 min read                   |
|                                                |
| [ v English ]  ← dropdown trigger              |
| ┌──────────────────┐                           |
| │ English     ✓    │  ← current checked        |
| │ Spanish          │                           |
| │ Arabic           │                           |
| └──────────────────┘                           |
|                                                |
| [Cover Image]                                  |
+-----------------------------------------------|
```

#### Mobile Dropdown Behavior

- Trigger: `Button variant="outline" size="sm"` with globe icon (`Globe` from Lucide) + current language label + `ChevronDown`
- Opens as a `Popover` (Radix) positioned below the trigger
- Each option: language name in native script + checkmark for current
- RTL languages show their native script (e.g., "العربية")
- Selecting a language navigates immediately (no confirm step)
- Closes on selection or outside click

---

## Blog Index — Language Filter

### Design: Horizontal Filter Bar

The blog index (`/blog` or `/blog/:lang`) gains a **language filter bar** below the page heading.

#### Desktop Layout

```
+------------------------------------------------------------------+
|                                                                    |
|  [Insights]                                                        |
|                                                                    |
|  Blog                                                              |
|  Expert insights on sales commission management...                 |
|                                                                    |
|  ┌─────────────────────────────────────────────────────────────┐   |
|  │ [All]  [English]  [Spanish]  [Arabic]  [French]  [German]  │   |
|  └─────────────────────────────────────────────────────────────┘   |
|                                                                    |
|  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            |
|  │  Card 1      │  │  Card 2      │  │  Card 3      │            |
|  │  (EN)        │  │  (ES)        │  │  (EN+AR)     │            |
|  └──────────────┘  └──────────────┘  └──────────────┘            |
+------------------------------------------------------------------+
```

#### Filter Bar Behavior

- **"All" tab** shows every article in any language (default)
- Individual language tabs filter to articles available in that language
- Active tab: `bg-primary text-primary-foreground` (solid teal)
- Inactive tabs: `bg-muted text-muted-foreground hover:text-foreground`
- Tabs use the `Tabs` primitive from `@/components/ui/tabs`
- **URL encodes the filter**: `/blog?lang=es` or `/blog/es` (clean URL variant)
- Default language detection order:
  1. URL path `/blog/:lang`
  2. `?lang=` query param
  3. Browser `navigator.language` (first matching)
  4. English fallback

#### Card Modifications

Each article card gains a small language indicator:

```
┌──────────────────────────┐
│  [Cover Image]            │
│                           │
│  [Product]                │
│                           │
│  Welcome to CommissionKit │
│  Introducing Commission...│
│                           │
│  Jun 24  ·  3 min  · EN  │  ← language badge in meta row
└──────────────────────────┘
```

- Language shown as a small badge: `text-[9px] font-semibold uppercase`
- If article has multiple translations, show count: "EN +2" (clicking opens language options)
- Single-language articles: just show the language code

#### Mobile Layout

On mobile, the filter bar **scrolls horizontally** as a pill strip:

```
+-----------------------------------------------|
| Blog                                           |
| Expert insights on...                          |
|                                                |
| [All] [English] [Spanish] [Arabic] [French]    |
|  ← horizontally scrollable, snap points →       |
|                                                |
| ┌──────────────┐                               |
│ | Card 1       |                               |
| └──────────────┘                               |
+-----------------------------------------------|
```

- Uses `overflow-x-auto` with `scroll-snap-type: x mandatory`
- Each tab: `scroll-snap-align: start`
- Fade gradient on right edge when scrollable
- No scrollbar visible (`scrollbar-width: none`)

---

## Fallback UX

### Scenario: Article Not Available in Requested Language

When a user visits `/blog/ar/welcome-to-commissionkit` but `ar.mdx` doesn't exist:

#### Recommended Approach: Option C — English with Banner

**Why Option C over A or B:**
- Option A (404) is hostile — user came for content, not an error page
- Option B (silent redirect) is confusing — user doesn't know they're reading English
- Option C (banner + English content) respects intent while being transparent

#### Banner Design

```
+------------------------------------------------------------------+
|                                                                    |
|  [ArrowLeft] Back to Blog                                          |
|                                                                    |
|  ┌────────────────────────────────────────────────────────────┐   |
|  │ [Info icon]  This article is not available in Arabic.      │   |
|  │              Showing the English version.                   │   |
|  │                                        [Read in English →]  │   |
|  └────────────────────────────────────────────────────────────┘   |
|                                                                    |
|  [Product] [Announcement]                                          |
|                                                                    |
|  Welcome to CommissionKit                                          |
|                                                                    |
|  Jun 24, 2026  ·  3 min read  ·  [EN]  [ES]                      |
|  ← only shows actually available languages                        |
|                                                                    |
|  ... English content ...                                           |
+------------------------------------------------------------------+
```

#### Banner Spec

- Background: `bg-secondary` (light teal tint in light mode, neutral dark in dark mode)
- Border: `border border-border`
- Rounded: `rounded-lg`
- Padding: `p-4`
- Icon: `Info` from Lucide, `text-primary`, `size-4`
- Text: `text-sm text-muted-foreground`
- Bold "Arabic" part: `font-medium text-foreground`
- CTA link: `text-primary font-medium hover:underline` — links to the English version explicitly
- **Dismissible?** No — the banner persists for the entire page visit. It's informational, not intrusive.
- **Position:** Immediately after "Back to Blog" button, before article metadata

#### URL Behavior

- The URL remains `/blog/ar/welcome-to-commissionkit` (does NOT auto-redirect)
- `<html lang="ar" dir="rtl">` is still set (page renders RTL)
- The `hreflang` tags point to existing translations only
- Canonical URL points to the English version

---

## SEO & hreflang

### Meta Tags

For each article page, generate:

```html
<!-- Self-referencing canonical -->
<link rel="canonical" href="https://commissionk.it/blog/en/welcome-to-commissionkit" />

<!-- hreflang for each available translation -->
<link rel="alternate" hreflang="en" href="https://commissionk.it/blog/en/welcome-to-commissionkit" />
<link rel="alternate" hreflang="es" href="https://commissionk.it/blog/es/welcome-to-commissionkit" />
<link rel="alternate" hreflang="ar" href="https://commissionk.it/blog/ar/welcome-to-commissionkit" />

<!-- x-default: points to English version -->
<link rel="alternate" hreflang="x-default" href="https://commissionk.it/blog/en/welcome-to-commissionkit" />
```

### Rules

- **Self-referencing canonical:** Every page canonicalizes to itself
- **hreflang only for existing translations:** Don't generate hreflang for missing languages
- **x-default:** Always points to the English version
- **OG tags:** Use the current page's language for `og:locale` (e.g., `ar_AR` for Arabic)
- **`<html lang>`:** Must match the current page's language code
- **`<html dir>`:** Set to `rtl` for Arabic/Hebrew, `ltr` for all others

### Blog Index SEO

The blog index page at `/blog` (or `/blog/en`):

```html
<link rel="alternate" hreflang="en" href="https://commissionk.it/blog/en" />
<link rel="alternate" hreflang="es" href="https://commissionk.it/blog/es" />
<link rel="alternate" hreflang="x-default" href="https://commissionk.it/blog" />
```

---

## RTL Support

### Arabic (`ar`) and Hebrew (`he`) Pages

#### HTML Attributes

```html
<html lang="ar" dir="rtl" class="dark">
```

#### CSS Handling

The blog already uses Tailwind CSS, which has built-in RTL support via the `rtl:` variant:

```css
/* Article content direction */
.blog-content[dir="rtl"] {
  text-align: right;
}

.blog-content[dir="rtl"] blockquote {
  border-left: none;
  border-right: 4px solid hsl(var(--primary) / 0.3);
  padding-right: 1rem;
  padding-left: 0;
}

.blog-content[dir="rtl"] ul,
.blog-content[dir="rtl"] ol {
  padding-left: 0;
  padding-right: 1.5rem;
}

.blog-content[dir="rtl"] pre {
  direction: ltr;
  text-align: left;
}
```

#### Layout Mirroring

- **Sidebar navigation** — already handled by the main app layout (not used in blog)
- **Blog header** — logo stays left, "Blog" link stays right (brand consistency)
- **Back button** — arrow flips: `ArrowRight` instead of `ArrowLeft` in RTL
- **Share button** — icon position mirrors (icon after text in RTL)
- **Pagination** — "Previous" becomes right, "Next" becomes left

#### Language Selector in RTL

The language pill selector mirrors naturally in RTL:

```
[AR] [ES] [EN]  ·  3 min read  ·  Jun 24, 2026
```

Pills read right-to-left, matching the document flow.

---

## Edge Cases

### 1. Article Exists in Only One Language

- Language selector is **hidden entirely** (no point showing a single-option selector)
- Blog index cards show the language badge normally
- `hreflang` still generated for the single language + x-default

### 2. Article Exists in All Supported Languages

- Language selector shows all 6 pills on desktop
- On mobile, all 6 appear in the dropdown
- No special handling needed

### 3. User Visits `/blog` (No Language in URL)

- Detect browser language via `navigator.language`
- Redirect to `/blog/{detected-lang}` if supported, otherwise `/blog/en`
- Store preference in `localStorage` (`ck_blog_lang`)
- Subsequent visits use stored preference

### 4. User Visits `/blog/ar` but No Arabic Articles Exist

- Show the blog index filtered to Arabic
- If zero results: show empty state with message "No articles available in Arabic yet."
- Provide link to English blog: "Read articles in English"
- Don't redirect — respect the user's language choice

### 5. Cover Image Localization

- Cover images are **shared across languages** (same `cover.png`/`cover.webp`)
- Alt text uses the translated title from frontmatter
- No per-language cover images in v1

### 6. Reading Time Calculation

- Reading time is calculated per-language from the translated content
- Different languages have different word densities (e.g., Arabic text is denser)
- The `readingTime` function in `posts.ts` uses a fixed 200 words/min — acceptable for v1

### 7. Date Formatting

- Dates use `Intl.DateTimeFormat` with the current page's locale
- Arabic dates display in Arabic numerals (٢٤ يونيو ٢٠٢٦) when `locale: "ar"`
- `formatDate` in `src/lib/format.ts` must accept a locale parameter

### 8. Tag Translation

- Tags are **not translated** in v1 — they remain in English
- Future: tags could have per-language labels in frontmatter

### 9. Search/SEO for Non-Latin Scripts

- Arabic article titles in `<title>` and `<meta description>` use Arabic text
- Search engines handle this natively with proper `hreflang`
- No special handling needed beyond correct meta tags

### 10. Shared Cover Images with Localized Alt Text

```tsx
<img
  src={post.coverImage}
  alt={post.title}  // Uses translated title from current language's MDX
  className="..."
/>
```

---

## Component Specs

### 1. `LanguagePills` Component

**File:** `src/components/language-pills.tsx`

```
Props:
  - currentLang: string           // e.g., "en"
  - availableLanguages: string[]  // e.g., ["en", "es", "ar"]
  - slug: string                  // e.g., "welcome-to-commissionkit"
  - variant: "inline" | "dropdown"  // responsive switching

Renders:
  - Desktop (inline): horizontal row of pill buttons
  - Mobile (dropdown): single trigger button + popover menu

Behavior:
  - Active pill: bg-primary text-primary-foreground
  - Inactive pill: border-border text-muted-foreground, hover effect
  - Each pill links to /blog/{lang}/{slug}
  - Dropdown shows native language names with checkmark for current
```

**Responsive breakpoint:** Switches at `md` (768px)

### 2. `LanguageFilter` Component

**File:** `src/components/language-filter.tsx`

```
Props:
  - currentLang: string | null    // null = "All"
  - availableLanguages: string[]  // all languages with content
  - basePath: string              // "/blog"

Renders:
  - Desktop: horizontal tab bar
  - Mobile: horizontally scrollable pill strip

Behavior:
  - "All" tab: shows every article regardless of language
  - Individual tabs: filter to that language
  - Updates URL: /blog?lang=es or /blog/es
  - Persists choice in localStorage
```

### 3. `FallbackBanner` Component

**File:** `src/components/fallback-banner.tsx`

```
Props:
  - requestedLang: string         // "ar"
  - requestedLangLabel: string    // "Arabic"
  - fallbackLang: string          // "en"
  - fallbackUrl: string           // "/blog/en/welcome-to-commissionkit"

Renders:
  - Info banner with explanation + CTA link

Behavior:
  - Always visible (non-dismissible)
  - Links to the explicit English version
  - Styled with bg-secondary, rounded-lg, p-4
```

### 4. `LanguageBadge` Component (for blog index cards)

**File:** `src/components/language-badge.tsx`

```
Props:
  - lang: string                  // "en"
  - count?: number                // additional translations count

Renders:
  - Small badge: "EN" or "EN +2"
  - Positioned in card meta row

Behavior:
  - Static display (no click behavior on index)
  - text-[9px] font-semibold uppercase
```

---

## Interaction Flows

### Flow 1: English Reader Discovers Spanish Translation

```
1. User lands on /blog/en/welcome-to-commissionkit
2. Sees language pills: [EN] [ES] [AR]
3. Hovers over [ES] — tooltip "Read in Spanish"
4. Clicks [ES]
5. Page navigates to /blog/es/welcome-to-commissionkit
6. URL changes, page reloads with Spanish content
7. Language pills now show [ES] as active
8. <html lang="es" dir="ltr">
```

### Flow 2: Arabic Reader Hits Missing Translation

```
1. User visits /blog/ar/welcome-to-commissionkit (shared link)
2. Server finds no ar.mdx — serves English content
3. FallbackBanner appears: "This article is not available in Arabic."
4. Language pills show [EN] [ES] (only available translations)
5. <html lang="ar" dir="rtl"> — page renders RTL
6. Banner CTA links to /blog/en/welcome-to-commissionkit
7. User can click [EN] pill to explicitly switch to English
```

### Flow 3: Blog Index Language Filtering

```
1. User visits /blog
2. Language filter bar shows: [All] [English] [Spanish] [Arabic]
3. Default: "All" tab active
4. User clicks "Spanish"
5. URL updates to /blog?lang=es
6. Grid filters to show only articles with es.mdx
7. If no Spanish articles: empty state "No articles in Spanish"
8. User's choice persists via localStorage
```

### Flow 4: Mobile Language Selection

```
1. User on mobile views article
2. Sees compact dropdown: [ v English ]
3. Taps trigger — popover opens below
4. Options: English ✓, Spanish, Arabic
5. Taps "Arabic"
6. Navigates to /blog/ar/{slug}
7. Popover closes, page reloads
```

---

## Accessibility

### Keyboard Navigation

- Language pills are `<button>` elements with `role="tab"` (or `role="radio"` in group)
- Arrow keys navigate between pills
- Enter/Space activates the selected language
- Tab moves focus to the next focusable element (article content)

### Screen Readers

- Language selector group: `role="group" aria-label="Available languages"`
- Each pill: `aria-label="Read in Spanish"`, `aria-current="page"` for active
- Fallback banner: `role="status"` with `aria-live="polite"`
- Language filter tabs: `role="tablist"` with `role="tab"` and `aria-selected`

### Contrast

- Active pill: primary bg + white text = meets 4.5:1 (teal-600 on white)
- Inactive pill: muted-foreground on transparent = meets 4.5:1 (gray-500 on white)
- Fallback banner: muted text on secondary bg = meets 4.5:1

### Focus Indicators

- All interactive elements use `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`
- Consistent with existing button/badge focus patterns

---

## File Structure

### New Files

```
artifacts/blog/src/components/
  language-pills.tsx        # Language selector (article page)
  language-filter.tsx       # Language filter bar (blog index)
  fallback-banner.tsx       # Translation missing banner
  language-badge.tsx        # Small language indicator (card meta)

artifacts/blog/src/lib/
  i18n.ts                   # Language config, labels, detection
  i18n.test.ts              # Tests for language detection
```

### Modified Files

```
artifacts/blog/src/lib/posts.ts       # Add lang param, multi-file scanning
artifacts/blog/src/app/[slug]/page.tsx # Add LanguagePills, FallbackBanner
artifacts/blog/src/app/page.tsx        # Add LanguageFilter
artifacts/blog/src/app/layout.tsx      # Add dynamic lang/dir attributes
artifacts/blog/src/app/globals.css     # Add RTL styles
```

### New Routes

```
artifacts/blog/src/app/[lang]/
  layout.tsx               # Sets <html lang dir>, provides lang context
  page.tsx                 # Blog index filtered by language
  [slug]/
    page.tsx               # Article page with language awareness
```

---

## Implementation Priority

| Phase | Scope | Effort |
|-------|-------|--------|
| **P0** | Data model (multi-file posts.ts), `LanguagePills` component, fallback banner | 2 days |
| **P1** | `LanguageFilter` on index, URL routing (`[lang]`), hreflang meta | 2 days |
| **P2** | RTL styles, mobile dropdown, localStorage persistence | 1 day |
| **P3** | Browser language detection, date localization, edge cases | 1 day |

---

## Open Questions

1. **Should `/blog` (no lang) redirect to `/blog/en`?**
   - Recommendation: Yes, for SEO. Serve English at the clean URL and set canonical.

2. **Should article slugs be translated?**
   - Recommendation: No in v1. Slugs stay in English (`/blog/ar/welcome-to-commissionkit`). Translated slugs add routing complexity with minimal SEO benefit when hreflang is correct.

3. **How to handle articles that are translations of each other vs. language-specific content?**
   - Recommendation: Treat them as parallel versions. Same slug, different lang files. No cross-referencing needed beyond the language selector.

4. **Should the blog header show a global language switcher?**
   - Recommendation: Not in v1. Keep language selection scoped to the blog. A site-wide language switcher is a separate feature for the main marketing site.

---

## Summary

This design gives CommissionKit's blog a clean, accessible multi-language experience that:

- **Surfaces translations naturally** via compact pills on articles
- **Filters by language** on the index with a clean tab bar
- **Handles missing translations gracefully** with an informative banner
- **Respects RTL languages** with proper mirroring and direction attributes
- **Follows SEO best practices** with hreflang, canonicals, and proper lang attributes
- **Works on mobile** with responsive dropdowns and scrollable filters

The language selector should feel like a natural extension of the existing design — teal accents, clean borders, subtle interactions. Not an afterthought bolted on, but an integrated part of the reading experience.
