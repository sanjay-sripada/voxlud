"use client";

import { useEffect, useRef, useCallback, type MutableRefObject } from "react";
import type { GameConfig } from "@/types/game";
import type { OnlineGameSessionRef } from "@/types/online-game";
import { createGameModule } from "@/components/game-canvas/registry";
import { createInputHandlers } from "@/components/game-canvas/input";
import type { GameDeps, TouchState } from "@/components/game-canvas/types";

interface GameCanvasProps {
  config: GameConfig;
  active?: boolean;
  onScoreChange?: (score: number) => void;
  onGameOver?: (score: number) => void;
  onlineSessionRef?: MutableRefObject<OnlineGameSessionRef>;
}

export default function GameCanvas({
  config,
  active = true,
  onScoreChange,
  onGameOver,
  onlineSessionRef,
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<Record<string, unknown>>({});
  const animRef = useRef<number>(0);
  const keysRef = useRef<Set<string>>(new Set());
  const touchRef = useRef<TouchState>({
    pointerY: null,
    pointerX: null,
    pendingDir: null,
    actionTap: false,
  });

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    keysRef.current.add(e.key.toLowerCase());
  }, []);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    keysRef.current.delete(e.key.toLowerCase());
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  useEffect(() => {
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;

    const ctxRaw = canvasEl.getContext("2d");
    if (!ctxRaw) return;

    const canvas = canvasEl;
    const ctx = ctxRaw;

    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (rect) {
        canvas.width = rect.width;
        canvas.height = rect.height;
      }
    };
    resize();
    window.addEventListener("resize", resize);

    const { theme, settings, mode } = config;
    const playerEmoji =
      (config.emoji || (settings.playerEmoji as string | undefined))?.trim() || "";
    const isOnline = mode === "online";
    const isMulti = mode === "local-multiplayer" || isOnline;

    const scoreRef = { current: 0 };
    let gameOver = false;
    let syncFrame = 0;
    let lastGuestPaddleSent = 0;

    const drawPlayerEmoji = (x: number, y: number, size = 28) => {
      if (!playerEmoji) return false;
      ctx.font = `${size}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(playerEmoji, x, y);
      return true;
    };

    const deps: GameDeps = {
      canvas,
      ctx,
      config,
      theme,
      settings,
      get state() {
        return stateRef.current;
      },
      set state(value) {
        stateRef.current = value;
      },
      keys: keysRef.current,
      touch: touchRef.current,
      scoreRef,
      isMulti,
      isOnline,
      syncFrame,
      lastGuestPaddleSent,
      onlineSessionRef,
      onScoreChange,
      onGameOver,
      endGame(finalScore: number) {
        gameOver = true;
        const online = onlineSessionRef?.current;
        if (isOnline && online?.role === "host") {
          online.sendGameOver?.(finalScore);
        }
        onGameOver?.(finalScore);
      },
      drawPlayerEmoji,
    };

    const game = createGameModule(config.type, deps);
    const input = createInputHandlers({
      deps,
      game,
      getGameOver: () => gameOver,
    });

    game.init();

    canvas.addEventListener("click", input.handleClickerInput);
    canvas.addEventListener("touchstart", input.onTouchStart, { passive: false });
    canvas.addEventListener("touchmove", input.onTouchMove, { passive: false });
    canvas.addEventListener("touchend", input.onTouchEnd);

    const loop = () => {
      deps.syncFrame = syncFrame;
      deps.lastGuestPaddleSent = lastGuestPaddleSent;

      if (!active) {
        game.draw();
        animRef.current = requestAnimationFrame(loop);
        return;
      }

      if (gameOver) {
        animRef.current = requestAnimationFrame(loop);
        return;
      }

      game.handleClickerKeys?.();
      game.update();
      game.draw();

      syncFrame = deps.syncFrame;
      lastGuestPaddleSent = deps.lastGuestPaddleSent;

      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("click", input.handleClickerInput);
      canvas.removeEventListener("touchstart", input.onTouchStart);
      canvas.removeEventListener("touchmove", input.onTouchMove);
      canvas.removeEventListener("touchend", input.onTouchEnd);
    };
  }, [config, active, onScoreChange, onGameOver, onlineSessionRef]);

  return (
    <canvas
      ref={canvasRef}
      className="h-full w-full cursor-pointer rounded-xl touch-none"
      style={{ touchAction: "none" }}
      tabIndex={0}
    />
  );
}
