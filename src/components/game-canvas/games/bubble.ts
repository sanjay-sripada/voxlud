import type { GameDeps } from "@/components/game-canvas/types";

const BUBBLE_COLORS = ["#f43f5e", "#3b82f6", "#22c55e", "#eab308", "#a855f7", "#06b6d4"];

export function createBubbleGame(deps: GameDeps) {
  function buildGrid(cols: number, rows: number, colorCount: number): number[][] {
    const grid: number[][] = [];
    for (let r = 0; r < rows; r++) {
      const row: number[] = [];
      for (let c = 0; c < cols; c++) {
        row.push(Math.floor(Math.random() * colorCount));
      }
      grid.push(row);
    }
    return grid;
  }

  function getGroup(grid: number[][], col: number, row: number): [number, number][] {
    const color = grid[row]?.[col];
    if (color === undefined || color < 0) return [];
    const visited = new Set<string>();
    const group: [number, number][] = [];
    const stack: [number, number][] = [[col, row]];

    while (stack.length > 0) {
      const [c, r] = stack.pop()!;
      const key = `${c},${r}`;
      if (visited.has(key)) continue;
      if (r < 0 || r >= grid.length || c < 0 || c >= grid[0].length) continue;
      if (grid[r][c] !== color) continue;
      visited.add(key);
      group.push([c, r]);
      stack.push([c + 1, r], [c - 1, r], [c, r + 1], [c, r - 1]);
    }
    return group;
  }

  function applyGravity(grid: number[][]) {
    const cols = grid[0].length;
    const rows = grid.length;
    for (let c = 0; c < cols; c++) {
      const column: number[] = [];
      for (let r = rows - 1; r >= 0; r--) {
        if (grid[r][c] >= 0) column.push(grid[r][c]);
      }
      for (let r = rows - 1; r >= 0; r--) {
        const idx = rows - 1 - r;
        grid[r][c] = idx < column.length ? column[idx] : -1;
      }
    }
  }

  function initBubble() {
    const cols = (deps.settings.cols as number) || 8;
    const rows = (deps.settings.rows as number) || 10;
    const colorCount = (deps.settings.colors as number) || 5;
    const cellSize = Math.min(
      (deps.canvas.width - 32) / cols,
      (deps.canvas.height - 70) / rows
    );
    deps.state = {
      cols,
      rows,
      colorCount,
      cellSize,
      offsetX: (deps.canvas.width - cols * cellSize) / 2,
      offsetY: (deps.canvas.height - rows * cellSize) / 2 + 8,
      grid: buildGrid(cols, rows, colorCount),
      popsLeft: (deps.settings.pops as number) || 25,
    };
  }

  function handleBubbleTap(mx: number, my: number) {
    const s = deps.state as {
      cols: number;
      rows: number;
      cellSize: number;
      offsetX: number;
      offsetY: number;
      grid: number[][];
      popsLeft: number;
    };

    const col = Math.floor((mx - s.offsetX) / s.cellSize);
    const row = Math.floor((my - s.offsetY) / s.cellSize);
    if (col < 0 || col >= s.cols || row < 0 || row >= s.rows) return;
    if (s.grid[row][col] < 0) return;

    const group = getGroup(s.grid, col, row);
    if (group.length < 2) return;

    for (const [c, r] of group) {
      s.grid[r][c] = -1;
    }

    const points = group.length * group.length;
    deps.scoreRef.current += points;
    deps.onScoreChange?.(deps.scoreRef.current);

    applyGravity(s.grid);
    s.popsLeft--;

    const remaining = s.grid.flat().filter((v) => v >= 0).length;
    if (remaining === 0 || s.popsLeft <= 0) {
      deps.endGame(deps.scoreRef.current);
    }
  }

  function updateBubble() {
    // tap-driven puzzle
  }

  function drawBubble() {
    const s = deps.state as {
      cols: number;
      rows: number;
      cellSize: number;
      offsetX: number;
      offsetY: number;
      grid: number[][];
      popsLeft: number;
      colorCount: number;
    };

    deps.ctx.fillStyle = deps.theme.background;
    deps.ctx.fillRect(0, 0, deps.canvas.width, deps.canvas.height);

    for (let r = 0; r < s.rows; r++) {
      for (let c = 0; c < s.cols; c++) {
        const colorIdx = s.grid[r][c];
        if (colorIdx < 0) continue;
        const x = s.offsetX + c * s.cellSize + s.cellSize / 2;
        const y = s.offsetY + r * s.cellSize + s.cellSize / 2;
        const radius = s.cellSize * 0.38;
        deps.ctx.beginPath();
        deps.ctx.arc(x, y, radius, 0, Math.PI * 2);
        deps.ctx.fillStyle = BUBBLE_COLORS[colorIdx % BUBBLE_COLORS.length];
        deps.ctx.fill();
        deps.ctx.strokeStyle = "#ffffff33";
        deps.ctx.lineWidth = 1.5;
        deps.ctx.stroke();
      }
    }

    deps.ctx.fillStyle = "#fff";
    deps.ctx.font = "16px sans-serif";
    deps.ctx.textAlign = "left";
    deps.ctx.fillText(`Score: ${deps.scoreRef.current}`, 16, 24);
    deps.ctx.fillText(`Pops left: ${s.popsLeft}`, 16, 46);

    deps.ctx.font = "12px sans-serif";
    deps.ctx.fillStyle = "#ffffff88";
    deps.ctx.textAlign = "center";
    deps.ctx.fillText("Tap 2+ matching bubbles to pop!", deps.canvas.width / 2, deps.canvas.height - 14);
  }

  return {
    init: initBubble,
    update: updateBubble,
    draw: drawBubble,
    handleBubbleTap,
  };
}
