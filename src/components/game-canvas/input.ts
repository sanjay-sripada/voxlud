import type { GameDeps, GameModule } from "@/components/game-canvas/types";

interface InputHandlerOptions {
  deps: GameDeps;
  game: GameModule;
  getGameOver: () => boolean;
}

export function createInputHandlers({ deps, game, getGameOver }: InputHandlerOptions) {
  let swipeStart: { x: number; y: number } | null = null;

  function canvasCoords(clientX: number, clientY: number) {
    const rect = deps.canvas.getBoundingClientRect();
    const scaleX = deps.canvas.width / rect.width;
    const scaleY = deps.canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }

  function handlePointerInput(clientX: number, clientY: number) {
    if (getGameOver()) return;
    const { x: mx, y: my } = canvasCoords(clientX, clientY);

    if (deps.config.type === "memory") {
      game.handleMemoryTap?.(mx, my);
      return;
    }

    if (deps.config.type === "whack") {
      game.handleWhackTap?.(mx, my);
      return;
    }

    if (deps.config.type === "simon") {
      game.handleSimonTap?.(mx, my);
      return;
    }

    if (deps.config.type === "reaction") {
      game.handleReactionTap?.();
      return;
    }

    if (deps.config.type !== "clicker") return;

    const s = deps.state as {
      coins: number;
      perClick: number;
      perSecond: number;
      upgrades: { name: string; cost: number; level: number; effect: string }[];
      clickAnim: number;
    };

    const cx = deps.canvas.width / 2;
    const cy = deps.canvas.height / 2 - 40;
    if (Math.hypot(mx - cx, my - cy) < 60) {
      s.coins += s.perClick;
      s.clickAnim = 1;
      deps.scoreRef.current = Math.floor(s.coins);
      deps.onScoreChange?.(deps.scoreRef.current);
    }

    s.upgrades.forEach((u, i) => {
      const y = deps.canvas.height - 120 + i * 36;
      if (mx > 20 && mx < deps.canvas.width - 20 && my > y && my < y + 30 && s.coins >= u.cost) {
        s.coins -= u.cost;
        u.level++;
        u.cost = Math.floor(u.cost * 1.5);
        if (u.effect === "click") s.perClick += u.level;
        else s.perSecond += u.level * 0.5;
      }
    });
  }

  function handleClickerInput(e: MouseEvent) {
    handlePointerInput(e.clientX, e.clientY);
  }

  function onTouchStart(e: TouchEvent) {
    const touch = e.touches[0];
    if (!touch || getGameOver()) return;

    const { x, y } = canvasCoords(touch.clientX, touch.clientY);

    if (deps.config.type === "clicker") {
      handlePointerInput(touch.clientX, touch.clientY);
      e.preventDefault();
      return;
    }

    if (
      deps.config.type === "memory" ||
      deps.config.type === "whack" ||
      deps.config.type === "simon" ||
      deps.config.type === "reaction"
    ) {
      handlePointerInput(touch.clientX, touch.clientY);
      e.preventDefault();
      return;
    }

    if (deps.config.type === "stack") {
      deps.touch.actionTap = true;
      e.preventDefault();
      return;
    }

    if (
      deps.config.type === "snake" ||
      deps.config.type === "runner" ||
      deps.config.type === "tetris" ||
      deps.config.type === "slide" ||
      deps.config.type === "cross"
    ) {
      swipeStart = { x, y };
      e.preventDefault();
      return;
    }

    if (deps.config.type === "flappy") {
      deps.touch.actionTap = true;
      e.preventDefault();
      return;
    }

    if (deps.config.type === "shooter" || deps.config.type === "dodge" || deps.config.type === "catch") {
      deps.touch.pointerX = x;
      deps.touch.actionTap = true;
      e.preventDefault();
      return;
    }

    if (deps.config.type === "pong") {
      deps.touch.pointerY = y;
      e.preventDefault();
      return;
    }

    if (deps.config.type === "breakout") {
      deps.touch.pointerX = x;
      e.preventDefault();
    }
  }

  function onTouchMove(e: TouchEvent) {
    const touch = e.touches[0];
    if (!touch || getGameOver()) return;

    const { x, y } = canvasCoords(touch.clientX, touch.clientY);

    if (deps.config.type === "pong") {
      deps.touch.pointerY = y;
      e.preventDefault();
    } else if (
      deps.config.type === "breakout" ||
      deps.config.type === "shooter" ||
      deps.config.type === "dodge" ||
      deps.config.type === "catch"
    ) {
      deps.touch.pointerX = x;
      e.preventDefault();
    } else if (
      deps.config.type === "snake" ||
      deps.config.type === "runner" ||
      deps.config.type === "tetris" ||
      deps.config.type === "slide" ||
      deps.config.type === "cross"
    ) {
      e.preventDefault();
    }
  }

  function onTouchEnd(e: TouchEvent) {
    const touch = e.changedTouches[0];
    if (!touch) return;

    if (deps.config.type === "runner" && !getGameOver()) {
      deps.touch.actionTap = true;
    }

    if (deps.config.type === "flappy" && !getGameOver()) {
      deps.touch.actionTap = true;
    }

    if (
      (deps.config.type === "snake" ||
        deps.config.type === "tetris" ||
        deps.config.type === "slide" ||
        deps.config.type === "cross") &&
      swipeStart &&
      !getGameOver()
    ) {
      const { x, y } = canvasCoords(touch.clientX, touch.clientY);
      const dx = x - swipeStart.x;
      const dy = y - swipeStart.y;
      const minSwipe = 20;
      if (Math.abs(dx) >= minSwipe || Math.abs(dy) >= minSwipe) {
        if (Math.abs(dx) > Math.abs(dy)) {
          deps.touch.pendingDir = { x: dx > 0 ? 1 : -1, y: 0 };
        } else {
          deps.touch.pendingDir = { x: 0, y: dy > 0 ? 1 : -1 };
        }
      }
    }

    swipeStart = null;
    if (deps.config.type === "pong") deps.touch.pointerY = null;
    if (
      deps.config.type === "breakout" ||
      deps.config.type === "shooter" ||
      deps.config.type === "dodge" ||
      deps.config.type === "catch"
    ) {
      deps.touch.pointerX = null;
    }
  }

  return {
    handleClickerInput,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  };
}
