import type { GameDeps } from "@/components/game-canvas/types";

export function createMemoryGame(deps: GameDeps) {
  // ─── MEMORY ───
  function initMemory() {
    const sizeSetting = (deps.settings.gridSize as number) || 4;
    const cols = sizeSetting === 3 ? 3 : sizeSetting === 6 ? 6 : 4;
    const rows = sizeSetting === 3 ? 2 : sizeSetting === 6 ? 6 : 4;
    const total = cols * rows;
    const pairs = total / 2;
    const symbols = ["🌟", "🔥", "💎", "🎵", "🌈", "🍀", "🎯", "🚀", "🎨", "⚡", "🌸", "🎲", "🦋", "🍕", "🎮", "🌙", "🎪", "🧩"];
    const cards: { symbol: string; flipped: boolean; matched: boolean }[] = [];
    const deck = symbols.slice(0, pairs);
    const shuffled = [...deck, ...deck].sort(() => Math.random() - 0.5);
    shuffled.forEach((sym) => cards.push({ symbol: sym, flipped: false, matched: false }));

    const cellSize = Math.min((deps.canvas.width - 40) / cols, (deps.canvas.height - 80) / rows);
    deps.state = {
      cols,
      rows,
      cellSize,
      offsetX: (deps.canvas.width - cols * cellSize) / 2,
      offsetY: (deps.canvas.height - rows * cellSize) / 2 + 10,
      cards,
      firstPick: null as number | null,
      secondPick: null as number | null,
      lockTimer: 0,
      moves: 0,
      timeLimit: (deps.settings.timeLimit as number) || 0,
      timeLeft: (deps.settings.timeLimit as number) || 0,
      timer: 0,
    };
  }

  function updateMemory() {
    const s = deps.state as {
      cards: { symbol: string; flipped: boolean; matched: boolean }[];
      firstPick: number | null;
      secondPick: number | null;
      lockTimer: number;
      timeLimit: number;
      timeLeft: number;
      timer: number;
    };

    if (s.timeLimit > 0) {
      s.timer += 16;
      if (s.timer >= 1000) {
        s.timer = 0;
        s.timeLeft--;
        if (s.timeLeft <= 0) deps.endGame(deps.scoreRef.current);
      }
    }

    if (s.lockTimer > 0) {
      s.lockTimer -= 16;
      if (s.lockTimer <= 0 && s.firstPick !== null && s.secondPick !== null) {
        const a = s.cards[s.firstPick];
        const b = s.cards[s.secondPick];
        if (a.symbol === b.symbol) {
          a.matched = true;
          b.matched = true;
          deps.scoreRef.current += 20;
          deps.onScoreChange?.(deps.scoreRef.current);
          if (s.cards.every((c) => c.matched)) deps.endGame(deps.scoreRef.current);
        } else {
          a.flipped = false;
          b.flipped = false;
        }
        s.firstPick = null;
        s.secondPick = null;
      }
    }
  }

  function drawMemory() {
    const s = deps.state as {
      cols: number;
      rows: number;
      cellSize: number;
      offsetX: number;
      offsetY: number;
      cards: { symbol: string; flipped: boolean; matched: boolean }[];
      moves: number;
      timeLimit: number;
      timeLeft: number;
    };
    deps.ctx.fillStyle = deps.theme.background;
    deps.ctx.fillRect(0, 0, deps.canvas.width, deps.canvas.height);

    s.cards.forEach((card, i) => {
      const col = i % s.cols;
      const row = Math.floor(i / s.cols);
      const x = s.offsetX + col * s.cellSize;
      const y = s.offsetY + row * s.cellSize;
      const show = card.flipped || card.matched;

      deps.ctx.fillStyle = card.matched ? deps.theme.secondary + "33" : show ? deps.theme.primary + "44" : deps.theme.secondary + "66";
      deps.ctx.beginPath();
      deps.ctx.roundRect(x + 3, y + 3, s.cellSize - 6, s.cellSize - 6, 8);
      deps.ctx.fill();

      if (show) {
        deps.ctx.font = `${s.cellSize * 0.45}px sans-serif`;
        deps.ctx.textAlign = "center";
        deps.ctx.textBaseline = "middle";
        deps.ctx.fillText(card.symbol, x + s.cellSize / 2, y + s.cellSize / 2);
      } else {
        deps.ctx.fillStyle = deps.theme.accent + "88";
        deps.ctx.font = `bold ${s.cellSize * 0.3}px sans-serif`;
        deps.ctx.textAlign = "center";
        deps.ctx.textBaseline = "middle";
        deps.ctx.fillText("?", x + s.cellSize / 2, y + s.cellSize / 2);
      }
    });

    deps.ctx.fillStyle = "#fff";
    deps.ctx.font = "16px sans-serif";
    deps.ctx.textAlign = "left";
    deps.ctx.textBaseline = "alphabetic";
    deps.ctx.fillText(`Score: ${deps.scoreRef.current}  Moves: ${s.moves}`, 16, 30);
    if (s.timeLimit > 0) deps.ctx.fillText(`Time: ${s.timeLeft}s`, 16, 52);
    deps.ctx.font = "12px sans-serif";
    deps.ctx.fillStyle = "#ffffff88";
    deps.ctx.textAlign = "center";
    deps.ctx.fillText("Tap cards to flip and match pairs", deps.canvas.width / 2, deps.canvas.height - 16);
  }

  function handleMemoryTap(mx: number, my: number) {
    const s = deps.state as {
      cols: number;
      rows: number;
      cellSize: number;
      offsetX: number;
      offsetY: number;
      cards: { symbol: string; flipped: boolean; matched: boolean }[];
      firstPick: number | null;
      secondPick: number | null;
      lockTimer: number;
      moves: number;
    };
    if (s.lockTimer > 0) return;

    const col = Math.floor((mx - s.offsetX) / s.cellSize);
    const row = Math.floor((my - s.offsetY) / s.cellSize);
    if (col < 0 || col >= s.cols || row < 0 || row >= s.rows) return;

    const idx = row * s.cols + col;
    const card = s.cards[idx];
    if (!card || card.matched || card.flipped) return;

    card.flipped = true;
    if (s.firstPick === null) {
      s.firstPick = idx;
    } else if (s.secondPick === null && idx !== s.firstPick) {
      s.secondPick = idx;
      s.moves++;
      s.lockTimer = 600;
    }
  }

  return {
    init: initMemory,
    update: updateMemory,
    draw: drawMemory,
    handleMemoryTap: handleMemoryTap,
  };
}
