# SOP-01: Content Creation

## Purpose
Standardize the creation of all CommissionKit content — blog articles, social posts, and lead magnets — to ensure quality, SEO discipline, and brand consistency.

## Scope
Applies to: blog articles, X posts, LinkedIn posts, Reddit posts, newsletters, carousels, videos.

## Roles
- **Content Manager (AI/Human):** Approves topics, reviews output, schedules publishing
- **Writer (AI/Human):** Produces first draft
- **Reviewer (Human):** Fact-checks against PLATFORM.md, approves before publish

## Procedure

### Step 1: Topic Selection (Every Monday)
1. Review keyword tracker for ranking opportunities
2. Check competitive content scan for gaps
3. Check customer support tickets for recurring questions
4. Select 2 blog topics for the week
5. Fill out Content Brief (see `../content-system/blog-seo-pipeline.md`)

### Step 2: First Draft
1. Write in first person only ("I built", "we shipped")
2. Zero fake statistics — only PLATFORM.md facts or real founder experience
3. Target word count: 1,500–2,500 for blog; 280 chars max for X
4. Include at least 2 screenshots or visuals
5. End with lead magnet CTA + trial signup CTA

### Step 3: Review Checklist
- [ ] Content Brief followed
- [ ] Target keyword in H1, first 100 words, 1 H2
- [ ] Meta description 150-160 characters
- [ ] All images compressed (<100KB)
- [ ] Internal links added (3-5)
- [ ] Lead magnet CTA present
- [ ] No fake data or unverifiable claims
- [ ] Readability: grade 8-10 (Hemingway)
- [ ] Grammar/spelling clean (Grammarly)

### Step 4: Publish
1. Upload to Ghost CMS
2. Set canonical URL, slug, meta tags
3. Submit to Google Search Console
4. Insert into Supabase: `python3 /root/.hermes/scripts/ck-blog-insert.py`
5. Add to content calendar

### Step 5: Distribution
1. X promotion (auto via cron, 2 posts)
2. LinkedIn post (manual or AI)
3. Reddit post (manual, value-first)
4. Newsletter snippet (weekly digest)
5. Repurpose into thread/carousel/video (Monday task)

## Tools
- Ghost CMS (blog)
- Supabase (content database)
- Grammarly / Hemingway (editing)
- Google Search Console (indexing)

## Frequency
- Blog articles: 2x per week
- Social posts: daily (auto via cron)
- Repurposing: 1x per week (Monday)

## KPIs
- Organic traffic growth (month-over-month)
- Keyword ranking improvements
- Social engagement rate (likes + comments + shares / impressions)
- Lead magnet download rate
- Trial signups from blog CTAs
