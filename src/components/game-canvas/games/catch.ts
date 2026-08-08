import type { GameDeps } from "@/components/game-canvas/types";

export function createCatchGame(deps: GameDeps) {
  // ─── CATCH ───
  function initCatch() {
    deps.state = {
      basket: { x: deps.canvas.width / 2, w: 70, h: 16 },
      items: [] as { x: number; y: number; r: number; type: "fruit" | "bomb"; emoji: string }[],
      fallSpeed: (deps.settings.fallSpeed as number) || 1.4,
      lives: (deps.settings.lives as number) || 3,
      missed: 0,
      spawnTimer: 0,
      spawnInterval: 55,
      fruits: ["🍎", "🍊", "🍇", "🍌", "🍓"],
    };
  }

  function updateCatch() {
    const s = deps.state as {
      basket: { x: number; w: number; h: number };
      items: { x: number; y: number; r: number; type: "fruit" | "bomb"; emoji: string }[];
      fallSpeed: number;
      lives: number;
      missed: number;
      spawnTimer: number;
      spawnInterval: number;
      fruits: string[];
    };
    const keys = deps.keys;
    if (keys.has("arrowleft") || keys.has("a")) s.basket.x = Math.max(s.basket.w / 2, s.basket.x - 8);
    if (keys.has("arrowright") || keys.has("d")) s.basket.x = Math.min(deps.canvas.width - s.basket.w / 2, s.basket.x + 8);
    if (deps.touch.pointerX !== null) {
      s.basket.x = Math.max(
        s.basket.w / 2,
        Math.min(deps.canvas.width - s.basket.w / 2, deps.touch.pointerX)
      );
    }

    s.spawnTimer++;
    if (s.spawnTimer >= s.spawnInterval) {
      s.spawnTimer = 0;
      const bomb = Math.random() < 0.18;
      s.items.push({
        x: 20 + Math.random() * (deps.canvas.width - 40),
        y: -20,
        r: 16,
        type: bomb ? "bomb" : "fruit",
        emoji: bomb ? "💣" : s.fruits[Math.floor(Math.random() * s.fruits.length)],
      });
    }

    const by = deps.canvas.height - 36;
    s.items.forEach((item) => (item.y += 3 * s.fallSpeed));
    s.items = s.items.filter((item) => {
      if (item.y - item.r > deps.canvas.height) {
        if (item.type === "fruit") {
          s.missed++;
          if (s.missed >= 3) {
            s.lives--;
            s.missed = 0;
            if (s.lives <= 0) deps.endGame(deps.scoreRef.current);
          }
        }
        return false;
      }
      const caught =
        item.y + item.r > by &&
        item.x > s.basket.x - s.basket.w / 2 &&
        item.x < s.basket.x + s.basket.w / 2;
      if (caught) {
        if (item.type === "bomb") {
          s.lives--;
          if (s.lives <= 0) deps.endGame(deps.scoreRef.current);
        } else {
          deps.scoreRef.current += 10;
          deps.onScoreChange?.(deps.scoreRef.current);
        }
        return false;
      }
      return true;
    });
  }

  function drawCatch() {
    const s = deps.state as {
      basket: { x: number; w: number; h: number };
      items: { x: number; y: number; r: number; emoji: string }[];
      lives: number;
    };
    deps.ctx.fillStyle = deps.theme.background;
    deps.ctx.fillRect(0, 0, deps.canvas.width, deps.canvas.height);

    s.items.forEach((item) => {
      deps.ctx.font = `${item.r * 1.6}px sans-serif`;
      deps.ctx.textAlign = "center";
      deps.ctx.textBaseline = "middle";
      deps.ctx.fillText(item.emoji, item.x, item.y);
    });

    const by = deps.canvas.height - 36;
    deps.ctx.fillStyle = deps.theme.primary;
    deps.ctx.beginPath();
    deps.ctx.roundRect(s.basket.x - s.basket.w / 2, by, s.basket.w, s.basket.h, 6);
    deps.ctx.fill();

    deps.ctx.fillStyle = "#fff";
    deps.ctx.font = "16px sans-serif";
    deps.ctx.textAlign = "left";
    deps.ctx.fillText(`Score: ${deps.scoreRef.current}  Lives: ${s.lives}`, 16, 28);
    deps.ctx.font = "12px sans-serif";
    deps.ctx.fillStyle = "#ffffff88";
    deps.ctx.fillText("Catch fruit, avoid bombs!", 16, deps.canvas.height - 16);
  }

  return {
    init: initCatch,
    update: updateCatch,
    draw: drawCatch,
  };
}
