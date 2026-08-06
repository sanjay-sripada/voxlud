import type { GameConfig, GameMode, GameType } from "@/types/game";

const GAME_TYPES: GameType[] = [
  "pong",
  "snake",
  "breakout",
  "runner",
  "clicker",
  "flappy",
  "shooter",
  "tetris",
  "memory",
  "whack",
  "dodge",
  "slide",
  "catch",
  "cross",
  "stack",
  "simon",
  "reaction",
];

const GAME_MODES: GameMode[] = ["solo", "local-multiplayer", "online"];

const DEFAULT_THEME = {
  primary: "#6366f1",
  secondary: "#818cf8",
  background: "#0f0f23",
  accent: "#f472b6",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isHexColor(value: unknown): value is string {
  return typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value);
}

function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  if (typeof value !== "number" || Number.isNaN(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}

function sanitizeSettings(type: GameType, settings: Record<string, unknown>): Record<string, unknown> {
  switch (type) {
    case "pong":
      return {
        shrinkPaddles: Boolean(settings.shrinkPaddles),
        speed: clampNumber(settings.speed, 0.5, 2, 1),
        ballSize: clampNumber(settings.ballSize, 0.5, 2, 1),
      };
    case "snake":
      return {
        colorMatch: Boolean(settings.colorMatch),
        gridSize: clampNumber(settings.gridSize, 8, 24, 16),
        speed: clampNumber(settings.speed, 80, 250, 150),
      };
    case "breakout":
      return {
        rows: clampNumber(settings.rows, 2, 8, 5),
        powerUps: Boolean(settings.powerUps),
        lives: clampNumber(settings.lives, 1, 5, 3),
      };
    case "runner":
      return {
        gravityFlip: Boolean(settings.gravityFlip),
        obstacleSpeed: clampNumber(settings.obstacleSpeed, 0.5, 2.5, 1.2),
        theme: ["space", "neon", "default"].includes(String(settings.theme))
          ? settings.theme
          : "default",
      };
    case "clicker":
      return {
        upgrades: settings.upgrades !== false,
        autoClick: Boolean(settings.autoClick),
        theme: ["cafe", "space", "default"].includes(String(settings.theme))
          ? settings.theme
          : "default",
      };
    case "flappy":
      return {
        pipeGap: clampNumber(settings.pipeGap, 100, 220, 160),
        gravity: clampNumber(settings.gravity, 0.25, 0.9, 0.5),
        pipeSpeed: clampNumber(settings.pipeSpeed, 1.5, 4, 2.8),
      };
    case "shooter":
      return {
        enemySpeed: clampNumber(settings.enemySpeed, 0.8, 3, 1.8),
        rapidFire: Boolean(settings.rapidFire),
        theme: settings.theme === "space" ? "space" : "default",
      };
    case "tetris":
      return {
        dropSpeed: clampNumber(settings.dropSpeed, 300, 1000, 600),
        gridWidth: clampNumber(settings.gridWidth, 8, 12, 10),
      };
    case "memory":
      return {
        gridSize: clampNumber(settings.gridSize, 3, 6, 4),
        timeLimit: clampNumber(settings.timeLimit, 0, 120, 0),
      };
    case "whack":
      return {
        duration: clampNumber(settings.duration, 15, 60, 30),
        moleSpeed: clampNumber(settings.moleSpeed, 0.5, 2, 1),
      };
    case "dodge":
      return {
        fallSpeed: clampNumber(settings.fallSpeed, 0.8, 3, 1.6),
        density: clampNumber(settings.density, 0.5, 2, 1),
      };
    case "slide":
      return {
        gridSize: 4,
        target: settings.target === 4096 ? 4096 : 2048,
      };
    case "catch":
      return {
        fallSpeed: clampNumber(settings.fallSpeed, 0.8, 2.5, 1.4),
        lives: clampNumber(settings.lives, 1, 5, 3),
      };
    case "cross":
      return {
        lanes: clampNumber(settings.lanes, 4, 10, 7),
        carSpeed: clampNumber(settings.carSpeed, 0.8, 2.5, 1.4),
      };
    case "stack":
      return {
        blockSpeed: clampNumber(settings.blockSpeed, 0.8, 3, 1.6),
        startWidth: clampNumber(settings.startWidth, 60, 140, 100),
      };
    case "simon":
      return {
        speed: clampNumber(settings.speed, 400, 1000, 650),
        colors: 4,
      };
    case "reaction":
      return {
        rounds: clampNumber(settings.rounds, 2, 10, 5),
        minDelay: clampNumber(settings.minDelay, 600, 2000, 800),
      };
    default:
      return {};
  }
}

export function parseGameConfig(raw: unknown): GameConfig | null {
  if (!isRecord(raw)) return null;

  const type = raw.type;
  const mode = raw.mode;
  const title = raw.title;
  const description = raw.description;
  const theme = raw.theme;
  const settings = raw.settings;

  if (!GAME_TYPES.includes(type as GameType)) return null;
  if (!GAME_MODES.includes(mode as GameMode)) return null;
  if (typeof title !== "string" || title.trim().length < 1 || title.length > 80) return null;
  if (typeof description !== "string" || description.trim().length < 1 || description.length > 200)
    return null;

  const gameType = type as GameType;
  const gameMode = mode as GameMode;

  let parsedTheme = { ...DEFAULT_THEME };
  if (isRecord(theme)) {
    parsedTheme = {
      primary: isHexColor(theme.primary) ? theme.primary : DEFAULT_THEME.primary,
      secondary: isHexColor(theme.secondary) ? theme.secondary : DEFAULT_THEME.secondary,
      background: isHexColor(theme.background) ? theme.background : DEFAULT_THEME.background,
      accent: isHexColor(theme.accent) ? theme.accent : DEFAULT_THEME.accent,
    };
  }

  const parsedSettings = isRecord(settings) ? sanitizeSettings(gameType, settings) : sanitizeSettings(gameType, {});

  let emoji: string | undefined;
  if (typeof raw.emoji === "string" && raw.emoji.trim()) {
    emoji = raw.emoji.trim().slice(0, 8);
  } else if (typeof parsedSettings.playerEmoji === "string") {
    emoji = String(parsedSettings.playerEmoji).trim().slice(0, 8);
  }

  return {
    type: gameType,
    mode: gameMode,
    title: title.trim(),
    description: description.trim(),
    theme: parsedTheme,
    settings: parsedSettings,
    ...(emoji ? { emoji } : {}),
  };
}

export function getGameConfigSchemaHint(): string {
  return `Return JSON with this shape:
{
  "type": one of ${GAME_TYPES.join("|")},
  "mode": "solo" | "local-multiplayer" | "online",
  "title": string (max 80 chars, catchy name from the prompt),
  "description": string (max 200 chars, one sentence),
  "theme": { "primary", "secondary", "background", "accent" } — hex colors matching the vibe,
  "emoji": required — single emoji for the player/hero (e.g. "🚗" for car games, "🐱" for cat games),
  "settings": object — tune difficulty/mechanics for the chosen type
}

Settings by type:
- pong: shrinkPaddles (bool), speed (0.5-2), ballSize (0.5-2)
- snake: colorMatch (bool), gridSize (8-24), speed (80-250)
- breakout: rows (2-8), powerUps (bool), lives (1-5)
- runner: gravityFlip (bool), obstacleSpeed (0.5-2.5), theme ("space"|"neon"|"default")
- clicker: upgrades (bool), autoClick (bool), theme ("cafe"|"space"|"default")
- flappy: pipeGap (100-220), gravity (0.25-0.9), pipeSpeed (1.5-4)
- shooter: enemySpeed (0.8-3), rapidFire (bool), theme ("space"|"default")
- tetris: dropSpeed (300-1000), gridWidth (8-12)
- memory: gridSize (3-6), timeLimit (0 or 30-120 seconds)
- whack: duration (15-60), moleSpeed (0.5-2)
- dodge: fallSpeed (0.8-3), density (0.5-2)
- slide: target (2048 or 4096)
- catch: fallSpeed (0.8-2.5), lives (1-5)
- cross: lanes (4-10), carSpeed (0.8-2.5)
- stack: blockSpeed (0.8-3), startWidth (60-140)
- simon: speed (400-1000)
- reaction: rounds (2-10), minDelay (600-2000)`;
}
