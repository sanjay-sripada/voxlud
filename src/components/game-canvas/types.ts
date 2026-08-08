import type { MutableRefObject } from "react";
import type { GameConfig } from "@/types/game";
import type { OnlineGameSessionRef } from "@/types/online-game";

export interface TouchState {
  pointerY: number | null;
  pointerX: number | null;
  pendingDir: { x: number; y: number } | null;
  actionTap: boolean;
}

export interface GameDeps {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  config: GameConfig;
  theme: GameConfig["theme"];
  settings: Record<string, unknown>;
  state: Record<string, unknown>;
  keys: Set<string>;
  touch: TouchState;
  scoreRef: { current: number };
  isMulti: boolean;
  isOnline: boolean;
  syncFrame: number;
  lastGuestPaddleSent: number;
  onlineSessionRef?: MutableRefObject<OnlineGameSessionRef>;
  onScoreChange?: (score: number) => void;
  onGameOver?: (score: number) => void;
  endGame: (finalScore: number) => void;
  drawPlayerEmoji: (x: number, y: number, size?: number) => boolean;
}

export interface GameModule {
  init: () => void;
  update: () => void;
  draw: () => void;
  handleClickerKeys?: () => void;
  handleMemoryTap?: (mx: number, my: number) => void;
  handleWhackTap?: (mx: number, my: number) => void;
  handleSimonTap?: (mx: number, my: number) => void;
  handleReactionTap?: () => void;
  handlePointerInput?: (clientX: number, clientY: number) => void;
}
