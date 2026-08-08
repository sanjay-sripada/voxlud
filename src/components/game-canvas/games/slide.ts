import type { GameDeps } from "@/components/game-canvas/types";

export function createSlideGame(deps: GameDeps) {
  // ─── SLIDE (2048) ───
  function initSlide() {
    const size = (deps.settings.gridSize as number) || 4;
    const cellSize = Math.min((deps.canvas.width - 48) / size, (deps.canvas.height - 100) / size);
    const grid = Array.from({ length: size }, () => Array(size).fill(0));
    slideSpawn(grid);
    slideSpawn(grid);
    deps.state = {
      size,
      cellSize,
      offsetX: (deps.canvas.width - size * cellSize) / 2,
      offsetY: (deps.canvas.height - size * cellSize) / 2 + 10,
      grid,
      target: (deps.settings.target as number) || 2048,
      pendingMove: null as { x: number; y: number } | null,
    };
  }

  function slideSpawn(grid: number[][]) {
    const empty: [number, number][] = [];
    grid.forEach((row, r) => row.forEach((v, c) => { if (!v) empty.push([r, c]); }));
    if (!empty.length) return;
    const [r, c] = empty[Math.floor(Math.random() * empty.length)];
    grid[r][c] = Math.random() < 0.9 ? 2 : 4;
  }

  function slideCanMove(grid: number[][]): boolean {
    const size = grid.length;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const v = grid[r][c];
        if (!v) return true;
        if (c < size - 1 && grid[r][c + 1] === v) return true;
        if (r < size - 1 && grid[r + 1][c] === v) return true;
      }
    }
    return false;
  }

  function slideLine(line: number[]) {
    const filtered = line.filter((v) => v);
    const result: number[] = [];
    let gained = 0;
    let i = 0;
    while (i < filtered.length) {
      if (i + 1 < filtered.length && filtered[i] === filtered[i + 1]) {
        const merged = filtered[i] * 2;
        result.push(merged);
        gained += merged;
        i += 2;
      } else {
        result.push(filtered[i]);
        i += 1;
      }
    }
    while (result.length < line.length) result.push(0);
    const changed = line.some((v, idx) => v !== result[idx]);
    return { line: result, changed, gained };
  }

  function slideMove(grid: number[][], dx: number, dy: number): boolean {
    const size = grid.length;
    let moved = false;
    let gained = 0;

    if (dx !== 0) {
      for (let r = 0; r < size; r++) {
        const row = dx < 0 ? [...grid[r]] : [...grid[r]].reverse();
        const { line, changed, gained: g } = slideLine(row);
        const out = dx < 0 ? line : [...line].reverse();
        if (changed) {
          moved = true;
          gained += g;
          grid[r] = out;
        }
      }
    } else {
      for (let c = 0; c < size; c++) {
        const col = grid.map((row) => row[c]);
        const working = dy < 0 ? [...col] : [...col].reverse();
        const { line, changed, gained: g } = slideLine(working);
        const out = dy < 0 ? line : [...line].reverse();
        if (changed) {
          moved = true;
          gained += g;
          for (let r = 0; r < size; r++) grid[r][c] = out[r];
        }
      }
    }

    if (gained > 0) {
      deps.scoreRef.current += gained;
      deps.onScoreChange?.(deps.scoreRef.current);
    }
    return moved;
  }

  function updateSlide() {
    const s = deps.state as {
      grid: number[][];
      target: number;
      pendingMove: { x: number; y: number } | null;
    };
    const keys = deps.keys;
    let dx = 0;
    let dy = 0;
    if (keys.has("arrowleft") || keys.has("a")) dx = -1;
    if (keys.has("arrowright") || keys.has("d")) dx = 1;
    if (keys.has("arrowup") || keys.has("w")) dy = -1;
    if (keys.has("arrowdown") || keys.has("s")) dy = 1;
    if (dx || dy) {
      deps.keys.delete("arrowleft");
      deps.keys.delete("a");
      deps.keys.delete("arrowright");
      deps.keys.delete("d");
      deps.keys.delete("arrowup");
      deps.keys.delete("w");
      deps.keys.delete("arrowdown");
      deps.keys.delete("s");
    }

    if (deps.touch.pendingDir) {
      const d = deps.touch.pendingDir;
      if (Math.abs(d.x) > Math.abs(d.y)) dx = d.x > 0 ? 1 : -1;
      else dy = d.y > 0 ? 1 : -1;
      deps.touch.pendingDir = null;
    }

    if (dx || dy) {
      const moved = slideMove(s.grid, dx, dy);
      if (moved) {
        slideSpawn(s.grid);
        if (s.grid.some((row) => row.some((v) => v >= s.target))) deps.endGame(deps.scoreRef.current);
        else if (!slideCanMove(s.grid)) deps.endGame(deps.scoreRef.current);
      }
    }
  }

  function drawSlide() {
    const s = deps.state as {
      size: number;
      cellSize: number;
      offsetX: number;
      offsetY: number;
      grid: number[][];
      target: number;
    };
    const colors = ["", "#334155", "#475569", "#6366f1", "#818cf8", "#a78bfa", "#f472b6", "#fb7185", "#fbbf24", "#34d399", "#22d3ee", "#f97316"];
    deps.ctx.fillStyle = deps.theme.background;
    deps.ctx.fillRect(0, 0, deps.canvas.width, deps.canvas.height);

    for (let r = 0; r < s.size; r++) {
      for (let c = 0; c < s.size; c++) {
        const val = s.grid[r][c];
        const x = s.offsetX + c * s.cellSize;
        const y = s.offsetY + r * s.cellSize;
        deps.ctx.fillStyle = val ? (colors[Math.min(Math.log2(val), colors.length - 1)] || deps.theme.primary) : deps.theme.secondary + "33";
        deps.ctx.beginPath();
        deps.ctx.roundRect(x + 3, y + 3, s.cellSize - 6, s.cellSize - 6, 8);
        deps.ctx.fill();
        if (val) {
          deps.ctx.fillStyle = val > 4 ? "#fff" : "#e2e8f0";
          deps.ctx.font = `bold ${s.cellSize * (val >= 1000 ? 0.28 : 0.36)}px sans-serif`;
          deps.ctx.textAlign = "center";
          deps.ctx.textBaseline = "middle";
          deps.ctx.fillText(String(val), x + s.cellSize / 2, y + s.cellSize / 2);
        }
      }
    }

    deps.ctx.fillStyle = "#fff";
    deps.ctx.font = "16px sans-serif";
    deps.ctx.textAlign = "left";
    deps.ctx.fillText(`Score: ${deps.scoreRef.current}  Target: ${s.target}`, 16, 28);
    deps.ctx.font = "12px sans-serif";
    deps.ctx.fillStyle = "#ffffff88";
    deps.ctx.textAlign = "center";
    deps.ctx.fillText("Swipe or use arrows to merge tiles", deps.canvas.width / 2, deps.canvas.height - 16);
  }

  return {
    init: initSlide,
    update: updateSlide,
    draw: drawSlide,
  };
}
