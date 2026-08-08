import type { GameDeps } from "@/components/game-canvas/types";

export function createBreakoutGame(deps: GameDeps) {
  // ─── BREAKOUT ───
  function initBreakout() {
    const rows = (deps.settings.rows as number) || 5;
    const cols = 8;
    const brickW = deps.canvas.width / cols - 4;
    const bricks: { x: number; y: number; w: number; h: number; alive: boolean; color: string }[] = [];
    const colors = [deps.theme.primary, deps.theme.secondary, deps.theme.accent, "#fbbf24", "#34d399"];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        bricks.push({
          x: c * (brickW + 4) + 2,
          y: r * 28 + 40,
          w: brickW,
          h: 24,
          alive: true,
          color: colors[r % colors.length],
        });
      }
    }
    deps.state = {
      ball: { x: deps.canvas.width / 2, y: deps.canvas.height - 80, vx: 3, vy: -3, r: 6 },
      paddle: { x: deps.canvas.width / 2, w: 80, h: 12 },
      bricks,
      lives: (deps.settings.lives as number) || 3,
    };
  }

  function updateBreakout() {
    const s = deps.state as {
      ball: { x: number; y: number; vx: number; vy: number; r: number };
      paddle: { x: number; w: number; h: number };
      bricks: { x: number; y: number; w: number; h: number; alive: boolean }[];
      lives: number;
    };
    const keys = deps.keys;
    if (keys.has("arrowleft") || keys.has("a")) s.paddle.x = Math.max(s.paddle.w / 2, s.paddle.x - 7);
    if (keys.has("arrowright") || keys.has("d")) s.paddle.x = Math.min(deps.canvas.width - s.paddle.w / 2, s.paddle.x + 7);
    if (deps.touch.pointerX !== null) {
      s.paddle.x = Math.max(
        s.paddle.w / 2,
        Math.min(deps.canvas.width - s.paddle.w / 2, deps.touch.pointerX)
      );
    }

    s.ball.x += s.ball.vx;
    s.ball.y += s.ball.vy;

    if (s.ball.x - s.ball.r < 0 || s.ball.x + s.ball.r > deps.canvas.width) s.ball.vx *= -1;
    if (s.ball.y - s.ball.r < 0) s.ball.vy *= -1;

    const py = deps.canvas.height - 30;
    if (
      s.ball.y + s.ball.r > py &&
      s.ball.y - s.ball.r < py + s.paddle.h &&
      s.ball.x > s.paddle.x - s.paddle.w / 2 &&
      s.ball.x < s.paddle.x + s.paddle.w / 2
    ) {
      s.ball.vy = -Math.abs(s.ball.vy);
      s.ball.vx += (s.ball.x - s.paddle.x) * 0.05;
    }

    if (s.ball.y > deps.canvas.height) {
      s.lives--;
      if (s.lives <= 0) {
        deps.endGame(deps.scoreRef.current);
        return;
      }
      s.ball = { x: deps.canvas.width / 2, y: deps.canvas.height - 80, vx: 3, vy: -3, r: 6 };
    }

    s.bricks.forEach((b) => {
      if (!b.alive) return;
      if (
        s.ball.x + s.ball.r > b.x &&
        s.ball.x - s.ball.r < b.x + b.w &&
        s.ball.y + s.ball.r > b.y &&
        s.ball.y - s.ball.r < b.y + b.h
      ) {
        b.alive = false;
        s.ball.vy *= -1;
        deps.scoreRef.current += 10;
        deps.onScoreChange?.(deps.scoreRef.current);
      }
    });

    if (s.bricks.every((b) => !b.alive)) deps.endGame(deps.scoreRef.current);
  }

  function drawBreakout() {
    const s = deps.state as {
      ball: { x: number; y: number; r: number };
      paddle: { x: number; w: number; h: number };
      bricks: { x: number; y: number; w: number; h: number; alive: boolean; color: string }[];
      lives: number;
    };
    deps.ctx.fillStyle = deps.theme.background;
    deps.ctx.fillRect(0, 0, deps.canvas.width, deps.canvas.height);

    s.bricks.forEach((b) => {
      if (!b.alive) return;
      deps.ctx.fillStyle = b.color;
      deps.ctx.beginPath();
      deps.ctx.roundRect(b.x, b.y, b.w, b.h, 4);
      deps.ctx.fill();
    });

    deps.ctx.fillStyle = deps.theme.primary;
    deps.ctx.fillRect(s.paddle.x - s.paddle.w / 2, deps.canvas.height - 30, s.paddle.w, s.paddle.h);

    deps.ctx.beginPath();
    deps.ctx.arc(s.ball.x, s.ball.y, s.ball.r, 0, Math.PI * 2);
    deps.ctx.fillStyle = deps.theme.accent;
    deps.ctx.fill();

    deps.ctx.fillStyle = "#fff";
    deps.ctx.font = "16px sans-serif";
    deps.ctx.textAlign = "left";
    deps.ctx.fillText(`Score: ${deps.scoreRef.current}  Lives: ${s.lives}`, 16, 24);
  }

  return {
    init: initBreakout,
    update: updateBreakout,
    draw: drawBreakout,
  };
}
