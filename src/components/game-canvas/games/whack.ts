import type { GameDeps } from "@/components/game-canvas/types";

export function createWhackGame(deps: GameDeps) {
  // ─── WHACK ───
  function initWhack() {
    const cols = 3;
    const rows = 3;
    const cellSize = Math.min((deps.canvas.width - 40) / cols, (deps.canvas.height - 100) / rows);
    const duration = ((deps.settings.duration as number) || 30) * 1000;
    deps.state = {
      cols,
      rows,
      cellSize,
      offsetX: (deps.canvas.width - cols * cellSize) / 2,
      offsetY: (deps.canvas.height - rows * cellSize) / 2 + 10,
      moles: Array.from({ length: cols * rows }, () => null) as ({
        active: boolean;
        golden: boolean;
        timer: number;
        maxTime: number;
      } | null)[],
      spawnTimer: 0,
      duration,
      timeLeft: duration,
      moleSpeed: (deps.settings.moleSpeed as number) || 1,
    };
  }

  function updateWhack() {
    const s = deps.state as {
      moles: ({ active: boolean; golden: boolean; timer: number; maxTime: number } | null)[];
      spawnTimer: number;
      moleSpeed: number;
      timeLeft: number;
    };
    s.timeLeft -= 16;
    if (s.timeLeft <= 0) {
      deps.endGame(deps.scoreRef.current);
      return;
    }

    s.spawnTimer += 16;
    if (s.spawnTimer >= 700 / s.moleSpeed) {
      s.spawnTimer = 0;
      const open = s.moles
        .map((m, i) => (m?.active ? -1 : i))
        .filter((i) => i >= 0);
      if (open.length > 0) {
        const idx = open[Math.floor(Math.random() * open.length)];
        const golden = Math.random() < 0.12;
        s.moles[idx] = {
          active: true,
          golden,
          timer: 0,
          maxTime: (golden ? 900 : 1600) / s.moleSpeed,
        };
      }
    }

    s.moles.forEach((m, i) => {
      if (!m?.active) return;
      m.timer += 16;
      if (m.timer >= m.maxTime) s.moles[i] = null;
    });
  }

  function drawWhack() {
    const s = deps.state as {
      cols: number;
      rows: number;
      cellSize: number;
      offsetX: number;
      offsetY: number;
      moles: ({ active: boolean; golden: boolean } | null)[];
      timeLeft: number;
      duration: number;
    };
    deps.ctx.fillStyle = deps.theme.background;
    deps.ctx.fillRect(0, 0, deps.canvas.width, deps.canvas.height);

    for (let i = 0; i < s.cols * s.rows; i++) {
      const col = i % s.cols;
      const row = Math.floor(i / s.cols);
      const x = s.offsetX + col * s.cellSize;
      const y = s.offsetY + row * s.cellSize;
      deps.ctx.fillStyle = deps.theme.secondary + "33";
      deps.ctx.beginPath();
      deps.ctx.ellipse(x + s.cellSize / 2, y + s.cellSize * 0.85, s.cellSize * 0.35, s.cellSize * 0.12, 0, 0, Math.PI * 2);
      deps.ctx.fill();

      const mole = s.moles[i];
      if (mole?.active) {
        deps.ctx.font = `${s.cellSize * 0.5}px sans-serif`;
        deps.ctx.textAlign = "center";
        deps.ctx.textBaseline = "middle";
        deps.ctx.fillText(mole.golden ? "⭐" : "🐹", x + s.cellSize / 2, y + s.cellSize / 2);
      }
    }

    deps.ctx.fillStyle = "#fff";
    deps.ctx.font = "16px sans-serif";
    deps.ctx.textAlign = "left";
    deps.ctx.fillText(`Score: ${deps.scoreRef.current}`, 16, 28);
    deps.ctx.fillText(`Time: ${Math.ceil(s.timeLeft / 1000)}s`, 16, 50);
    deps.ctx.font = "12px sans-serif";
    deps.ctx.fillStyle = "#ffffff88";
    deps.ctx.textAlign = "center";
    deps.ctx.fillText("Tap moles before they hide!", deps.canvas.width / 2, deps.canvas.height - 16);
  }

  function handleWhackTap(mx: number, my: number) {
    const s = deps.state as {
      cols: number;
      rows: number;
      cellSize: number;
      offsetX: number;
      offsetY: number;
      moles: ({ active: boolean; golden: boolean } | null)[];
    };
    const col = Math.floor((mx - s.offsetX) / s.cellSize);
    const row = Math.floor((my - s.offsetY) / s.cellSize);
    if (col < 0 || col >= s.cols || row < 0 || row >= s.rows) return;
    const idx = row * s.cols + col;
    const mole = s.moles[idx];
    if (!mole?.active) return;
    deps.scoreRef.current += mole.golden ? 25 : 10;
    deps.onScoreChange?.(deps.scoreRef.current);
    s.moles[idx] = null;
  }

  return {
    init: initWhack,
    update: updateWhack,
    draw: drawWhack,
    handleWhackTap: handleWhackTap,
  };
}
