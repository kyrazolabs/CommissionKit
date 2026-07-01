# Content Agent Gap Analysis & Improvements

## Current State (What's Working)
- Daily cron generates X + LinkedIn + Reddit content at 6 PM EST
- Supabase `commissionkit_posts` table stores all posts with engagement analytics
- Preflight script reads engagement + blocklist to prevent repetition
- Blog articles (platform: 'blog') auto-trigger X promotion posts
- Voice rules embedded: first-person, conversational, zero fake data

## Critical Gaps

### 1. No SEO Content Brief Template
**Problem:** Blog articles are ad-hoc. No keyword targeting, no search intent mapping.
**Fix:** Every article starts with a brief: target keyword, search intent, outline, internal links, CTA.

### 2. No Content Repurposing Pipeline
**Problem:** Blog → X post only. No LinkedIn article, no newsletter, no thread.
**Fix:** One article → 5 assets: X thread (5 tweets), LinkedIn post, newsletter snippet, Reddit post, quote graphic.

### 3. No Competitive Content Monitoring
**Problem:** We don't track what competitors publish or what's trending in sales/RevOps.
**Fix:** Weekly competitive scan: monitor 5 competitor blogs + Reddit hot posts + X trending in #SalesOps.

### 4. No Performance Review Cadence
**Problem:** Analytics exist but no weekly review of what worked.
**Fix:** Every Monday, review last week's posts. Double down winners. Kill losers. Update content calendar.

### 5. No Lead Magnet Integration
**Problem:** Content drives awareness but doesn't capture emails.
**Fix:** Every blog article embeds a lead magnet CTA: commission calculator, plan template, ROI spreadsheet.

### 6. Missing Content Types
**Problem:** Only text posts. No carousels, no screenshots, no video clips.
**Fix:** Weekly: 1 carousel (X/LinkedIn), 2 screenshots (product UI), 1 video clip (Loom walkthrough).

## Proposed New Content Stack

```
WEEKLY OUTPUT:
├── 2 blog articles (SEO-targeted, 1,500+ words)
│   ├──→ 1 X thread (5 tweets)
│   ├──→ 1 LinkedIn post
│   ├──→ 1 Reddit post
│   └──→ 1 Newsletter snippet
├── 5 daily X posts (from cron: 2 original + 2 blog promo + 1 engagement)
├── 3 LinkedIn posts (Mon/Wed/Fri)
├── 1 Reddit post (Wed)
├── 1 Carousel (Tue)
└── 2 Screenshots/short videos (Thu/Sat)
```

## Content Agent Prompt Fixes

1. **Add SEO brief extraction** to preflight — query target keyword rankings
2. **Add repurposing step** — after blog insert, generate thread outline in Supabase
3. **Add lead magnet CTA** to every blog promo post — "Get the free calculator →"
4. **Add visual requirements** — every X post must have a visual suggestion that can be screenshot/carousel
5. **Add Monday review trigger** — separate cron job for weekly analytics review

## Implementation Priority

| Priority | Fix | Effort | Impact |
|----------|-----|--------|--------|
| P0 | Lead magnet CTAs in all content | Low | High |
| P0 | Repurposing pipeline (blog → 5 assets) | Medium | High |
| P1 | SEO brief template | Low | High |
| P1 | Monday analytics review cron | Low | Medium |
| P2 | Competitive monitoring | Medium | Medium |
| P2 | Visual content (carousels, screenshots) | High | Medium |
