import type { GameDeps } from "@/components/game-canvas/types";

export function createFlappyGame(deps: GameDeps) {
  // ─── FLAPPY ───
  function initFlappy() {
    deps.state = {
      bird: { x: deps.canvas.width * 0.25, y: deps.canvas.height / 2, vy: 0, r: 14 },
      pipes: [] as { x: number; gapY: number; gapH: number; scored: boolean }[],
      pipeGap: (deps.settings.pipeGap as number) || 160,
      pipeW: 52,
      gravity: (deps.settings.gravity as number) || 0.5,
      pipeSpeed: (deps.settings.pipeSpeed as number) || 2.8,
      spawnTimer: 0,
      spawnInterval: 90,
    };
  }

  function updateFlappy() {
    const s = deps.state as {
      bird: { x: number; y: number; vy: number; r: number };
      pipes: { x: number; gapY: number; gapH: number; scored: boolean }[];
      pipeGap: number;
      pipeW: number;
      gravity: number;
      pipeSpeed: number;
      spawnTimer: number;
      spawnInterval: number;
    };
    const keys = deps.keys;
    if (keys.has(" ") || keys.has("arrowup") || keys.has("w") || deps.touch.actionTap) {
      s.bird.vy = -8;
      deps.keys.delete(" ");
      deps.keys.delete("arrowup");
      deps.keys.delete("w");
      deps.touch.actionTap = false;
    }

    s.bird.vy += s.gravity;
    s.bird.y += s.bird.vy;

    if (s.bird.y - s.bird.r < 0 || s.bird.y + s.bird.r > deps.canvas.height) {
      deps.endGame(deps.scoreRef.current);
      return;
    }

    s.spawnTimer++;
    if (s.spawnTimer >= s.spawnInterval) {
      s.spawnTimer = 0;
      const gapH = s.pipeGap;
      const gapY = 80 + Math.random() * (deps.canvas.height - gapH - 160);
      s.pipes.push({ x: deps.canvas.width, gapY, gapH, scored: false });
    }

    s.pipes.forEach((p) => (p.x -= s.pipeSpeed));
    s.pipes = s.pipes.filter((p) => p.x + s.pipeW > -20);

    const b = s.bird;
    for (const p of s.pipes) {
      if (!p.scored && p.x + s.pipeW < b.x) {
        p.scored = true;
        deps.scoreRef.current++;
        deps.onScoreChange?.(deps.scoreRef.current);
      }
      const hitPipe =
        b.x + b.r > p.x &&
        b.x - b.r < p.x + s.pipeW &&
        (b.y - b.r < p.gapY || b.y + b.r > p.gapY + p.gapH);
      if (hitPipe) {
        deps.endGame(deps.scoreRef.current);
        return;
      }
    }
  }

  function drawFlappy() {
    const s = deps.state as {
      bird: { x: number; y: number; r: number };
      pipes: { x: number; gapY: number; gapH: number }[];
      pipeW: number;
    };
    deps.ctx.fillStyle = deps.theme.background;
    deps.ctx.fillRect(0, 0, deps.canvas.width, deps.canvas.height);

    deps.ctx.fillStyle = deps.theme.secondary + "55";
    s.pipes.forEach((p) => {
      deps.ctx.fillRect(p.x, 0, s.pipeW, p.gapY);
      deps.ctx.fillRect(p.x, p.gapY + p.gapH, s.pipeW, deps.canvas.height - p.gapY - p.gapH);
    });

    deps.ctx.fillStyle = deps.theme.primary;
    deps.ctx.beginPath();
    deps.ctx.arc(s.bird.x, s.bird.y, s.bird.r, 0, Math.PI * 2);
    deps.ctx.fill();
    deps.ctx.fillStyle = "#fff";
    deps.ctx.beginPath();
    deps.ctx.arc(s.bird.x + 6, s.bird.y - 4, 4, 0, Math.PI * 2);
    deps.ctx.fill();

    deps.ctx.fillStyle = "#fff";
    deps.ctx.font = "bold 24px sans-serif";
    deps.ctx.textAlign = "center";
    deps.ctx.fillText(String(deps.scoreRef.current), deps.canvas.width / 2, 50);
    deps.ctx.font = "12px sans-serif";
    deps.ctx.fillStyle = "#ffffff88";
    deps.ctx.fillText("Tap/Space to flap", deps.canvas.width / 2, deps.canvas.height - 16);
  }

  return {
    init: initFlappy,
    update: updateFlappy,
    draw: drawFlappy,
  };
}
