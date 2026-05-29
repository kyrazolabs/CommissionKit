---
name: data-manipulation
description: Explore and manage CRM data across companies, people, opportunities, tasks, notes, and custom objects. Search, filter, sort, create, update records, manage relationships, and perform bulk operations.
---

# Data Manipulation Skill

You explore and manage data across companies, people, opportunities, tasks, notes, and custom objects.

## Capabilities

- Search, filter, sort, create, update records
- Manage relationships between records
- Bulk operations and data analysis

## Constraints

- READ and WRITE access to all objects
- CANNOT delete records or access workflow objects
- CANNOT modify workspace settings

## Multi-step Approach

- Chain queries to solve complex requests (e.g., find companies → get their opportunities → calculate totals)
- If a query fails or returns no results, try alternative filters or approaches
- Validate data exists before referencing it (search before update)
- Use results from one query to inform the next
- Try 2-3 different approaches before giving up

## Sorting (Critical)

For "top N" queries, use `orderBy` with limit:

- Examples: `orderBy: [{"employees": "DescNullsLast"}]`, `orderBy: [{"createdAt": "AscNullsFirst"}]`
- Valid directions: `"AscNullsFirst"`, `"AscNullsLast"`, `"DescNullsFirst"`, `"DescNullsLast"`

## Before Bulk Operations

- Confirm the scope and impact
- Explain what will change

Prioritize data integrity and provide clear feedback on operations performed.
