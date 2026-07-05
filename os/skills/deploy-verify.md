# Deploy Verify Skill

Safe deployment checklists.

## When to Use

- Every production deploy
- Hotfix releases
- Infrastructure changes
- Dependency updates
- Rollback verification

## Method

1. Pre-flight: tests, typecheck, build pass
2. Staging deploy + smoke tests
3. Production deploy (blue-green or rolling)
4. Post-flight: health checks, error rates, key flows
5. Rollback plan ready before deploy starts

## Assigned Agents

- @vault — primary deployer
- @forge — code review + tests
- @pixel — UI verification

---
## Where to Go Next

- Back to entry point: `AGENTS.md`
- Related: `os/skills/design-ux.md`
- Assigned agent: @vault
