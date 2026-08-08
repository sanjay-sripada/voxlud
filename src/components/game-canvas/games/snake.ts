import type { GameDeps } from "@/components/game-canvas/types";

export function createSnakeGame(deps: GameDeps) {
  // ─── SNAKE ───
  function initSnake() {
    const gridSize = (deps.settings.gridSize as number) || 16;
    const cellSize = Math.min(deps.canvas.width, deps.canvas.height) / gridSize;
    deps.state = {
      gridSize,
      cellSize,
      snake: [{ x: 5, y: 5 }],
      dir: { x: 1, y: 0 },
      food: { x: 10, y: 10, color: deps.theme.accent },
      colors: [deps.theme.primary, deps.theme.secondary, deps.theme.accent, "#fbbf24"],
      moveTimer: 0,
      moveInterval: (deps.settings.speed as number) || 150,
      colorMatch: deps.settings.colorMatch as boolean,
    };
  }

  function updateSnake() {
    const s = deps.state as {
      snake: { x: number; y: number }[];
      dir: { x: number; y: number };
      food: { x: number; y: number; color: string };
      gridSize: number;
      colors: string[];
      moveTimer: number;
      moveInterval: number;
    };
    const keys = deps.keys;
    if (keys.has("arrowup") || keys.has("w")) s.dir = { x: 0, y: -1 };
    if (keys.has("arrowdown") || keys.has("s")) s.dir = { x: 0, y: 1 };
    if (keys.has("arrowleft") || keys.has("a")) s.dir = { x: -1, y: 0 };
    if (keys.has("arrowright") || keys.has("d")) s.dir = { x: 1, y: 0 };

    if (deps.touch.pendingDir) {
      const next = deps.touch.pendingDir;
      const reversing =
        (next.x !== 0 && next.x === -s.dir.x) || (next.y !== 0 && next.y === -s.dir.y);
      if (!reversing) s.dir = next;
      deps.touch.pendingDir = null;
    }

    s.moveTimer += 16;
    if (s.moveTimer < s.moveInterval) return;
    s.moveTimer = 0;

    const head = { x: s.snake[0].x + s.dir.x, y: s.snake[0].y + s.dir.y };
    if (head.x < 0 || head.x >= s.gridSize || head.y < 0 || head.y >= s.gridSize) {
      deps.endGame(deps.scoreRef.current);
      return;
    }
    if (s.snake.some((seg) => seg.x === head.x && seg.y === head.y)) {
      deps.endGame(deps.scoreRef.current);
      return;
    }

    s.snake.unshift(head);
    if (head.x === s.food.x && head.y === s.food.y) {
      deps.scoreRef.current += 10;
      deps.onScoreChange?.(deps.scoreRef.current);
      s.food = {
        x: Math.floor(Math.random() * s.gridSize),
        y: Math.floor(Math.random() * s.gridSize),
        color: s.colors[Math.floor(Math.random() * s.colors.length)],
      };
    } else {
      s.snake.pop();
    }
  }

  function drawSnake() {
    const s = deps.state as {
      snake: { x: number; y: number }[];
      food: { x: number; y: number; color: string };
      cellSize: number;
      gridSize: number;
      colors: string[];
    };
    const offsetX = (deps.canvas.width - s.gridSize * s.cellSize) / 2;
    const offsetY = (deps.canvas.height - s.gridSize * s.cellSize) / 2;

    deps.ctx.fillStyle = deps.theme.background;
    deps.ctx.fillRect(0, 0, deps.canvas.width, deps.canvas.height);

    s.snake.forEach((seg, i) => {
      deps.ctx.fillStyle = i === 0 ? deps.theme.primary : deps.theme.secondary;
      deps.ctx.fillRect(offsetX + seg.x * s.cellSize + 1, offsetY + seg.y * s.cellSize + 1, s.cellSize - 2, s.cellSize - 2);
    });

    deps.ctx.fillStyle = s.food.color;
    deps.ctx.beginPath();
    deps.ctx.arc(
      offsetX + s.food.x * s.cellSize + s.cellSize / 2,
      offsetY + s.food.y * s.cellSize + s.cellSize / 2,
      s.cellSize / 2 - 2,
      0,
      Math.PI * 2
    );
    deps.ctx.fill();

    deps.ctx.fillStyle = "#fff";
    deps.ctx.font = "16px sans-serif";
    deps.ctx.textAlign = "left";
    deps.ctx.fillText(`Score: ${deps.scoreRef.current}`, 16, 30);
  }

  return {
    init: initSnake,
    update: updateSnake,
    draw: drawSnake,
  };
}
