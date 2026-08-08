-- Demo online pong for testing multiplayer rooms
INSERT INTO games (id, user_id, prompt, config, author, plays, likes, featured, published, chat_history)
VALUES (
  'demo-online-pong',
  NULL,
  'An online multiplayer pong battle I can share with a friend',
  '{
    "type": "pong",
    "mode": "online",
    "title": "Online Pong",
    "description": "Share the room link and challenge a friend to a remote paddle battle.",
    "theme": {
      "primary": "#6366f1",
      "secondary": "#818cf8",
      "background": "#0f0f23",
      "accent": "#f472b6"
    },
    "settings": {
      "shrinkPaddles": false,
      "speed": 1.1,
      "ballSize": 1
    }
  }'::jsonb,
  'Voxlud',
  0,
  0,
  true,
  true,
  '[]'::jsonb
)
ON CONFLICT (id) DO NOTHING;
