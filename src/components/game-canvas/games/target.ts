import type { GameDeps } from "@/components/game-canvas/types";

interface Target {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  points: number;
  emoji: string;
}

export function createTargetGame(deps: GameDeps) {
  const TARGET_EMOJIS = ["🎯", "⭐", "🎪", "🔴", "🟡"];

  function spawnTarget(speed: number): Target {
    const side = Math.floor(Math.random() * 4);
    const r = 18 + Math.random() * 14;
    let x = 0;
    let y = 0;
    let vx = 0;
    let vy = 0;
    const w = deps.canvas.width;
    const h = deps.canvas.height;

    if (side === 0) {
      x = -r;
      y = 60 + Math.random() * (h - 120);
      vx = speed;
    } else if (side === 1) {
      x = w + r;
      y = 60 + Math.random() * (h - 120);
      vx = -speed;
    } else if (side === 2) {
      x = 40 + Math.random() * (w - 80);
      y = -r;
      vy = speed;
    } else {
      x = 40 + Math.random() * (w - 80);
      y = h + r;
      vy = -speed;
    }

    const golden = Math.random() < 0.15;
    return {
      x,
      y,
      r,
      vx,
      vy,
      points: golden ? 50 : 10,
      emoji: golden ? "⭐" : TARGET_EMOJIS[Math.floor(Math.random() * TARGET_EMOJIS.length)],
    };
  }

  function initTarget() {
    const duration = ((deps.settings.duration as number) || 30) * 1000;
    const speed = (deps.settings.targetSpeed as number) || 1.8;
    deps.state = {
      targets: [] as Target[],
      spawnTimer: 0,
      spawnInterval: 900 / speed,
      speed,
      duration,
      timeLeft: duration,
      misses: 0,
      maxMisses: (deps.settings.maxMisses as number) || 5,
    };
  }

  function updateTarget() {
    const s = deps.state as {
      targets: Target[];
      spawnTimer: number;
      spawnInterval: number;
      speed: number;
      timeLeft: number;
      misses: number;
      maxMisses: number;
    };

    s.timeLeft -= 16;
    if (s.timeLeft <= 0) {
      deps.endGame(deps.scoreRef.current);
      return;
    }

    s.spawnTimer += 16;
    if (s.spawnTimer >= s.spawnInterval) {
      s.spawnTimer = 0;
      s.targets.push(spawnTarget(s.speed * (1.5 + Math.random())));
    }

    const w = deps.canvas.width;
    const h = deps.canvas.height;
    const remaining: Target[] = [];
    for (const t of s.targets) {
      t.x += t.vx;
      t.y += t.vy;
      const offScreen =
        t.x < -t.r - 20 ||
        t.x > w + t.r + 20 ||
        t.y < -t.r - 20 ||
        t.y > h + t.r + 20;
      if (offScreen) {
        s.misses++;
        if (s.misses >= s.maxMisses) {
          deps.endGame(deps.scoreRef.current);
          return;
        }
      } else {
        remaining.push(t);
      }
    }
    s.targets = remaining;
  }

  function handleTargetTap(mx: number, my: number) {
    const s = deps.state as { targets: Target[] };
    for (let i = s.targets.length - 1; i >= 0; i--) {
      const t = s.targets[i];
      if (Math.hypot(mx - t.x, my - t.y) <= t.r) {
        deps.scoreRef.current += t.points;
        deps.onScoreChange?.(deps.scoreRef.current);
        s.targets.splice(i, 1);
        return;
      }
    }
  }

  function drawTarget() {
    const s = deps.state as {
      targets: Target[];
      timeLeft: number;
      misses: number;
      maxMisses: number;
    };

    deps.ctx.fillStyle = deps.theme.background;
    deps.ctx.fillRect(0, 0, deps.canvas.width, deps.canvas.height);

    for (const t of s.targets) {
      deps.ctx.beginPath();
      deps.ctx.arc(t.x, t.y, t.r, 0, Math.PI * 2);
      deps.ctx.fillStyle = deps.theme.secondary + "44";
      deps.ctx.fill();
      deps.ctx.strokeStyle = deps.theme.accent;
      deps.ctx.lineWidth = 2;
      deps.ctx.stroke();

      deps.ctx.font = `${t.r * 1.1}px sans-serif`;
      deps.ctx.textAlign = "center";
      deps.ctx.textBaseline = "middle";
      deps.ctx.fillText(t.emoji, t.x, t.y);
    }

    deps.ctx.fillStyle = "#fff";
    deps.ctx.font = "16px sans-serif";
    deps.ctx.textAlign = "left";
    deps.ctx.fillText(`Score: ${deps.scoreRef.current}`, 16, 28);
    deps.ctx.fillText(`Time: ${Math.ceil(s.timeLeft / 1000)}s`, 16, 50);
    deps.ctx.fillText(`Misses: ${s.misses}/${s.maxMisses}`, 16, 72);

    deps.ctx.font = "12px sans-serif";
    deps.ctx.fillStyle = "#ffffff88";
    deps.ctx.textAlign = "center";
    deps.ctx.fillText("Tap targets before they escape!", deps.canvas.width / 2, deps.canvas.height - 16);
  }

  return {
    init: initTarget,
    update: updateTarget,
    draw: drawTarget,
    handleTargetTap,
  };
}
