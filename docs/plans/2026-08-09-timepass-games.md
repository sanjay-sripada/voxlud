# Plan: Timepass-style game expansion

**Date:** 2026-08-09  
**Brief:** [docs/briefs/2026-08-09-timepass-games.md](./briefs/2026-08-09-timepass-games.md)  
**Gate:** Auto-approved (`/forge` one-go)

## Approach

1. **Game engines** — Canvas modules following existing `whack` / `reaction` patterns
2. **Wiring** — Extend `GameType`, registry, input handlers, validator, generator, labels
3. **Data** — Migration `009_seed_timepass_games.sql` with explicit `published = true`
4. **Quality** — Bun tests on validator + generator; fix ExplorePageClient router-in-setState bug
5. **Ship** — `forge-eval`, build, QA browse, PR

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Game count | 4 types | Matches timepass casual staples without scope creep |
| Publish flag | Explicit in INSERT | Migration 006 defaults `published=false`; caused invisible games |
| Test runner | `bun test` | Available in environment; no new deps |

## Tasks

- [x] Implement game modules
- [x] Wire registry + types + validator + generator
- [x] Fix migration published flag
- [ ] Add unit tests + test script
- [ ] Fix ExplorePageClient URL sync
- [ ] Run eval, build, QA
- [ ] Commit + PR
