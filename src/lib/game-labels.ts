import type { GameMode, GameType } from "@/types/game";

export const TYPE_LABELS: Record<GameType, string> = {
  pong: "Pong",
  snake: "Snake",
  breakout: "Arcade",
  runner: "Runner",
  clicker: "Clicker",
  flappy: "Flappy",
  shooter: "Shooter",
  tetris: "Tetris",
  memory: "Memory",
  whack: "Whack",
  dodge: "Dodge",
  slide: "2048",
  catch: "Catch",
  cross: "Cross",
  stack: "Stack",
  simon: "Simon",
  reaction: "Reflex",
  minesweeper: "Mines",
  target: "Target",
  bubble: "Bubble",
  pinball: "Pinball",
};

export const MODE_LABELS: Record<GameMode, string> = {
  solo: "Solo",
  "local-multiplayer": "Local MP",
  online: "Online",
};

/** @deprecated Use TYPE_LABELS */
export const GAME_TYPE_LABELS = TYPE_LABELS;

/** @deprecated Use MODE_LABELS */
export const GAME_MODE_LABELS = MODE_LABELS;

export const GAME_TYPE_EMOJI: Record<GameType, string> = {
  pong: "🏓",
  snake: "🐍",
  breakout: "🧱",
  runner: "🏃",
  clicker: "☕",
  flappy: "🐦",
  shooter: "🚀",
  tetris: "🧩",
  memory: "🃏",
  whack: "🔨",
  dodge: "💨",
  slide: "🔢",
  catch: "🧺",
  cross: "🐸",
  stack: "🗼",
  simon: "🎨",
  reaction: "⚡",
  minesweeper: "💣",
  target: "🎯",
  bubble: "🫧",
  pinball: "🎱",
};
