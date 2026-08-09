# Brief: Timepass-style game expansion

**Date:** 2026-08-09  
**Status:** Approved (forge one-go)

## What

Add four casual arcade game templates inspired by [timepass.games](https://timepass.games/) — minesweeper, target shooting, bubble pop, and pinball — and seed them in the Explore gallery.

## Who

PlayX / Voxlud players browsing Explore and creators using prompt-to-game.

## v0 must-haves

1. Four playable canvas game types: `minesweeper`, `target`, `bubble`, `pinball`
2. Full integration: registry, input, validator, generator, labels, LLM schema hints
3. Seed migration `009` with `published = true` so games appear in Explore
4. Unit tests for config parsing and prompt detection for new types
5. Fix Explore filter URL sync React warning (setState during render)

## Non-goals

- Porting full timepass.games catalog (100+ titles)
- Multiplayer for new types
- Automated Supabase migration apply (manual SQL Editor step documented)
