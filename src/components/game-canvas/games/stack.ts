import type { GameDeps } from "@/components/game-canvas/types";

export function createStackGame(deps: GameDeps) {
  // ─── STACK ───
  function initStack() {
    const w = (deps.settings.startWidth as number) || 100;
    const baseY = deps.canvas.height - 48;
    deps.state = {
      blocks: [{ x: deps.canvas.width / 2 - w / 2, w, y: baseY }],
      current: { x: 20, w, dir: 1, y: baseY - 28 },
      speed: (deps.settings.blockSpeed as number) || 1.6,
    };
  }

  function dropStack() {
    const s = deps.state as {
      blocks: { x: number; w: number; y: number }[];
      current: { x: number; w: number; dir: number; y: number };
      speed: number;
    };
    const prev = s.blocks[s.blocks.length - 1];
    const cur = s.current;
    const left = Math.max(prev.x, cur.x);
    const right = Math.min(prev.x + prev.w, cur.x + cur.w);
    const overlap = right - left;
    if (overlap <= 8) {
      deps.endGame(deps.scoreRef.current);
      return;
    }
    const perfect = Math.abs(prev.x - cur.x) < 6;
    deps.scoreRef.current += perfect ? 25 : 10;
    deps.onScoreChange?.(deps.scoreRef.current);
    s.blocks.push({ x: left, w: overlap, y: cur.y });
    const lift = 22;
    s.blocks.forEach((b) => (b.y -= lift));
    if (s.blocks.length > 12) {
      s.blocks.shift();
      s.blocks.forEach((b) => (b.y += lift));
    }
    s.current = {
      x: 20,
      w: overlap,
      dir: 1,
      y: s.blocks[s.blocks.length - 1].y - 28,
    };
  }

  function updateStack() {
    const s = deps.state as {
      current: { x: number; w: number; dir: number; y: number };
      speed: number;
    };
    const cur = s.current;
    cur.x += cur.dir * s.speed * 4;
    if (cur.x <= 10) {
      cur.x = 10;
      cur.dir = 1;
    }
    if (cur.x + cur.w >= deps.canvas.width - 10) {
      cur.x = deps.canvas.width - 10 - cur.w;
      cur.dir = -1;
    }

    if (deps.keys.has(" ") || deps.touch.actionTap) {
      dropStack();
      deps.keys.delete(" ");
      deps.touch.actionTap = false;
    }
  }

  function drawStack() {
    const s = deps.state as {
      blocks: { x: number; w: number; y: number }[];
      current: { x: number; w: number; y: number };
    };
    deps.ctx.fillStyle = deps.theme.background;
    deps.ctx.fillRect(0, 0, deps.canvas.width, deps.canvas.height);

    s.blocks.forEach((b, i) => {
      deps.ctx.fillStyle = i === s.blocks.length - 1 ? deps.theme.primary : deps.theme.secondary + "cc";
      deps.ctx.fillRect(b.x, b.y, b.w, 20);
    });
    deps.ctx.fillStyle = deps.theme.accent;
    deps.ctx.fillRect(s.current.x, s.current.y, s.current.w, 20);

    deps.ctx.fillStyle = "#fff";
    deps.ctx.font = "16px sans-serif";
    deps.ctx.textAlign = "left";
    deps.ctx.fillText(`Score: ${deps.scoreRef.current}  Height: ${s.blocks.length}`, 16, 24);
    deps.ctx.font = "12px sans-serif";
    deps.ctx.fillStyle = "#ffffff88";
    deps.ctx.fillText("Tap to drop the block", 16, deps.canvas.height - 12);
  }

  return {
    init: initStack,
    update: updateStack,
    draw: drawStack,
  };
}
