import { GAME_MODE_LABELS, GAME_TYPE_LABELS } from "@/lib/game-labels";
import type { GameConfig, GenerationSource } from "@/types/game";

const GAME_EXPLANATIONS: Record<
  string,
  { youPlay: string; goal: string; controls: string; scoring: string }
> = {
  pong: {
    youPlay: "A paddle on each side",
    goal: "Hit the ball past your opponent's paddle",
    controls: "W/S or arrow keys · touch on mobile",
    scoring: "1 point per goal · first to 5 wins",
  },
  snake: {
    youPlay: "A growing snake on a grid",
    goal: "Eat food and avoid walls or your own tail",
    controls: "Arrow keys or swipe",
    scoring: "+10 per food eaten",
  },
  breakout: {
    youPlay: "A paddle at the bottom",
    goal: "Break all the bricks with the ball",
    controls: "Left/right arrows or drag",
    scoring: "+10 per brick · clear all to win",
  },
  runner: {
    youPlay: "A character (or emoji) running on a track",
    goal: "Survive by jumping or flipping gravity to avoid obstacles",
    controls: "Space or tap to jump / flip",
    scoring: "Score ticks up the longer you survive — dodge obstacles to keep it climbing",
  },
  clicker: {
    youPlay: "A tap target on screen",
    goal: "Tap to earn points and buy upgrades",
    controls: "Click or tap",
    scoring: "Points per tap · upgrades multiply earnings",
  },
  flappy: {
    youPlay: "A bird flying through gaps",
    goal: "Pass between pipes without crashing",
    controls: "Tap or space to flap",
    scoring: "+1 per pipe passed",
  },
  shooter: {
    youPlay: "A spaceship at the bottom",
    goal: "Destroy enemies and survive",
    controls: "Move with arrows · space to shoot",
    scoring: "+10 per enemy destroyed",
  },
  tetris: {
    youPlay: "Falling block pieces",
    goal: "Complete rows to clear lines and score",
    controls: "Arrow keys to move and rotate",
    scoring: "More points for multi-line clears",
  },
  memory: {
    youPlay: "A grid of face-down cards",
    goal: "Find all matching pairs",
    controls: "Tap cards to flip",
    scoring: "+20 per matched pair",
  },
  whack: {
    youPlay: "A hammer over mole holes",
    goal: "Tap moles before they disappear",
    controls: "Tap the moles",
    scoring: "+10 per mole · golden moles worth more",
  },
  dodge: {
    youPlay: "A shape at the bottom of the screen",
    goal: "Move left/right to avoid falling hazards",
    controls: "Arrow keys or drag",
    scoring: "Score rises while you survive",
  },
  slide: {
    youPlay: "A 2048-style number grid",
    goal: "Merge tiles to reach the target number",
    controls: "Arrow keys or swipe",
    scoring: "Points when tiles merge · reach 2048/4096 to win",
  },
  catch: {
    youPlay: "A basket at the bottom",
    goal: "Catch falling items and avoid bombs",
    controls: "Move left/right",
    scoring: "+10 per fruit caught · bombs cost a life",
  },
  cross: {
    youPlay: "A character crossing busy traffic lanes",
    goal: "Reach the top row without getting hit by cars",
    controls: "Arrow keys or swipe to move one lane at a time",
    scoring: "+10 per lane forward · +100 when you reach the top (then you respawn at the bottom)",
  },
  stack: {
    youPlay: "A moving block you drop onto a tower",
    goal: "Stack blocks as high as possible",
    controls: "Tap or space to drop",
    scoring: "+10 per block · bonus for perfect alignment",
  },
  simon: {
    youPlay: "A color pattern sequence",
    goal: "Repeat the pattern correctly",
    controls: "Tap the colors in order",
    scoring: "Survive longer sequences for a higher score",
  },
  reaction: {
    youPlay: "A reflex test screen",
    goal: "Tap as soon as the screen turns green",
    controls: "Tap when green appears",
    scoring: "Faster reaction = lower ms · averaged over rounds",
  },
  minesweeper: {
    youPlay: "A grid of hidden tiles",
    goal: "Reveal all safe cells without hitting a mine",
    controls: "Tap to reveal · toggle flag mode to mark mines",
    scoring: "+5 per reveal · +500 bonus for clearing the board",
  },
  target: {
    youPlay: "A shooting gallery",
    goal: "Tap targets before they leave the screen",
    controls: "Tap targets as they move",
    scoring: "+10 per target · golden targets worth more",
  },
  bubble: {
    youPlay: "A grid of colored bubbles",
    goal: "Pop groups of 2+ matching bubbles to clear the board",
    controls: "Tap matching bubble groups",
    scoring: "Points scale with group size squared",
  },
  pinball: {
    youPlay: "Flippers and a bouncing ball",
    goal: "Keep the ball in play and hit bumpers for points",
    controls: "A/D or tap left/right side for flippers",
    scoring: "+25 per bumper hit · lose a life when the ball falls",
  },
};

export function getDisplayEmoji(config: GameConfig): string {
  if (config.emoji?.trim()) return config.emoji.trim();
  const fromSettings = config.settings.playerEmoji;
  if (typeof fromSettings === "string" && fromSettings.trim()) return fromSettings.trim();
  return "";
}

export function describeGameConfig(config: GameConfig): string {
  const typeLabel = GAME_TYPE_LABELS[config.type] ?? config.type;
  const modeLabel = GAME_MODE_LABELS[config.mode] ?? config.mode;
  const emoji = getDisplayEmoji(config);
  const info = GAME_EXPLANATIONS[config.type];

  const lines = [
    emoji ? `${emoji} ${config.title}` : config.title,
    `Template: ${typeLabel} · ${modeLabel}`,
    info ? `You control: ${info.youPlay}` : config.description,
    info ? `Goal: ${info.goal}` : "",
    info ? `Score: ${info.scoring}` : "",
    info ? `Controls: ${info.controls}` : "",
    emoji ? `Player icon: ${emoji}` : "",
    "",
    "This is one of 21 arcade templates (not a custom 3D game). Ask to change emoji, difficulty, theme, or style.",
  ];

  return lines.filter(Boolean).join("\n");
}

export function assistantReplyForConfig(
  config: GameConfig,
  meta?: {
    source?: GenerationSource;
    model?: string;
    provider?: string | null;
  }
): string {
  const typeLabel = GAME_TYPE_LABELS[config.type] ?? config.type;
  const modeLabel = GAME_MODE_LABELS[config.mode] ?? config.mode;
  const emoji = getDisplayEmoji(config);
  const info = GAME_EXPLANATIONS[config.type];

  const aiLabel =
    meta?.source === "llm"
      ? `AI designed this (${meta.provider ?? "llm"}${meta.model ? ` · ${meta.model}` : ""}).`
      : meta?.source === "fallback"
        ? "Built with the built-in keyword parser (no AI)."
        : "";

  const parts = [
    aiLabel,
    `Built a ${typeLabel} game (${modeLabel})${emoji ? ` with ${emoji}` : ""}.`,
    info ? `${info.goal}.` : config.description,
    info ? `Scoring: ${info.scoring}.` : "",
    `Preview shows "${config.title}".`,
    "Tell me what to change — emoji, difficulty, theme, or game style.",
  ];

  return parts.filter(Boolean).join(" ");
}
