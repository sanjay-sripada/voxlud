import type { GameConfig, GameType, GameMode } from "@/types/game";
import { ensurePlayerEmoji } from "@/lib/infer-player-emoji";

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
  if (/tetris|tetromino|falling.?block|stack/.test(p)) return "tetris";
  if (/memory|match.?pair|card.?game|concentration/.test(p)) return "memory";
  if (/flappy|bird|fly.?through|pipe/.test(p)) return "flappy";
  if (/shoot|shooter|space|asteroid|invader|laser|galaxy/.test(p)) return "shooter";
  if (/snake|serpent|worm|connect.*color|color.*match/.test(p)) return "snake";
  if (/break|brick|breakout|smash/.test(p)) return "breakout";
  if (/click|tycoon|cafe|idle|tap|coin|upgrade/.test(p)) return "clicker";
  if (/simon|sequence|repeat|pattern|memory.?chain/.test(p)) return "simon";
  if (/reaction|reflex|quick.?tap|speed.?test/.test(p)) return "reaction";
  if (/stack.?tower|stacking|align.?block|tower.?stack/.test(p)) return "stack";
  if (/cross|frogger|crossy|road.?cross|traffic|highway/.test(p)) return "cross";
  if (/whack|mole|hammer|bash/.test(p)) return "whack";
  if (/2048|slide.?puzzle|number.?merge|merge.?tile/.test(p)) return "slide";
  if (/catch|basket|fruit.?catch|collect.?fall/.test(p)) return "catch";
  if (/car|racing|race|driv|vehicle|automobile|🏎|🚗|🚙/.test(p)) return "runner";
  if (/dodge|avoid|sidestep|dodgeball/.test(p)) return "dodge";
  if (/run|runner|jump|gravity|endless/.test(p)) return "runner";
  if (/puzzle|match|connect|block/.test(p)) return "snake";
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
    flappy: "Flappy Flyer",
    shooter: "Space Shooter",
    tetris: "Block Stacker",
    memory: "Memory Match",
    whack: "Whack Attack",
    dodge: "Dodge Rush",
    slide: "Tile Slide",
    catch: "Fruit Catch",
    cross: "Road Crosser",
    stack: "Tower Stack",
    simon: "Simon Says",
    reaction: "Reaction Test",
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
      if (/car|racing|vehicle|🏎|🚗|🚙/.test(p)) {
        settings.playerEmoji = "🚗";
      }
      break;
    case "clicker":
      settings.upgrades = /upgrade|tycoon|cafe|shop/.test(p);
      settings.autoClick = /auto|idle|passive/.test(p);
      settings.theme = /cat|cafe|cozy/.test(p) ? "cafe" : /space|rocket/.test(p) ? "space" : "default";
      break;
    case "flappy":
      settings.pipeGap = /hard|tight|narrow/.test(p) ? 120 : /easy|wide/.test(p) ? 200 : 160;
      settings.gravity = /hard|fast|intense/.test(p) ? 0.7 : /easy|slow/.test(p) ? 0.35 : 0.5;
      settings.pipeSpeed = /fast|hard/.test(p) ? 3.5 : /slow|easy/.test(p) ? 2 : 2.8;
      break;
    case "shooter":
      settings.enemySpeed = /fast|hard|intense/.test(p) ? 2.5 : /slow|easy/.test(p) ? 1 : 1.8;
      settings.rapidFire = /rapid|machine|auto/.test(p);
      settings.theme = /space|cosmic|star|galaxy/.test(p) ? "space" : "default";
      break;
    case "tetris":
      settings.dropSpeed = /fast|hard|intense/.test(p) ? 400 : /slow|easy/.test(p) ? 800 : 600;
      settings.gridWidth = /wide|big/.test(p) ? 12 : /narrow|small/.test(p) ? 8 : 10;
      break;
    case "memory":
      settings.gridSize = /hard|big|large/.test(p) ? 6 : /easy|small/.test(p) ? 3 : 4;
      settings.timeLimit = /timed|rush|speed/.test(p) ? 60 : 0;
      break;
    case "whack":
      settings.duration = /long|marathon/.test(p) ? 45 : /quick|short/.test(p) ? 20 : 30;
      settings.moleSpeed = /fast|hard|intense/.test(p) ? 1.5 : /slow|easy/.test(p) ? 0.7 : 1;
      break;
    case "dodge":
      settings.fallSpeed = /fast|hard|intense/.test(p) ? 2.2 : /slow|easy/.test(p) ? 1 : 1.6;
      settings.density = /chaos|many|hard/.test(p) ? 1.5 : 1;
      break;
    case "slide":
      settings.gridSize = 4;
      settings.target = /4096|hard/.test(p) ? 4096 : 2048;
      break;
    case "catch":
      settings.fallSpeed = /fast|hard/.test(p) ? 2 : /slow|easy/.test(p) ? 1 : 1.4;
      settings.lives = /hard|one life/.test(p) ? 2 : /easy/.test(p) ? 5 : 3;
      break;
    case "cross":
      settings.lanes = /hard|busy|chaos/.test(p) ? 9 : /easy/.test(p) ? 5 : 7;
      settings.carSpeed = /fast|hard/.test(p) ? 2 : /slow|easy/.test(p) ? 1 : 1.4;
      if (/car|🚗|🏎/.test(p)) settings.playerEmoji = "🚗";
      break;
    case "stack":
      settings.blockSpeed = /fast|hard/.test(p) ? 2.2 : /slow|easy/.test(p) ? 1 : 1.6;
      settings.startWidth = /wide|easy/.test(p) ? 120 : /narrow|hard/.test(p) ? 70 : 100;
      break;
    case "simon":
      settings.speed = /fast|hard/.test(p) ? 500 : /slow|easy/.test(p) ? 900 : 650;
      settings.colors = 4;
      break;
    case "reaction":
      settings.rounds = /long|marathon/.test(p) ? 8 : /quick|short/.test(p) ? 3 : 5;
      settings.minDelay = /hard/.test(p) ? 1200 : 800;
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
    flappy: "Tap to fly through gaps and beat your high score.",
    shooter: "Blast asteroids and survive the cosmic onslaught.",
    tetris: "Stack blocks and clear lines for big points.",
    memory: "Flip cards and find all the matching pairs.",
    whack: "Tap moles before they disappear!",
    dodge: "Dodge falling hazards and survive.",
    slide: "Swipe tiles and merge to reach 2048.",
    catch: "Catch fruit in your basket — avoid bombs!",
    cross: "Cross busy roads and rivers to reach the top.",
    stack: "Drop blocks perfectly to build the tallest tower.",
    simon: "Watch the pattern and repeat the sequence.",
    reaction: "Wait for green, then tap as fast as you can!",
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

  const base: GameConfig = {
    type: parsed.type,
    mode: parsed.mode,
    title: parsed.title,
    description: parsed.description,
    theme,
    settings: parsed.settings,
  };

  return ensurePlayerEmoji(base, prompt);
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
    "A flappy bird game with narrow pipes and fast gravity",
    "A space shooter where you blast asteroids with rapid fire",
    "A classic tetris game with falling blocks",
    "A memory card matching game with a 4x4 grid",
    "A whack-a-mole game with fast moles and 30 seconds",
    "A dodge game where you avoid falling meteor showers",
    "A 2048 slide puzzle with merge tiles",
    "A fruit catch game with a basket and bomb hazards",
    "A frogger game where you cross busy traffic lanes",
    "A stack tower game where you align falling blocks",
    "A simon says memory sequence game with colors",
    "A reaction time test — tap when the screen turns green",
  ];
}
