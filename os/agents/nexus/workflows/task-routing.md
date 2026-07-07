# Task Routing Workflow

**Owner:** @nexus  
**Trigger:** Any incoming task

## Routing Decision Flow

1. **Identify task type** — What needs to be done?
2. **Match to team** — Which team owns this domain?
3. **Select agent** — Which agent has the right skills?
4. **Check workload** — Is the agent available?
5. **Delegate** — Route with clear instructions
6. **Track** — Note in STATUS.md for follow-up

## Routing Matrix

| Task Domain | Primary Agent | Fallback |
|------------|--------------|----------|
| Research / leads | @scout | @compass |
| Sales / closing | @clutch | @bridge |
| Partnerships | @bridge | @compass |
| Content / SEO | @ink | @signal |
| Social / community | @signal | @ink |
| Analytics / data | @lens | @pulse |
| Backend / architecture | @forge | @vault |
| Frontend / UI | @pixel | @forge |
| DevOps / infra | @vault | @forge |
| Product / roadmap | @compass | @pulse |
| User research | @pulse | @compass |
| UX / design | @craft | @pixel |
| Feature planning | @plan | — |
| Code review | @review | — |

## Quality Checks

- Was the task completed?
- Were AGENTS.md rules followed?
- Update STATUS.md if needed
