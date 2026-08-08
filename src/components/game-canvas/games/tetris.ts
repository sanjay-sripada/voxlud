import type { GameDeps } from "@/components/game-canvas/types";

export function createTetrisGame(deps: GameDeps) {
  // ─── TETRIS ───
  const TETROMINOES = [
    { shape: [[1, 1, 1, 1]], color: 0 },
    { shape: [[1, 1], [1, 1]], color: 1 },
    { shape: [[0, 1, 0], [1, 1, 1]], color: 2 },
    { shape: [[1, 0, 0], [1, 1, 1]], color: 3 },
    { shape: [[0, 0, 1], [1, 1, 1]], color: 4 },
    { shape: [[0, 1, 1], [1, 1, 0]], color: 5 },
    { shape: [[1, 1, 0], [0, 1, 1]], color: 6 },
  ];

  function initTetris() {
    const cols = (deps.settings.gridWidth as number) || 10;
    const rows = 20;
    const cellSize = Math.min(deps.canvas.width / (cols + 4), deps.canvas.height / (rows + 2));
    deps.state = {
      cols,
      rows,
      cellSize,
      offsetX: (deps.canvas.width - cols * cellSize) / 2,
      offsetY: (deps.canvas.height - rows * cellSize) / 2,
      board: Array.from({ length: rows }, () => Array(cols).fill(0)),
      piece: null as { shape: number[][]; color: number; x: number; y: number } | null,
      dropTimer: 0,
      dropInterval: (deps.settings.dropSpeed as number) || 600,
      colors: [deps.theme.primary, deps.theme.secondary, deps.theme.accent, "#fbbf24", "#34d399", "#fb7185", "#818cf8"],
    };
    spawnTetrisPiece();
  }

  function spawnTetrisPiece() {
    const s = deps.state as {
      cols: number;
      board: number[][];
      piece: { shape: number[][]; color: number; x: number; y: number } | null;
    };
    const t = TETROMINOES[Math.floor(Math.random() * TETROMINOES.length)];
    s.piece = { shape: t.shape.map((r) => [...r]), color: t.color, x: Math.floor(s.cols / 2) - 1, y: 0 };
    if (tetrisCollision(s.piece)) deps.endGame(deps.scoreRef.current);
  }

  function tetrisCollision(
    piece: { shape: number[][]; x: number; y: number },
    ox = 0,
    oy = 0
  ): boolean {
    const s = deps.state as { cols: number; rows: number; board: number[][] };
    for (let r = 0; r < piece.shape.length; r++) {
      for (let c = 0; c < piece.shape[r].length; c++) {
        if (!piece.shape[r][c]) continue;
        const nx = piece.x + c + ox;
        const ny = piece.y + r + oy;
        if (nx < 0 || nx >= s.cols || ny >= s.rows) return true;
        if (ny >= 0 && s.board[ny][nx]) return true;
      }
    }
    return false;
  }

  function lockTetrisPiece() {
    const s = deps.state as {
      cols: number;
      rows: number;
      board: number[][];
      piece: { shape: number[][]; color: number; x: number; y: number };
    };
    const p = s.piece;
    for (let r = 0; r < p.shape.length; r++) {
      for (let c = 0; c < p.shape[r].length; c++) {
        if (!p.shape[r][c]) continue;
        const ny = p.y + r;
        const nx = p.x + c;
        if (ny >= 0) s.board[ny][nx] = p.color + 1;
      }
    }
    let cleared = 0;
    s.board = s.board.filter((row) => {
      if (row.every((cell) => cell > 0)) {
        cleared++;
        return false;
      }
      return true;
    });
    while (s.board.length < s.rows) s.board.unshift(Array(s.cols).fill(0));
    if (cleared > 0) {
      deps.scoreRef.current += cleared * 100 * cleared;
      deps.onScoreChange?.(deps.scoreRef.current);
    }
    spawnTetrisPiece();
  }

  function rotateTetris(shape: number[][]): number[][] {
    const rows = shape.length;
    const cols = shape[0].length;
    const rotated = Array.from({ length: cols }, () => Array(rows).fill(0));
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) rotated[c][rows - 1 - r] = shape[r][c];
    }
    return rotated;
  }

  function updateTetris() {
    const s = deps.state as {
      piece: { shape: number[][]; color: number; x: number; y: number } | null;
      dropTimer: number;
      dropInterval: number;
    };
    if (!s.piece) return;
    const keys = deps.keys;
    if (keys.has("arrowleft") || keys.has("a")) {
      if (!tetrisCollision(s.piece, -1, 0)) s.piece.x--;
      deps.keys.delete("arrowleft");
      deps.keys.delete("a");
    }
    if (keys.has("arrowright") || keys.has("d")) {
      if (!tetrisCollision(s.piece, 1, 0)) s.piece.x++;
      deps.keys.delete("arrowright");
      deps.keys.delete("d");
    }
    if (keys.has("arrowup") || keys.has("w")) {
      const rotated = rotateTetris(s.piece.shape);
      const prev = s.piece.shape;
      s.piece.shape = rotated;
      if (tetrisCollision(s.piece)) s.piece.shape = prev;
      deps.keys.delete("arrowup");
      deps.keys.delete("w");
    }
    if (keys.has("arrowdown") || keys.has("s")) {
      if (!tetrisCollision(s.piece, 0, 1)) s.piece.y++;
      deps.keys.delete("arrowdown");
      deps.keys.delete("s");
    }

    if (deps.touch.pendingDir) {
      const d = deps.touch.pendingDir;
      if (d.x < 0 && !tetrisCollision(s.piece, -1, 0)) s.piece.x--;
      if (d.x > 0 && !tetrisCollision(s.piece, 1, 0)) s.piece.x++;
      if (d.y < 0) {
        const rotated = rotateTetris(s.piece.shape);
        const prev = s.piece.shape;
        s.piece.shape = rotated;
        if (tetrisCollision(s.piece)) s.piece.shape = prev;
      }
      if (d.y > 0 && !tetrisCollision(s.piece, 0, 1)) s.piece.y++;
      deps.touch.pendingDir = null;
    }

    s.dropTimer += 16;
    if (s.dropTimer >= s.dropInterval) {
      s.dropTimer = 0;
      if (!tetrisCollision(s.piece, 0, 1)) s.piece.y++;
      else lockTetrisPiece();
    }
  }

  function drawTetris() {
    const s = deps.state as {
      cols: number;
      rows: number;
      cellSize: number;
      offsetX: number;
      offsetY: number;
      board: number[][];
      piece: { shape: number[][]; color: number; x: number; y: number } | null;
      colors: string[];
    };
    deps.ctx.fillStyle = deps.theme.background;
    deps.ctx.fillRect(0, 0, deps.canvas.width, deps.canvas.height);

    const drawCell = (cx: number, cy: number, colorIdx: number) => {
      deps.ctx.fillStyle = s.colors[colorIdx % s.colors.length];
      deps.ctx.fillRect(
        s.offsetX + cx * s.cellSize + 1,
        s.offsetY + cy * s.cellSize + 1,
        s.cellSize - 2,
        s.cellSize - 2
      );
    };

    for (let r = 0; r < s.rows; r++) {
      for (let c = 0; c < s.cols; c++) {
        if (s.board[r][c]) drawCell(c, r, s.board[r][c] - 1);
      }
    }

    if (s.piece) {
      for (let r = 0; r < s.piece.shape.length; r++) {
        for (let c = 0; c < s.piece.shape[r].length; c++) {
          if (s.piece.shape[r][c]) drawCell(s.piece.x + c, s.piece.y + r, s.piece.color);
        }
      }
    }

    deps.ctx.strokeStyle = deps.theme.secondary + "44";
    deps.ctx.strokeRect(s.offsetX, s.offsetY, s.cols * s.cellSize, s.rows * s.cellSize);

    deps.ctx.fillStyle = "#fff";
    deps.ctx.font = "16px sans-serif";
    deps.ctx.textAlign = "left";
    deps.ctx.fillText(`Score: ${deps.scoreRef.current}`, 16, 30);
    deps.ctx.font = "12px sans-serif";
    deps.ctx.fillStyle = "#ffffff88";
    deps.ctx.fillText("←/→ move · ↑ rotate · ↓ drop", 16, deps.canvas.height - 16);
  }

  return {
    init: initTetris,
    update: updateTetris,
    draw: drawTetris,
  };
}
