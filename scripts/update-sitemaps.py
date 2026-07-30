#!/usr/bin/env python3
"""
Regenerate sitemaps with fresh lastmod dates and also create
a clean sitemap-index.xml for the main domain.
Then trigger a re-deploy to refresh the live site.
"""
import os
from datetime import datetime, timezone
from pathlib import Path

NOW = datetime.now(timezone.utc)
NOW_ISO = NOW.strftime("%Y-%m-%d")
NOW_ISO_T = NOW.strftime("%Y-%m-%dT%H:%M:%S.000Z")

WEB_PUBLIC = Path("/root/workspaces/CommissionKit/artifacts/web/public")

# ── Main Sitemap ──────────────────────────────────────────
MAIN_URLS = [
    ("https://commissionkit.co/", "weekly", "1.0"),
    ("https://commissionkit.co/home", "weekly", "0.9"),
    ("https://commissionkit.co/features", "monthly", "0.9"),
    ("https://commissionkit.co/solutions", "monthly", "0.8"),
    ("https://commissionkit.co/pricing", "weekly", "0.9"),
    ("https://commissionkit.co/calculator", "monthly", "0.9"),
    ("https://commissionkit.co/contact", "monthly", "0.7"),
    ("https://commissionkit.co/privacy", "monthly", "0.5"),
    ("https://commissionkit.co/terms", "monthly", "0.5"),
    ("https://commissionkit.co/security", "monthly", "0.5"),
    ("https://commissionkit.co/integrations/odoo", "monthly", "0.9"),
    ("https://commissionkit.co/integrations/hubspot", "monthly", "0.9"),
    ("https://commissionkit.co/integrations/salesforce", "monthly", "0.9"),
    ("https://commissionkit.co/integrations/custom", "monthly", "0.8"),
    ("https://commissionkit.co/portal", "monthly", "0.9"),
    ("https://commissionkit.co/careers", "monthly", "0.7"),
]

MAIN_XML = '<?xml version="1.0" encoding="UTF-8"?>\n'
MAIN_XML += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
for url, freq, priority in MAIN_URLS:
    MAIN_XML += f'  <url>\n    <loc>{url}</loc>\n    <lastmod>{NOW_ISO}</lastmod>\n    <changefreq>{freq}</changefreq>\n    <priority>{priority}</priority>\n  </url>\n'
MAIN_XML += '</urlset>\n'

(WEB_PUBLIC / "sitemap.xml").write_text(MAIN_XML)
print(f"✅ Main sitemap written ({len(MAIN_URLS)} URLs) updated to {NOW_ISO}")

# ── Blog Sitemap ──────────────────────────────────────────
BLOG_PUBLIC = Path("/root/workspaces/CommissionKit/artifacts/blog/public")

LANGUAGES = ["ar", "de", "en", "es", "fr", "hi", "pt"]
BLOG_SLUGS = [
    "odoo-commission-automation",
    "odoo-commission-options-compared",
    "odoo-commission-tracking-gap",
    "welcome-to-commissionkit",
    "why-spreadsheets-fail-sales-commission-tracking",
    "hubspot-integration",
    "what-is-a-spiff",
]

BLOG_XML = '<?xml version="1.0" encoding="UTF-8"?>\n'
BLOG_XML += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" >\n'

# Language index pages
for lang in LANGUAGES:
    BLOG_XML += f'  <url>\n    <loc>https://commissionkit.co/blog/{lang}</loc>\n'
    for alt in LANGUAGES:
        BLOG_XML += f'    <xhtml:link rel="alternate" hreflang="{alt}" href="https://commissionkit.co/blog/{alt}" />\n'
    BLOG_XML += f'    <xhtml:link rel="alternate" hreflang="x-default" href="https://commissionkit.co/blog/en" />\n'
    BLOG_XML += f'    <lastmod>{NOW_ISO_T}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>1</priority>\n  </url>\n'

# Blog posts in each language
for slug in BLOG_SLUGS:
    for lang in LANGUAGES:
        BLOG_XML += f'  <url>\n    <loc>https://commissionkit.co/blog/{lang}/{slug}</loc>\n'
        for alt in LANGUAGES:
            BLOG_XML += f'    <xhtml:link rel="alternate" hreflang="{alt}" href="https://commissionkit.co/blog/{alt}/{slug}" />\n'
        BLOG_XML += f'    <xhtml:link rel="alternate" hreflang="x-default" href="https://commissionkit.co/blog/en/{slug}" />\n'
        BLOG_XML += f'    <lastmod>{NOW_ISO_T}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n'

BLOG_XML += '</urlset>\n'

(BLOG_PUBLIC / "sitemap.xml").write_text(BLOG_XML)
print(f"✅ Blog sitemap written ({len(LANGUAGES) + len(BLOG_SLUGS) * len(LANGUAGES)} URLs) updated to {NOW_ISO_T}")

print()
print(f"Total URLs in sitemaps: {len(MAIN_URLS) + len(LANGUAGES) + len(BLOG_SLUGS) * len(LANGUAGES)}")
