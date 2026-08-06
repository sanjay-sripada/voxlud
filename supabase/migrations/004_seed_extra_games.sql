-- Seed demo games for cross, stack, simon, reaction
insert into public.games (id, user_id, prompt, config, author, plays, likes, featured, created_at)
values
  (
    'demo-cross', null,
    'A frogger game where you cross busy traffic lanes',
    '{"type":"cross","mode":"solo","title":"Road Hopper","description":"Dodge traffic and reach the other side to score.","theme":{"primary":"#84cc16","secondary":"#a3e635","background":"#0f1a08","accent":"#fbbf24"},"settings":{"lanes":7,"carSpeed":1.4}}'::jsonb,
    'Voxlud', 612, 53, true, '2026-03-09T10:00:00Z'
  ),
  (
    'demo-stack', null,
    'A stack tower game where you align falling blocks',
    '{"type":"stack","mode":"solo","title":"Sky Stack","description":"Drop blocks with perfect timing to build the tallest tower.","theme":{"primary":"#06b6d4","secondary":"#22d3ee","background":"#081318","accent":"#f472b6"},"settings":{"blockSpeed":1.6,"startWidth":100}}'::jsonb,
    'Voxlud', 498, 41, false, '2026-03-10T12:00:00Z'
  ),
  (
    'demo-simon', null,
    'A simon says memory sequence game with colors',
    '{"type":"simon","mode":"solo","title":"Color Echo","description":"Watch the lights and repeat the growing pattern.","theme":{"primary":"#8b5cf6","secondary":"#a78bfa","background":"#120a1f","accent":"#34d399"},"settings":{"speed":650,"colors":4}}'::jsonb,
    'Voxlud', 367, 34, false, '2026-03-11T09:00:00Z'
  ),
  (
    'demo-reaction', null,
    'A reaction time test — tap when the screen turns green',
    '{"type":"reaction","mode":"solo","title":"Reflex Rush","description":"Wait for green, then tap as fast as you can!","theme":{"primary":"#22c55e","secondary":"#4ade80","background":"#0a140e","accent":"#ef4444"},"settings":{"rounds":5,"minDelay":800}}'::jsonb,
    'Voxlud', 723, 62, true, '2026-03-12T14:00:00Z'
  )
on conflict (id) do nothing;
