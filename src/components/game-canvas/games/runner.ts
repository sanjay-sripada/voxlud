import type { GameDeps } from "@/components/game-canvas/types";

export function createRunnerGame(deps: GameDeps) {
  // ─── RUNNER ───
  function initRunner() {
    deps.state = {
      player: { y: deps.canvas.height / 2, vy: 0, r: 16, grounded: true },
      obstacles: [] as { x: number; y: number; w: number; h: number }[],
      gravityFlip: deps.settings.gravityFlip as boolean,
      gravity: 1,
      speed: 4 * ((deps.settings.obstacleSpeed as number) || 1.2),
      spawnTimer: 0,
      spawnInterval: 90,
    };
  }

  function updateRunner() {
    const s = deps.state as {
      player: { y: number; vy: number; r: number; grounded: boolean };
      obstacles: { x: number; y: number; w: number; h: number }[];
      gravityFlip: boolean;
      gravity: number;
      speed: number;
      spawnTimer: number;
      spawnInterval: number;
    };

    if (s.gravityFlip) {
      const keys = deps.keys;
      if (keys.has(" ") || keys.has("arrowup") || keys.has("w") || deps.touch.actionTap) {
        s.gravity *= -1;
        deps.keys.delete(" ");
        deps.keys.delete("arrowup");
        deps.keys.delete("w");
        deps.touch.actionTap = false;
      }
    } else {
      const keys = deps.keys;
      if (
        (keys.has(" ") || keys.has("arrowup") || keys.has("w") || deps.touch.actionTap) &&
        s.player.grounded
      ) {
        s.player.vy = -12;
        s.player.grounded = false;
        deps.touch.actionTap = false;
      }
    }

    s.player.vy += 0.6 * s.gravity;
    s.player.y += s.player.vy;

    const ground = deps.canvas.height - 60;
    const ceiling = 60;
    if (s.gravityFlip) {
      if (s.player.y + s.player.r > ground) {
        s.player.y = ground - s.player.r;
        s.player.vy = 0;
      }
      if (s.player.y - s.player.r < ceiling) {
        s.player.y = ceiling + s.player.r;
        s.player.vy = 0;
      }
    } else {
      if (s.player.y + s.player.r >= ground) {
        s.player.y = ground - s.player.r;
        s.player.vy = 0;
        s.player.grounded = true;
      }
    }

    s.spawnTimer++;
    if (s.spawnTimer >= s.spawnInterval) {
      s.spawnTimer = 0;
      const h = 30 + Math.random() * 50;
      s.obstacles.push({
        x: deps.canvas.width,
        y: s.gravityFlip ? (Math.random() > 0.5 ? ground - h : ceiling) : ground - h,
        w: 20,
        h,
      });
    }

    s.obstacles.forEach((o) => (o.x -= s.speed));
    s.obstacles = s.obstacles.filter((o) => o.x + o.w > 0);

    deps.scoreRef.current = Math.floor(deps.scoreRef.current + 0.1);
    deps.onScoreChange?.(deps.scoreRef.current);

    const p = s.player;
    const px = 80;
    for (const o of s.obstacles) {
      if (px + p.r > o.x && px - p.r < o.x + o.w && p.y + p.r > o.y && p.y - p.r < o.y + o.h) {
        deps.endGame(deps.scoreRef.current);
        return;
      }
    }
  }

  function drawRunner() {
    const s = deps.state as {
      player: { y: number; r: number };
      obstacles: { x: number; y: number; w: number; h: number }[];
      gravityFlip: boolean;
    };
    deps.ctx.fillStyle = deps.theme.background;
    deps.ctx.fillRect(0, 0, deps.canvas.width, deps.canvas.height);

    const ground = deps.canvas.height - 60;
    deps.ctx.fillStyle = deps.theme.secondary + "33";
    deps.ctx.fillRect(0, ground, deps.canvas.width, 60);
    deps.ctx.fillRect(0, 0, deps.canvas.width, 60);

    deps.ctx.fillStyle = deps.theme.primary;
    if (!deps.drawPlayerEmoji(80, s.player.y, s.player.r * 1.6)) {
      deps.ctx.beginPath();
      deps.ctx.arc(80, s.player.y, s.player.r, 0, Math.PI * 2);
      deps.ctx.fill();
    }

    deps.ctx.fillStyle = deps.theme.accent;
    s.obstacles.forEach((o) => deps.ctx.fillRect(o.x, o.y, o.w, o.h));

    deps.ctx.fillStyle = "#fff";
    deps.ctx.font = "16px sans-serif";
    deps.ctx.textAlign = "left";
    deps.ctx.fillText(`Score: ${deps.scoreRef.current}`, 16, 30);
    deps.ctx.font = "12px sans-serif";
    deps.ctx.fillStyle = "#ffffff88";
    deps.ctx.fillText(
      s.gravityFlip ? "Tap/Space to flip gravity · survive to deps.scoreRef.current" : "Space/Up to jump · survive to deps.scoreRef.current",
      16,
      deps.canvas.height - 16
    );
  }

  return {
    init: initRunner,
    update: updateRunner,
    draw: drawRunner,
  };
}
