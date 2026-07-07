# Feature Development Workflow

**Owner:** @forge  
**Team:** Development

## Phases

### 1. Plan (via @plan / `/architect`)
- Read relevant docs (AGENTS.md, context/)
- Identify key decisions
- Produce implementation plan
- Confirm before building

### 2. Build (via @forge / @pixel)
- Backend: Express routes, Mongoose models, workers
- Frontend: React components, pages, hooks
- Follow AGENTS.md immutable rules
- Run `bun test` after each feature

### 3. Review (via @review / `/review`)
- Plan layer: Does it match what was agreed?
- System layer: Does it respect architecture?
- Production layer: Is it ready to ship?

### 4. Deploy (via @vault)
- Run `bun run build` — verify no errors
- Run `bun test` — all tests pass
- Deploy via Coolify
- Verify healthz endpoints

### 5. Document
- Update `context/progress-tracker.md`
- Run `/imprint` for new UI components
- Run `/remember save` at session end
