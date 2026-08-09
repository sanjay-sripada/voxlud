-- Seed demo games inspired by timepass.games (minesweeper, target, bubble, pinball)
insert into public.games (id, user_id, prompt, config, author, plays, likes, featured, published, created_at)
values
  (
    'demo-minesweeper', null,
    'A classic minesweeper puzzle with a 9x9 grid and hidden mines',
    '{"type":"minesweeper","mode":"solo","title":"Mine Hunter","description":"Reveal all safe tiles without hitting a mine.","theme":{"primary":"#64748b","secondary":"#94a3b8","background":"#0f1419","accent":"#ef4444"},"settings":{"gridSize":9,"mines":10}}'::jsonb,
    'Voxlud', 891, 74, true, true, '2026-03-15T10:00:00Z'
  ),
  (
    'demo-target', null,
    'A target shooting gallery where you tap moving targets before they escape',
    '{"type":"target","mode":"solo","title":"Target Blitz","description":"Tap targets before they escape the screen!","theme":{"primary":"#f43f5e","secondary":"#fb7185","background":"#1a0a0f","accent":"#fbbf24"},"settings":{"duration":30,"targetSpeed":1.8,"maxMisses":5}}'::jsonb,
    'Voxlud', 1043, 88, true, true, '2026-03-16T11:00:00Z'
  ),
  (
    'demo-bubble', null,
    'A bubble pop game where you match and pop colored bubbles',
    '{"type":"bubble","mode":"solo","title":"Bubble Burst","description":"Pop groups of matching bubbles to clear the board.","theme":{"primary":"#8b5cf6","secondary":"#a78bfa","background":"#120a1f","accent":"#22d3ee"},"settings":{"cols":8,"rows":10,"colors":5,"pops":25}}'::jsonb,
    'Voxlud', 756, 63, false, true, '2026-03-17T09:00:00Z'
  ),
  (
    'demo-pinball', null,
    'A pinball arcade game with flippers and bumpers',
    '{"type":"pinball","mode":"solo","title":"Neon Pinball","description":"Use flippers to keep the ball alive and hit bumpers.","theme":{"primary":"#06b6d4","secondary":"#22d3ee","background":"#081318","accent":"#f472b6"},"settings":{"bumpers":5,"lives":3,"ballSpeed":1}}'::jsonb,
    'Voxlud', 623, 51, false, true, '2026-03-18T14:00:00Z'
  )
on conflict (id) do update set published = true;
