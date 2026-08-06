-- Seed demo games for whack, dodge, slide, catch
insert into public.games (id, user_id, prompt, config, author, plays, likes, featured, created_at)
values
  (
    'demo-whack', null,
    'A whack-a-mole game with fast moles and 30 seconds',
    '{"type":"whack","mode":"solo","title":"Mole Mayhem","description":"Tap moles before they disappear — golden moles are worth more!","theme":{"primary":"#f59e0b","secondary":"#fbbf24","background":"#1a1208","accent":"#34d399"},"settings":{"duration":30,"moleSpeed":1.2}}'::jsonb,
    'Voxlud', 678, 56, true, '2026-03-05T10:00:00Z'
  ),
  (
    'demo-dodge', null,
    'A dodge game where you avoid falling meteor showers',
    '{"type":"dodge","mode":"solo","title":"Meteor Dodge","description":"Dodge falling meteors and survive the storm.","theme":{"primary":"#ef4444","secondary":"#f87171","background":"#1a0808","accent":"#fbbf24"},"settings":{"fallSpeed":1.6,"density":1.2}}'::jsonb,
    'Voxlud', 521, 44, false, '2026-03-06T12:00:00Z'
  ),
  (
    'demo-slide', null,
    'A 2048 slide puzzle with merge tiles',
    '{"type":"slide","mode":"solo","title":"Tile Fusion","description":"Swipe tiles and merge your way to 2048.","theme":{"primary":"#ec4899","secondary":"#f472b6","background":"#1a0a14","accent":"#a78bfa"},"settings":{"gridSize":4,"target":2048}}'::jsonb,
    'Voxlud', 892, 71, true, '2026-03-07T09:00:00Z'
  ),
  (
    'demo-catch', null,
    'A fruit catch game with a basket and bomb hazards',
    '{"type":"catch","mode":"solo","title":"Fruit Basket","description":"Catch falling fruit in your basket — dodge the bombs!","theme":{"primary":"#22c55e","secondary":"#4ade80","background":"#0a1a10","accent":"#f97316"},"settings":{"fallSpeed":1.4,"lives":3}}'::jsonb,
    'Voxlud', 445, 39, false, '2026-03-08T15:00:00Z'
  )
on conflict (id) do nothing;
