import type { GameConfig, GameType } from "@/types/game";

const KEYWORD_EMOJI: Array<{ pattern: RegExp; emoji: string }> = [
  { pattern: /car|racing|race|driv|vehicle|automobile|🏎|🚗|🚙/i, emoji: "🚗" },
  { pattern: /cat|kitten|kitty|meow|🐱|🐈/i, emoji: "🐱" },
  { pattern: /dog|puppy|woof|🐕|🐶/i, emoji: "🐶" },
  { pattern: /bird|flappy|chirp|🐦|🐤/i, emoji: "🐦" },
  { pattern: /snake|serpent|worm|🐍/i, emoji: "🐍" },
  { pattern: /frog|frogger|🐸/i, emoji: "🐸" },
  { pattern: /fish|aquarium|🐟|🐠/i, emoji: "🐟" },
  { pattern: /bear|🐻/i, emoji: "🐻" },
  { pattern: /robot|mech|🤖/i, emoji: "🤖" },
  { pattern: /alien|ufo|👽|🛸/i, emoji: "👽" },
  { pattern: /ninja|🥷/i, emoji: "🥷" },
  { pattern: /ghost|spooky|👻/i, emoji: "👻" },
  { pattern: /zombie|undead|🧟/i, emoji: "🧟" },
  { pattern: /dino|dinosaur|🦕|🦖/i, emoji: "🦖" },
  { pattern: /dragon|🐉/i, emoji: "🐉" },
  { pattern: /unicorn|🦄/i, emoji: "🦄" },
  { pattern: /penguin|🐧/i, emoji: "🐧" },
  { pattern: /monkey|ape|🐵|🙈/i, emoji: "🐵" },
  { pattern: /panda|🐼/i, emoji: "🐼" },
  { pattern: /fox|🦊/i, emoji: "🦊" },
  { pattern: /rabbit|bunny|🐰/i, emoji: "🐰" },
  { pattern: /pig|🐷/i, emoji: "🐷" },
  { pattern: /cow|🐮/i, emoji: "🐮" },
  { pattern: /chicken|🐔/i, emoji: "🐔" },
  { pattern: /space|rocket|astronaut|galaxy|cosmic|🚀|🌌/i, emoji: "🚀" },
  { pattern: /pirate|🏴‍☠️|☠️/i, emoji: "🏴‍☠️" },
  { pattern: /wizard|magic|mage|🧙/i, emoji: "🧙" },
  { pattern: /princess|crown|royal|👑/i, emoji: "👑" },
  { pattern: /knight|sword|⚔️|🛡️/i, emoji: "⚔️" },
  { pattern: /pizza|🍕/i, emoji: "🍕" },
  { pattern: /burger|🍔/i, emoji: "🍔" },
  { pattern: /coffee|cafe|latte|☕/i, emoji: "☕" },
  { pattern: /fruit|apple|🍎/i, emoji: "🍎" },
  { pattern: /banana|🍌/i, emoji: "🍌" },
  { pattern: /soccer|football|⚽/i, emoji: "⚽" },
  { pattern: /basketball|🏀/i, emoji: "🏀" },
  { pattern: /tennis|🏓|🎾/i, emoji: "🎾" },
  { pattern: /plane|airplane|✈️/i, emoji: "✈️" },
  { pattern: /boat|ship|⛵|🚢/i, emoji: "⛵" },
  { pattern: /fire|flame|🔥/i, emoji: "🔥" },
  { pattern: /heart|love|❤️|💕/i, emoji: "❤️" },
  { pattern: /star|⭐|🌟/i, emoji: "⭐" },
  { pattern: /moon|lunar|🌙/i, emoji: "🌙" },
  { pattern: /sun|solar|☀️/i, emoji: "☀️" },
  { pattern: /skull|💀/i, emoji: "💀" },
  { pattern: /mushroom|🍄/i, emoji: "🍄" },
  { pattern: /bomb|💣/i, emoji: "💣" },
  { pattern: /runner|run|jump|parkour|🏃/i, emoji: "🏃" },
];

const DEFAULT_EMOJI_BY_TYPE: Record<GameType, string> = {
  pong: "🏓",
  snake: "🐍",
  breakout: "🧱",
  runner: "🏃",
  clicker: "✨",
  flappy: "🐦",
  shooter: "🚀",
  tetris: "🟦",
  memory: "🃏",
  whack: "🔨",
  dodge: "💫",
  slide: "🔢",
  catch: "🍎",
  cross: "🐸",
  stack: "📦",
  simon: "🎨",
  reaction: "⚡",
  minesweeper: "💣",
  target: "🎯",
  bubble: "🫧",
  pinball: "🎱",
};

const EMOJI_IN_TEXT = /\p{Extended_Pictographic}/u;

export function extractEmojiFromText(text: string): string | undefined {
  const match = text.match(EMOJI_IN_TEXT);
  return match?.[0];
}

export function inferPlayerEmoji(text: string, gameType: GameType): string {
  const explicit = extractEmojiFromText(text);
  if (explicit) return explicit;

  for (const { pattern, emoji } of KEYWORD_EMOJI) {
    if (pattern.test(text)) return emoji;
  }

  return DEFAULT_EMOJI_BY_TYPE[gameType] ?? "🎮";
}

export function ensurePlayerEmoji(config: GameConfig, conversationText: string): GameConfig {
  if (config.emoji?.trim()) {
    return {
      ...config,
      settings: { ...config.settings, playerEmoji: config.emoji.trim() },
    };
  }

  const fromSettings = config.settings.playerEmoji;
  if (typeof fromSettings === "string" && fromSettings.trim()) {
    return { ...config, emoji: fromSettings.trim() };
  }

  const emoji = inferPlayerEmoji(conversationText, config.type);
  return {
    ...config,
    emoji,
    settings: { ...config.settings, playerEmoji: emoji },
  };
}
