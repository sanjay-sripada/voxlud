import type { GameDeps } from "@/components/game-canvas/types";

export function createDodgeGame(deps: GameDeps) {
  // ─── DODGE ───
  function initDodge() {
    deps.state = {
      player: { x: deps.canvas.width / 2, w: 44, h: 20 },
      hazards: [] as { x: number; y: number; w: number; h: number; vy: number }[],
      fallSpeed: (deps.settings.fallSpeed as number) || 1.6,
      density: (deps.settings.density as number) || 1,
      spawnTimer: 0,
      spawnInterval: 45,
    };
  }

  function updateDodge() {
    const s = deps.state as {
      player: { x: number; w: number; h: number };
      hazards: { x: number; y: number; w: number; h: number; vy: number }[];
      fallSpeed: number;
      density: number;
      spawnTimer: number;
      spawnInterval: number;
    };
    const keys = deps.keys;
    if (keys.has("arrowleft") || keys.has("a")) s.player.x = Math.max(s.player.w / 2, s.player.x - 7);
    if (keys.has("arrowright") || keys.has("d")) s.player.x = Math.min(deps.canvas.width - s.player.w / 2, s.player.x + 7);
    if (deps.touch.pointerX !== null) {
      s.player.x = Math.max(
        s.player.w / 2,
        Math.min(deps.canvas.width - s.player.w / 2, deps.touch.pointerX)
      );
    }

    s.spawnTimer++;
    if (s.spawnTimer >= s.spawnInterval / s.density) {
      s.spawnTimer = 0;
      const w = 16 + Math.random() * 28;
      s.hazards.push({
        x: Math.random() * (deps.canvas.width - w),
        y: -30,
        w,
        h: w,
        vy: (2 + Math.random() * 2) * s.fallSpeed,
      });
    }

    s.hazards.forEach((h) => (h.y += h.vy));
    s.hazards = s.hazards.filter((h) => h.y < deps.canvas.height + 40);

    deps.scoreRef.current = Math.floor(deps.scoreRef.current + 0.15 * s.fallSpeed);
    deps.onScoreChange?.(deps.scoreRef.current);

    const py = deps.canvas.height - 40;
    const px = s.player.x;
    for (const h of s.hazards) {
      if (
        px + s.player.w / 2 > h.x &&
        px - s.player.w / 2 < h.x + h.w &&
        py < h.y + h.h &&
        py + s.player.h > h.y
      ) {
        deps.endGame(deps.scoreRef.current);
        return;
      }
    }
  }

  function drawDodge() {
    const s = deps.state as {
      player: { x: number; w: number; h: number };
      hazards: { x: number; y: number; w: number; h: number }[];
    };
    deps.ctx.fillStyle = deps.theme.background;
    deps.ctx.fillRect(0, 0, deps.canvas.width, deps.canvas.height);

    deps.ctx.fillStyle = deps.theme.accent;
    s.hazards.forEach((h) => {
      deps.ctx.beginPath();
      deps.ctx.arc(h.x + h.w / 2, h.y + h.h / 2, h.w / 2, 0, Math.PI * 2);
      deps.ctx.fill();
    });

    const py = deps.canvas.height - 40;
    if (!deps.drawPlayerEmoji(s.player.x, py + s.player.h / 2, 28)) {
      deps.ctx.fillStyle = deps.theme.primary;
      deps.ctx.fillRect(s.player.x - s.player.w / 2, py, s.player.w, s.player.h);
    }

    deps.ctx.fillStyle = "#fff";
    deps.ctx.font = "16px sans-serif";
    deps.ctx.textAlign = "left";
    deps.ctx.fillText(`Score: ${deps.scoreRef.current}`, 16, 28);
    deps.ctx.font = "12px sans-serif";
    deps.ctx.fillStyle = "#ffffff88";
    deps.ctx.fillText("Dodge the falling hazards!", 16, deps.canvas.height - 16);
  }

  return {
    init: initDodge,
    update: updateDodge,
    draw: drawDodge,
  };
}
