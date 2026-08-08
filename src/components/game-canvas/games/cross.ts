import type { GameDeps } from "@/components/game-canvas/types";

export function createCrossGame(deps: GameDeps) {
  // ─── CROSS (Frogger) ───
  function initCross() {
    const cols = 7;
    const rows = 9;
    const cellW = deps.canvas.width / cols;
    const cellH = (deps.canvas.height - 50) / rows;
    const trafficRows = [1, 3, 5, 7];
    const carSpeed = ((deps.settings.carSpeed as number) || 1.4) * 2;
    deps.state = {
      cols,
      rows,
      cellW,
      cellH,
      offsetY: 30,
      player: { c: Math.floor(cols / 2), r: rows - 1 },
      cars: trafficRows.flatMap((row, laneIdx) =>
        [0, 1, 2].map((i) => ({
          row,
          x: (i * deps.canvas.width) / 3 + Math.random() * 30,
          w: cellW * 1.4,
          speed: (laneIdx % 2 === 0 ? 1 : -1) * carSpeed * (0.8 + Math.random() * 0.4),
        }))
      ),
      moveCooldown: 0,
    };
  }

  function tryMoveCross(dc: number, dr: number) {
    const s = deps.state as {
      cols: number;
      rows: number;
      player: { c: number; r: number };
      moveCooldown: number;
    };
    if (s.moveCooldown > 0) return;
    const nc = Math.max(0, Math.min(s.cols - 1, s.player.c + dc));
    const nr = Math.max(0, Math.min(s.rows - 1, s.player.r + dr));
    if (nc === s.player.c && nr === s.player.r) return;
    s.player.c = nc;
    s.player.r = nr;
    s.moveCooldown = 180;
    if (dr < 0) {
      deps.scoreRef.current += 10;
      deps.onScoreChange?.(deps.scoreRef.current);
    }
    if (s.player.r === 0) {
      deps.scoreRef.current += 100;
      deps.onScoreChange?.(deps.scoreRef.current);
      s.player.r = s.rows - 1;
      s.player.c = Math.floor(s.cols / 2);
    }
  }

  function updateCross() {
    const s = deps.state as {
      cols: number;
      rows: number;
      player: { c: number; r: number };
      cars: { row: number; x: number; w: number; speed: number }[];
      moveCooldown: number;
      cellW: number;
      cellH: number;
      offsetY: number;
    };
    if (s.moveCooldown > 0) s.moveCooldown -= 16;

    const keys = deps.keys;
    if (keys.has("arrowup") || keys.has("w")) tryMoveCross(0, -1);
    if (keys.has("arrowdown") || keys.has("s")) tryMoveCross(0, 1);
    if (keys.has("arrowleft") || keys.has("a")) tryMoveCross(-1, 0);
    if (keys.has("arrowright") || keys.has("d")) tryMoveCross(1, 0);
    deps.keys.delete("arrowup");
    deps.keys.delete("w");
    deps.keys.delete("arrowdown");
    deps.keys.delete("s");
    deps.keys.delete("arrowleft");
    deps.keys.delete("a");
    deps.keys.delete("arrowright");
    deps.keys.delete("d");

    if (deps.touch.pendingDir) {
      const d = deps.touch.pendingDir;
      if (Math.abs(d.x) > Math.abs(d.y)) tryMoveCross(d.x > 0 ? 1 : -1, 0);
      else tryMoveCross(0, d.y > 0 ? 1 : -1);
      deps.touch.pendingDir = null;
    }

    s.cars.forEach((car) => {
      car.x += car.speed;
      if (car.speed > 0 && car.x > deps.canvas.width + car.w) car.x = -car.w;
      if (car.speed < 0 && car.x < -car.w) car.x = deps.canvas.width + car.w;
    });

    const px = s.player.c * s.cellW + s.cellW / 2;
    const py = s.offsetY + s.player.r * s.cellH + s.cellH / 2;
    for (const car of s.cars) {
      if (car.row !== s.player.r) continue;
      if (px + s.cellW * 0.3 > car.x && px - s.cellW * 0.3 < car.x + car.w) {
        deps.endGame(deps.scoreRef.current);
        return;
      }
    }
  }

  function drawCross() {
    const s = deps.state as {
      cols: number;
      rows: number;
      cellW: number;
      cellH: number;
      offsetY: number;
      player: { c: number; r: number };
      cars: { row: number; x: number; w: number }[];
    };
    deps.ctx.fillStyle = deps.theme.background;
    deps.ctx.fillRect(0, 0, deps.canvas.width, deps.canvas.height);

    for (let r = 0; r < s.rows; r++) {
      const y = s.offsetY + r * s.cellH;
      deps.ctx.fillStyle = r === 0 ? deps.theme.accent + "33" : r % 2 === 0 ? deps.theme.secondary + "22" : deps.theme.secondary + "11";
      deps.ctx.fillRect(0, y, deps.canvas.width, s.cellH);
    }

    deps.ctx.fillStyle = deps.theme.primary;
    s.cars.forEach((car) => {
      const y = s.offsetY + car.row * s.cellH + s.cellH * 0.2;
      deps.ctx.fillRect(car.x, y, car.w, s.cellH * 0.6);
    });

    const px = s.player.c * s.cellW + s.cellW / 2;
    const py = s.offsetY + s.player.r * s.cellH + s.cellH / 2;
    if (!deps.drawPlayerEmoji(px, py, s.cellW * 0.55)) {
      deps.ctx.fillStyle = deps.theme.accent;
      deps.ctx.beginPath();
      deps.ctx.arc(px, py, s.cellW * 0.32, 0, Math.PI * 2);
      deps.ctx.fill();
    }

    deps.ctx.fillStyle = "#fff";
    deps.ctx.font = "16px sans-serif";
    deps.ctx.textAlign = "left";
    deps.ctx.fillText(`Score: ${deps.scoreRef.current}`, 16, 22);
    deps.ctx.font = "12px sans-serif";
    deps.ctx.fillStyle = "#ffffff88";
    deps.ctx.fillText("+10 per lane · +100 at top", 16, deps.canvas.height - 12);
  }

  return {
    init: initCross,
    update: updateCross,
    draw: drawCross,
  };
}
