---
name: dashboard-building
description: Create and manage dashboards with charts, tables, rich text, and iframe widgets using twenty CRM's dashboard tools. Use when users want to build, modify, or organize dashboards.
---

# Dashboard Building Skill

You help users create and manage dashboards with widgets.

## Tools

- `list_dashboards`, `get_dashboard`
- `create_complete_dashboard`
- `add_dashboard_tab`, `add_dashboard_widget`, `update_dashboard_widget`, `delete_dashboard_widget`
- `list_object_metadata_items` (resolve object + field IDs)

---

## Graph Widget Workflow

1. Ask what data the user wants to visualize.
2. Call `list_object_metadata_items` and resolve `objectMetadataId` + field IDs.
3. Always call `get_dashboard` before modifying widgets.
4. Build the widget configuration using the rules below.
5. Call `add_dashboard_widget` or `update_dashboard_widget`. Use `activeTabId` from context if available.
6. Call `get_dashboard` to verify the final configuration.

---

## Field Resolution Rules

- All `*MetadataId` fields must be real UUIDs from metadata.
- Match by name or label, but write UUIDs into all `*MetadataId` fields.
- Subfield names use **FIELD NAMES**, not labels.
- Composite group-by requires a subfield (e.g. `address` → `"addressCity"`).
- **CRITICAL:** Relation fields (`RELATION`, `MORPH_RELATION`) **MUST** always include a `subFieldName` (e.g. `"name"`, `"email"`, `"stage"`). Without a `subFieldName`, the chart groups by raw UUIDs which produces unreadable charts. Always pick a meaningful scalar field from the target object.

### Subfield Syntax

| Scenario | Example |
|----------|---------|
| Composite | `address` + `addressCity` → `subFieldName "addressCity"` |
| Relation to scalar field | `company.name` → `subFieldName "name"` (only when target `"name"` is a simple TEXT/NUMBER field) |
| Relation to composite field | `owner.name` where `"name"` is `FULL_NAME` → `subFieldName` must be `"name.firstName"` or `"name.lastName"` (NOT just `"name"`) |
| Relation + composite | `company.address.addressCity` → `subFieldName "address.addressCity"` |

Never omit `subFieldName` for relation fields — grouping by ID is almost never useful.

**IMPORTANT:** Check the target field's type from `list_object_metadata_items`. If it is composite (`FULL_NAME`, `ADDRESS`, `CURRENCY`, `EMAILS`, `PHONES`, `LINKS`), you MUST drill into a specific subfield using dot notation (e.g. `"name.firstName"`, `"address.addressCity"`, `"emails.primaryEmail"`).

---

## User Language Notes

| User says | Config field |
|-----------|-------------|
| "X axis" / "categories" | `primaryAxisGroupByFieldMetadataId` |
| "Y axis" / "metric" | `aggregateFieldMetadataId` + `aggregateOperation` |
| "Group by" / "stacking" / "colors" | `secondaryAxisGroupByFieldMetadataId` |
| "Unstacked" / "remove group by" | Clear `secondaryAxisGroupByFieldMetadataId` only |
| "KPI" / "just a number" | `AGGREGATE_CHART` |
| "Legend" | `displayLegend` |
| "Data labels" | `displayDataLabel` |
| "Hide empty values" | `omitNullValues` |
| "Min range" / "Max range" | `rangeMin` / `rangeMax` |
| "Running total" | `isCumulative` |

---

## Graph Configuration Rules

- Use the tool schema as the source of truth for required/optional fields.
- Supported graph `configurationType` values: `AGGREGATE_CHART`, `BAR_CHART`, `LINE_CHART`, `PIE_CHART`.
- `BAR_CHART` and `LINE_CHART` use `primaryAxisGroupByFieldMetadataId`.
- `PIE_CHART` uses `groupByFieldMetadataId` (not `primaryAxisGroupByFieldMetadataId`).
- If any `orderBy` is `MANUAL`, include the matching manual sort array.
- If `rangeMin` and `rangeMax` are both set, `rangeMin` must be `<= rangeMax`.
- Set date granularity only when grouping by date fields.
- "stacked bars" means `secondaryAxisGroupByFieldMetadataId` + `groupMode STACKED`.
- "stacked lines" means `isStacked true`.

---

## Non-graph Widgets

### IFRAME
- `configurationType "IFRAME"` + `url`

### STANDALONE_RICH_TEXT
- `configurationType "STANDALONE_RICH_TEXT"` + `body` with markdown content
- **IMPORTANT:** Put the actual text content in `configuration.body.markdown`, NOT in the widget title.
- Widget title should be a short label (e.g. "Notes", "Summary"), `body.markdown` holds the real content.

### RECORD_TABLE
- `configurationType "RECORD_TABLE"` — displays a filterable, sortable record list.

**MANDATORY 3-step pre-sequence** before creating the widget:
1. Call `create_view` (type `TABLE`, name e.g. "Repairs Dashboard Table") → get the new `viewId`
2. Call `create_many_view_fields` on the new `viewId` — add 4–6 of the most relevant fields (label identifier + key SELECT/DATE/CURRENCY fields). Use positions 0, 1, 2… and `isVisible: true`.
3. Call `create_many_view_filters` and/or `create_view_sort` on the new `viewId` to focus the table (e.g. filter out DONE/CANCELLED records, sort by createdAt DESC or a date field ASC)

Never reuse a record index view — widget views and record index views must be separate.

Set `objectMetadataId` on the widget (top-level, required).
Set `configuration.viewId` to the UUID of the dedicated view (required).
`columnSpan` 12 (full width) or 6 (half width), `rowSpan` 6–10.

---

## Examples

### STANDALONE_RICH_TEXT

```json
{
  "configurationType": "STANDALONE_RICH_TEXT",
  "body": {
    "markdown": "## Quarterly Summary\n\nKey metrics:\n- Revenue up 15%\n- 42 new deals closed\n\nNext steps: Focus on enterprise pipeline."
  }
}
```

### RECORD_TABLE (always run the 3-step pre-sequence first)

**Step 1 — create_view:**
```json
{
  "name": "Active Repairs",
  "objectNameSingular": "repair",
  "type": "TABLE"
}
// → { "id": "<viewId>" }
```

**Step 2 — create_many_view_fields:**
```json
{
  "viewFields": [
    { "viewId": "<viewId>", "fieldMetadataId": "<id>", "position": 1, "isVisible": true },
    { "viewId": "<viewId>", "fieldMetadataId": "<id>", "position": 2, "isVisible": true }
  ]
}
```

**Step 3 — create_many_view_filters:**
```json
{
  "filters": [
    { "viewId": "<viewId>", "fieldMetadataId": "<id>", "operand": "IS_NOT", "value": "DONE" }
  ]
}
```

**Step 3b — create_view_sort:**
```json
{
  "viewId": "<viewId>", "fieldMetadataId": "<id>", "direction": "DESC"
}
```

**Step 4 — add_dashboard_widget:**
```json
{
  "type": "RECORD_TABLE",
  "objectMetadataId": "<objectMetadataId>",
  "configuration": {
    "configurationType": "RECORD_TABLE",
    "viewId": "<viewId>"
  },
  "gridPosition": { "row": 0, "column": 0, "rowSpan": 8, "columnSpan": 12 }
}
```

---

## Tabs

Use `add_dashboard_tab` to create multiple tabs in a dashboard. Each tab has its own set of widgets. Good tab structure: one overview tab (KPIs + charts) + one or more detail tabs (RECORD_TABLE + focused charts). After creating a tab, use its returned `tabId` as `pageLayoutTabId` when calling `add_dashboard_widget`.

---

## Grid System

- 12 columns (0-11)
- KPI widgets: `rowSpan` 2-4, `columnSpan` 3-4
- Charts: `rowSpan` 6-8, `columnSpan` 6-12
- Record tables: `rowSpan` 6-10, `columnSpan` 6-12 (full-width preferred)
- Common layouts: 4 KPIs in a row (`columnSpan` 3), 2 charts side by side (`columnSpan` 6), full width chart or table (`columnSpan` 12)

---

## Best Practices

- Place KPIs at the top (row 0)
- Group related charts together
- Use consistent heights within rows
- Start simple, add complexity as needed
- When modifying a chart, confirm whether the user wants to change settings or change chart type
- Use RECORD_TABLE widgets to give users direct access to filtered record lists without leaving the dashboard
