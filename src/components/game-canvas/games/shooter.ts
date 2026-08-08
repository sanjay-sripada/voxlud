import type { GameDeps } from "@/components/game-canvas/types";

export function createShooterGame(deps: GameDeps) {
  // ─── SHOOTER ───
  function initShooter() {
    deps.state = {
      player: { x: deps.canvas.width / 2, w: 36, h: 16 },
      bullets: [] as { x: number; y: number; vy: number }[],
      enemies: [] as { x: number; y: number; r: number; vy: number }[],
      enemySpeed: (deps.settings.enemySpeed as number) || 1.8,
      shootCooldown: 0,
      rapidFire: deps.settings.rapidFire as boolean,
      spawnTimer: 0,
      spawnInterval: 50,
    };
  }

  function updateShooter() {
    const s = deps.state as {
      player: { x: number; w: number; h: number };
      bullets: { x: number; y: number; vy: number }[];
      enemies: { x: number; y: number; r: number; vy: number }[];
      enemySpeed: number;
      shootCooldown: number;
      rapidFire: boolean;
      spawnTimer: number;
      spawnInterval: number;
    };
    const keys = deps.keys;
    if (keys.has("arrowleft") || keys.has("a")) s.player.x = Math.max(s.player.w / 2, s.player.x - 6);
    if (keys.has("arrowright") || keys.has("d")) s.player.x = Math.min(deps.canvas.width - s.player.w / 2, s.player.x + 6);
    if (deps.touch.pointerX !== null) {
      s.player.x = Math.max(
        s.player.w / 2,
        Math.min(deps.canvas.width - s.player.w / 2, deps.touch.pointerX)
      );
    }

    const fireRate = s.rapidFire ? 8 : 20;
    if ((keys.has(" ") || keys.has("arrowup") || deps.touch.actionTap) && s.shootCooldown <= 0) {
      s.bullets.push({ x: s.player.x, y: deps.canvas.height - 50, vy: -10 });
      s.shootCooldown = fireRate;
      deps.touch.actionTap = false;
      deps.keys.delete(" ");
    }
    if (s.shootCooldown > 0) s.shootCooldown--;

    s.bullets.forEach((b) => (b.y += b.vy));
    s.bullets = s.bullets.filter((b) => b.y > -10);

    s.spawnTimer++;
    if (s.spawnTimer >= s.spawnInterval) {
      s.spawnTimer = 0;
      const r = 14 + Math.random() * 16;
      s.enemies.push({
        x: 30 + Math.random() * (deps.canvas.width - 60),
        y: -r,
        r,
        vy: s.enemySpeed + Math.random() * 0.8,
      });
    }

    s.enemies.forEach((e) => (e.y += e.vy));

    for (let bi = s.bullets.length - 1; bi >= 0; bi--) {
      const b = s.bullets[bi];
      for (let ei = s.enemies.length - 1; ei >= 0; ei--) {
        const e = s.enemies[ei];
        if (Math.hypot(b.x - e.x, b.y - e.y) < e.r + 4) {
          s.bullets.splice(bi, 1);
          s.enemies.splice(ei, 1);
          deps.scoreRef.current += 10;
          deps.onScoreChange?.(deps.scoreRef.current);
          break;
        }
      }
    }

    const p = s.player;
    const py = deps.canvas.height - 40;
    for (const e of s.enemies) {
      if (e.y + e.r < 0) continue;
      if (Math.hypot(e.x - p.x, e.y - py) < e.r + p.w / 2) {
        deps.endGame(deps.scoreRef.current);
        return;
      }
    }
    s.enemies = s.enemies.filter((e) => e.y < deps.canvas.height + 50);
  }

  function drawShooter() {
    const s = deps.state as {
      player: { x: number; w: number; h: number };
      bullets: { x: number; y: number }[];
      enemies: { x: number; y: number; r: number }[];
    };
    deps.ctx.fillStyle = deps.theme.background;
    deps.ctx.fillRect(0, 0, deps.canvas.width, deps.canvas.height);

    for (let i = 0; i < 30; i++) {
      deps.ctx.fillStyle = "#ffffff" + (i % 3 === 0 ? "33" : "11");
      deps.ctx.fillRect((i * 137) % deps.canvas.width, (i * 89 + Date.now() * 0.02) % deps.canvas.height, 2, 2);
    }

    deps.ctx.fillStyle = deps.theme.accent;
    s.enemies.forEach((e) => {
      deps.ctx.beginPath();
      deps.ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
      deps.ctx.fill();
    });

    deps.ctx.fillStyle = deps.theme.secondary;
    s.bullets.forEach((b) => {
      deps.ctx.fillRect(b.x - 2, b.y - 8, 4, 12);
    });

    const p = s.player;
    deps.ctx.fillStyle = deps.theme.primary;
    deps.ctx.beginPath();
    deps.ctx.moveTo(p.x, deps.canvas.height - 40 - p.h);
    deps.ctx.lineTo(p.x - p.w / 2, deps.canvas.height - 40);
    deps.ctx.lineTo(p.x + p.w / 2, deps.canvas.height - 40);
    deps.ctx.closePath();
    deps.ctx.fill();

    deps.ctx.fillStyle = "#fff";
    deps.ctx.font = "16px sans-serif";
    deps.ctx.textAlign = "left";
    deps.ctx.fillText(`Score: ${deps.scoreRef.current}`, 16, 30);
    deps.ctx.font = "12px sans-serif";
    deps.ctx.fillStyle = "#ffffff88";
    deps.ctx.fillText("←/→ move · Space shoot", 16, deps.canvas.height - 16);
  }

  return {
    init: initShooter,
    update: updateShooter,
    draw: drawShooter,
  };
}
