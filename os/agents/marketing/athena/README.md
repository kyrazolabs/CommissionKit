# Athena — SEO Content Specialist

**Department:** Marketing  
**Team:** Content Production  
**Reports to:** Hermes (24/7 Operations Warden)  
**OpenCode Agent:** N/A — Hermes-native persona  
**Persona location:** `/root/.hermes/config.yaml` → `agent.personalities.athena`  
**Skill location:** `/root/.hermes/skills/commissionkit/athena-seo-content/SKILL.md`

---

## Overview

Athena is a world-class SEO marketing strategist and copywriter, embedded as a persistent Hermes Agent persona (not an OpenCode subagent). She is activated whenever the founder requests blog content for CommissionKit.

Unlike the OpenCode agent `@ink` (Content Director), who handles diverse content types (blog posts, lead magnets, newsletters, landing pages, social copy), Athena is a specialist focused exclusively on:

1. **Researching** SEO topics and competing content
2. **Drafting** SEO-optimized blog articles in English
3. **Humanizing** drafts to remove AI-isms
4. **Localizing** into 6 additional languages (ar, de, es, fr, hi, pt)
5. **Generating cover images** (text only; image design is manual)
6. **Persisting everything** to disk in a strict directory structure

---

## How to Use

Send any blog content request to Hermes, and Hermes will activate the Athena persona:

> "Write a blog post about how sales teams can migrate from spreadsheet-based commission tracking to dedicated software."

Hermes loads the `athena` personality and the `athena-seo-content` skill, then executes the full 6-phase pipeline.

---

## Output Structure

```
artifacts/blog/articles/YYYY-MM-DD/article-slug/
├── en.mdx          # English (source of truth)
├── ar.mdx          # Arabic
├── de.mdx          # German
├── es.mdx          # Spanish
├── fr.mdx          # French
├── hi.mdx          # Hindi
├── pt.mdx          # Portuguese
├── cover.jpg       # Original cover
└── cover.webp      # Optimized cover
```

---

## Relationship to @ink

| Aspect | @ink (Content Director) | Athena (SEO Specialist) |
|--------|------------------------|------------------------|
| **Runtime** | OpenCode subagent | Hermes persona |
| **Scope** | All content types | Blog articles only |
| **Languages** | English only | 7 languages |
| **SEO depth** | Standard SEO | Deep SEO + keyword localization per market |
| **Humanization** | Manual | Mandatory humanizer skill pass |
| **File output** | Prints in chat or saves | Always 9 files on disk |
| **Use case** | Quick content, newsletters, social copy | Full blog production pipeline |

When in doubt: `@ink` for speed and variety, Athena for depth and multilingual reach.

---

## Model Assignments

| Phase | Primary Model | Fallback |
|-------|--------------|----------|
| Research | `opencode-go/deepseek-v4-flash` | `opencode-go/qwen3.7-plus` |
| Draft en.mdx | `opencode-go/qwen3.7-plus` | `opencode-go/qwen3.7-max` |
| Humanize | `opencode-go/qwen3.7-max` | `opencode-go/kimi-k2.6` |
| Translate (×6) | `opencode-go/qwen3.7-plus` | `opencode-go/glm-5.2` |
| Cover build | `opencode-go/deepseek-v4-flash` | — |

---

## Skills

### Built-in (Hermes-native)
- `athena-seo-content` — full production pipeline
- `blogwatcher` — RSS/Atom feed monitoring for topic research
- `llm-wiki` — interlinked knowledge base
- `polymarket` — prediction market data
- `research-paper-writing` — citation rigor
- `humanizer` — AI-ism removal

### External (install per task)
- `aaron-he-zhu/aaron-marketing-skills` — 16 SEO/GEO skills
- `kostja94/marketing-skills` — 160+ marketing skills
- `boraoztunc/skills` — Ogilvy copywriting
- `OpenClaudia/openclaudia-skills` — SEO audit, write-blog
- `coreyhaines31/marketingskills` — CRO, SEO

---

## Status

**Created:** 2026-07-29  
**Status:** Active  
**Articles produced:** 0 (new agent)

---

*Part of the CommissionKit AI Workforce — managed by Hermes, the 24/7 Operations Warden.*
