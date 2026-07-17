---
name: conversion-check
description: Use to audit Google Ads conversion actions and attribution for over-reporting (micro-actions set as primary, double-counting, last-click over-crediting brand).
---

# Conversion Check

**When to run:** before you trust any other number. If the data's wrong, every decision after it is wrong too.
**Feed it:** a screenshot of the conversion actions (showing which are "primary"), the attribution model, and ideally Google-reported conversions vs actual Shopify orders for the same period.

## Instructions
Read precisely, quote what you see, flag what you can't.
1. Primary vs secondary: are micro-actions (add-to-cart, view-content, newsletter, begin-checkout) wrongly set PRIMARY? If so the account inflates reported sales. List them, estimate the padding.
2. Double-counting: GA4 purchase import AND a Google Ads tag both firing for the same purchase? Flag it.
3. Attribution model: note it. If last-click, explain how it over-credits branded search and starves upper-funnel.
4. Confirm there is one clean purchase conversion matching real orders.
5. If given Google conversions vs Shopify orders, quantify the gap and which leak explains it.

Output: findings (issue | effect on reported numbers); estimated over-reporting (multiple/% with working); fix list (set to secondary, deduplicate, attribution); anything unreadable flagged.
