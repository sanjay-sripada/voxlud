# Forge one-go run

- **Date:** 2026-08-09
- **Brief:** [docs/briefs/2026-08-09-timepass-games.md](./briefs/2026-08-09-timepass-games.md)
- **Plan:** [docs/plans/2026-08-09-timepass-games.md](./plans/2026-08-09-timepass-games.md)
- **PR:** (see below after push)

## Shipped

- Added 4 timepass-inspired game types: minesweeper, target, bubble, pinball (canvas engines + full wiring)
- Fixed seed migration `009` to set `published = true` so Explore shows demo games
- Added unit tests, Explore URL-sync fix, and target-before-shooter prompt detection

## Golden path

| Check | Result |
|-------|--------|
| CLAUDE.md/AGENTS.md | pass |
| `bun test src/lib` (10 tests) | pass |
| `npm run build` | pass |
| `forge-eval` | pass (except forge_doctor — Forge install env issue, not product) |
| Explore shows new games | pass (Mine Hunter, Target Blitz, Bubble Burst, Neon Pinball on :3003) |
| Secret scan | pass |

## Follow-ups

- Run `supabase/migrations/009_seed_timepass_games.sql` in Supabase if games missing in other environments
- Consider adding canvas integration tests for tap handlers
