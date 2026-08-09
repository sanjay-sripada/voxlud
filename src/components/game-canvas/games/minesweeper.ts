import type { GameDeps } from "@/components/game-canvas/types";

type CellState = "hidden" | "revealed" | "flagged";

interface Cell {
  mine: boolean;
  state: CellState;
  adjacent: number;
}

export function createMinesweeperGame(deps: GameDeps) {
  function buildGrid(size: number, mineCount: number): Cell[] {
    const cells: Cell[] = Array.from({ length: size * size }, () => ({
      mine: false,
      state: "hidden",
      adjacent: 0,
    }));

    let placed = 0;
    while (placed < mineCount) {
      const idx = Math.floor(Math.random() * cells.length);
      if (cells[idx].mine) continue;
      cells[idx].mine = true;
      placed++;
    }

    for (let i = 0; i < cells.length; i++) {
      if (cells[i].mine) continue;
      const col = i % size;
      const row = Math.floor(i / size);
      let count = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const nc = col + dx;
          const nr = row + dy;
          if (nc < 0 || nc >= size || nr < 0 || nr >= size) continue;
          if (cells[nr * size + nc].mine) count++;
        }
      }
      cells[i].adjacent = count;
    }

    return cells;
  }

  function initMinesweeper() {
    const size = (deps.settings.gridSize as number) || 9;
    const mineCount = (deps.settings.mines as number) || Math.floor(size * size * 0.12);
    const cellSize = Math.min(
      (deps.canvas.width - 24) / size,
      (deps.canvas.height - 80) / size
    );
    deps.state = {
      size,
      mineCount,
      cellSize,
      offsetX: (deps.canvas.width - size * cellSize) / 2,
      offsetY: (deps.canvas.height - size * cellSize) / 2 + 10,
      cells: buildGrid(size, mineCount),
      flagMode: false,
      revealed: 0,
      gameOver: false,
      won: false,
    };
  }

  function revealCell(idx: number) {
    const s = deps.state as {
      size: number;
      cells: Cell[];
      revealed: number;
      gameOver: boolean;
      won: boolean;
      mineCount: number;
    };
    const cell = s.cells[idx];
    if (!cell || cell.state !== "hidden") return;

    if (cell.mine) {
      s.cells.forEach((c) => {
        if (c.mine) c.state = "revealed";
      });
      s.gameOver = true;
      deps.endGame(deps.scoreRef.current);
      return;
    }

    const stack = [idx];
    while (stack.length > 0) {
      const cur = stack.pop()!;
      const c = s.cells[cur];
      if (!c || c.state !== "hidden" || c.mine) continue;
      c.state = "revealed";
      s.revealed++;
      if (c.adjacent === 0) {
        const col = cur % s.size;
        const row = Math.floor(cur / s.size);
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nc = col + dx;
            const nr = row + dy;
            if (nc < 0 || nc >= s.size || nr < 0 || nr >= s.size) continue;
            stack.push(nr * s.size + nc);
          }
        }
      }
    }

    const totalSafe = s.size * s.size - s.mineCount;
    if (s.revealed >= totalSafe) {
      s.won = true;
      deps.scoreRef.current += 500;
      deps.onScoreChange?.(deps.scoreRef.current);
      deps.endGame(deps.scoreRef.current);
    } else {
      deps.scoreRef.current += 5;
      deps.onScoreChange?.(deps.scoreRef.current);
    }
  }

  function handleMinesweeperTap(mx: number, my: number, flag = false) {
    const s = deps.state as {
      size: number;
      cellSize: number;
      offsetX: number;
      offsetY: number;
      cells: Cell[];
      flagMode: boolean;
      gameOver: boolean;
    };
    if (s.gameOver) return;

    const flagBtnY = deps.canvas.height - 36;
    if (my >= flagBtnY) {
      s.flagMode = !s.flagMode;
      return;
    }

    const col = Math.floor((mx - s.offsetX) / s.cellSize);
    const row = Math.floor((my - s.offsetY) / s.cellSize);
    if (col < 0 || col >= s.size || row < 0 || row >= s.size) return;
    const idx = row * s.size + col;
    const cell = s.cells[idx];
    if (!cell) return;

    const useFlag = flag || s.flagMode;
    if (useFlag) {
      if (cell.state === "hidden") cell.state = "flagged";
      else if (cell.state === "flagged") cell.state = "hidden";
      return;
    }

    revealCell(idx);
  }

  function updateMinesweeper() {
    // static puzzle — no per-frame logic
  }

  function drawMinesweeper() {
    const s = deps.state as {
      size: number;
      cellSize: number;
      offsetX: number;
      offsetY: number;
      cells: Cell[];
      flagMode: boolean;
      mineCount: number;
      gameOver: boolean;
      won: boolean;
    };

    deps.ctx.fillStyle = deps.theme.background;
    deps.ctx.fillRect(0, 0, deps.canvas.width, deps.canvas.height);

    const numColors = ["", "#60a5fa", "#4ade80", "#f87171", "#c084fc", "#fbbf24", "#22d3ee", "#f472b6", "#a3e635"];

    for (let i = 0; i < s.cells.length; i++) {
      const col = i % s.size;
      const row = Math.floor(i / s.size);
      const x = s.offsetX + col * s.cellSize;
      const y = s.offsetY + row * s.cellSize;
      const cell = s.cells[i];
      const pad = 2;

      if (cell.state === "hidden" || cell.state === "flagged") {
        deps.ctx.fillStyle = deps.theme.secondary + "55";
        deps.ctx.fillRect(x + pad, y + pad, s.cellSize - pad * 2, s.cellSize - pad * 2);
        if (cell.state === "flagged") {
          deps.ctx.font = `${s.cellSize * 0.45}px sans-serif`;
          deps.ctx.textAlign = "center";
          deps.ctx.textBaseline = "middle";
          deps.ctx.fillText("🚩", x + s.cellSize / 2, y + s.cellSize / 2);
        }
      } else {
        deps.ctx.fillStyle = deps.theme.background;
        deps.ctx.fillRect(x + pad, y + pad, s.cellSize - pad * 2, s.cellSize - pad * 2);
        if (cell.mine) {
          deps.ctx.font = `${s.cellSize * 0.45}px sans-serif`;
          deps.ctx.textAlign = "center";
          deps.ctx.textBaseline = "middle";
          deps.ctx.fillText("💣", x + s.cellSize / 2, y + s.cellSize / 2);
        } else if (cell.adjacent > 0) {
          deps.ctx.fillStyle = numColors[cell.adjacent] || "#fff";
          deps.ctx.font = `bold ${s.cellSize * 0.4}px sans-serif`;
          deps.ctx.textAlign = "center";
          deps.ctx.textBaseline = "middle";
          deps.ctx.fillText(String(cell.adjacent), x + s.cellSize / 2, y + s.cellSize / 2);
        }
      }
    }

    deps.ctx.fillStyle = "#fff";
    deps.ctx.font = "14px sans-serif";
    deps.ctx.textAlign = "left";
    deps.ctx.fillText(`Score: ${deps.scoreRef.current}`, 16, 22);
    deps.ctx.fillText(`Mines: ${s.mineCount}`, 16, 42);

    const btnW = 120;
    const btnX = (deps.canvas.width - btnW) / 2;
    deps.ctx.fillStyle = s.flagMode ? deps.theme.accent : deps.theme.secondary + "66";
    deps.ctx.beginPath();
    deps.ctx.roundRect(btnX, deps.canvas.height - 40, btnW, 28, 6);
    deps.ctx.fill();
    deps.ctx.fillStyle = "#fff";
    deps.ctx.textAlign = "center";
    deps.ctx.font = "13px sans-serif";
    deps.ctx.fillText(s.flagMode ? "🚩 Flag ON" : "Tap to reveal", deps.canvas.width / 2, deps.canvas.height - 22);

    if (s.won) {
      deps.ctx.fillStyle = "#22c55e";
      deps.ctx.font = "bold 22px sans-serif";
      deps.ctx.textAlign = "center";
      deps.ctx.fillText("You Win!", deps.canvas.width / 2, s.offsetY - 16);
    }
  }

  return {
    init: initMinesweeper,
    update: updateMinesweeper,
    draw: drawMinesweeper,
    handleMinesweeperTap,
  };
}
