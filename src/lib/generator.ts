import type { GameConfig, GameType, GameMode } from "@/types/game";

const THEMES = [
  { primary: "#6366f1", secondary: "#818cf8", background: "#0f0f23", accent: "#f472b6" },
  { primary: "#10b981", secondary: "#34d399", background: "#0a1a14", accent: "#fbbf24" },
  { primary: "#f43f5e", secondary: "#fb7185", background: "#1a0a0f", accent: "#38bdf8" },
  { primary: "#8b5cf6", secondary: "#a78bfa", background: "#120a1f", accent: "#22d3ee" },
  { primary: "#f97316", secondary: "#fb923c", background: "#1a1008", accent: "#a3e635" },
];

interface ParsedPrompt {
  type: GameType;
  mode: GameMode;
  title: string;
  description: string;
  settings: Record<string, unknown>;
  themeIndex: number;
}

function detectGameType(prompt: string): GameType {
  const p = prompt.toLowerCase();
  if (/pong|paddle|ping.?pong|tennis/.test(p)) return "pong";
  if (/snake|serpent|worm|connect.*color|color.*match/.test(p)) return "snake";
  if (/break|brick|breakout|smash|block/.test(p)) return "breakout";
  if (/run|runner|jump|gravity|dodge|endless|flappy/.test(p)) return "runner";
  if (/click|tycoon|cafe|idle|tap|coin|upgrade/.test(p)) return "clicker";
  if (/shoot|shooter|space|asteroid/.test(p)) return "breakout";
  if (/puzzle|match|connect/.test(p)) return "snake";
  return "runner";
}

function detectMode(prompt: string): GameMode {
  const p = prompt.toLowerCase();
  if (/online|room|remote|internet|share link/.test(p)) return "online";
  if (/multi|2.?player|two.?player|versus|vs|local|party|co-?op|competitive/.test(p))
    return "local-multiplayer";
  return "solo";
}

function extractTitle(prompt: string, type: GameType): string {
  const cleaned = prompt.trim().replace(/[.!?]+$/, "");
  if (cleaned.length <= 50) return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);

  const typeNames: Record<GameType, string> = {
    pong: "Pong Battle",
    snake: "Color Snake",
    breakout: "Brick Breaker",
    runner: "Gravity Runner",
    clicker: "Tap Tycoon",
  };
  return typeNames[type];
}

function buildSettings(prompt: string, type: GameType): Record<string, unknown> {
  const p = prompt.toLowerCase();
  const settings: Record<string, unknown> = {};

  switch (type) {
    case "pong":
      settings.shrinkPaddles = /shrink|smaller|tiny/.test(p);
      settings.speed = /fast|speed|intense|hard/.test(p) ? 1.5 : /slow|chill|easy/.test(p) ? 0.7 : 1;
      settings.ballSize = /big|large|huge/.test(p) ? 1.5 : /small|tiny/.test(p) ? 0.7 : 1;
      break;
    case "snake":
      settings.colorMatch = /color|match|connect|puzzle/.test(p);
      settings.gridSize = /big|large/.test(p) ? 12 : /small|tiny/.test(p) ? 20 : 16;
      settings.speed = /fast|hard/.test(p) ? 120 : /slow|easy/.test(p) ? 200 : 150;
      break;
    case "breakout":
      settings.rows = /many|lots|hard/.test(p) ? 6 : /few|easy/.test(p) ? 3 : 5;
      settings.powerUps = /power.?up|bonus|special/.test(p);
      settings.lives = /hard|one life/.test(p) ? 1 : /easy|many lives/.test(p) ? 5 : 3;
      break;
    case "runner":
      settings.gravityFlip = /gravity|flip|invert|tap/.test(p);
      settings.obstacleSpeed = /fast|hard|intense/.test(p) ? 1.8 : /slow|easy/.test(p) ? 0.8 : 1.2;
      settings.theme = /space|cosmic|star/.test(p)
        ? "space"
        : /neon|cyber|retro/.test(p)
          ? "neon"
          : "default";
      break;
    case "clicker":
      settings.upgrades = /upgrade|tycoon|cafe|shop/.test(p);
      settings.autoClick = /auto|idle|passive/.test(p);
      settings.theme = /cat|cafe|cozy/.test(p) ? "cafe" : /space|rocket/.test(p) ? "space" : "default";
      break;
  }

  return settings;
}

function parsePrompt(prompt: string): ParsedPrompt {
  const type = detectGameType(prompt);
  const mode = detectMode(prompt);
  const title = extractTitle(prompt, type);
  const themeIndex = Math.abs(hashString(prompt)) % THEMES.length;

  const descriptions: Record<GameType, string> = {
    pong: "Classic paddle battle — first to 5 wins!",
    snake: "Grow your snake and match colors to score big.",
    breakout: "Smash every brick and chase the high score.",
    runner: "Dodge obstacles in this endless runner.",
    clicker: "Tap, upgrade, and build your empire.",
  };

  return {
    type,
    mode,
    title,
    description: descriptions[type],
    settings: buildSettings(prompt, type),
    themeIndex,
  };
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

export function generateGameFromPrompt(prompt: string): GameConfig {
  const parsed = parsePrompt(prompt);
  const theme = THEMES[parsed.themeIndex];

  return {
    type: parsed.type,
    mode: parsed.mode,
    title: parsed.title,
    description: parsed.description,
    theme,
    settings: parsed.settings,
  };
}

export function getGenerationDelay(): number {
  return 1500 + Math.random() * 1500;
}

export function getExamplePrompts(): string[] {
  return [
    "A two-player pong game where paddles shrink after every point",
    "A solo mobile runner where every tap flips gravity",
    "A cozy cat cafe tycoon with upgrades and outfits",
    "A puzzle game where snakes connect matching colors",
    "A fast brick breaker with power-ups and 3 lives",
    "A competitive local multiplayer pong battle",
  ];
}
