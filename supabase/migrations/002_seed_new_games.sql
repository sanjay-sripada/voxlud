-- Seed demo games for new game types (flappy, shooter, tetris, memory)
insert into public.games (id, user_id, prompt, config, author, plays, likes, featured, created_at)
values
  (
    'demo-flappy', null,
    'A flappy bird game with narrow pipes and fast gravity',
    '{"type":"flappy","mode":"solo","title":"Pipe Flapper","description":"Tap to fly through gaps and beat your high score.","theme":{"primary":"#22d3ee","secondary":"#38bdf8","background":"#0a1628","accent":"#fbbf24"},"settings":{"pipeGap":140,"gravity":0.55,"pipeSpeed":3}}'::jsonb,
    'Voxlud', 1103, 94, true, '2026-02-20T09:00:00Z'
  ),
  (
    'demo-shooter', null,
    'A space shooter where you blast asteroids with rapid fire',
    '{"type":"shooter","mode":"solo","title":"Cosmic Blaster","description":"Blast asteroids and survive the cosmic onslaught.","theme":{"primary":"#6366f1","secondary":"#818cf8","background":"#050510","accent":"#f472b6"},"settings":{"enemySpeed":2,"rapidFire":true,"theme":"space"}}'::jsonb,
    'Voxlud', 876, 72, true, '2026-02-22T14:00:00Z'
  ),
  (
    'demo-tetris', null,
    'A classic tetris game with falling blocks',
    '{"type":"tetris","mode":"solo","title":"Block Stacker","description":"Stack blocks and clear lines for big points.","theme":{"primary":"#8b5cf6","secondary":"#a78bfa","background":"#120a1f","accent":"#34d399"},"settings":{"dropSpeed":600,"gridWidth":10}}'::jsonb,
    'Voxlud', 534, 45, false, '2026-02-25T10:00:00Z'
  ),
  (
    'demo-memory', null,
    'A memory card matching game with a 4x4 grid',
    '{"type":"memory","mode":"solo","title":"Emoji Memory","description":"Flip cards and find all the matching pairs.","theme":{"primary":"#10b981","secondary":"#34d399","background":"#0a1a14","accent":"#fbbf24"},"settings":{"gridSize":4,"timeLimit":0}}'::jsonb,
    'Voxlud', 412, 38, false, '2026-03-01T16:00:00Z'
  )
on conflict (id) do nothing;
