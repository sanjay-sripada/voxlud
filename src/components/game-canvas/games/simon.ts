import type { GameDeps } from "@/components/game-canvas/types";

export function createSimonGame(deps: GameDeps) {
  // ─── SIMON ───
  const SIMON_COLORS = ["#ef4444", "#22c55e", "#3b82f6", "#eab308"];

  function initSimon() {
    deps.state = {
      sequence: [] as number[],
      inputIdx: 0,
      phase: "show" as "show" | "input",
      showIdx: 0,
      flashTimer: 0,
      flashOn: false,
      flashColor: -1,
      speed: (deps.settings.speed as number) || 650,
      padding: 40,
    };
    nextSimonRound();
  }

  function nextSimonRound() {
    const s = deps.state as {
      sequence: number[];
      inputIdx: number;
      phase: "show" | "input";
      showIdx: number;
      flashTimer: number;
      flashOn: boolean;
      flashColor: number;
      speed: number;
    };
    s.sequence.push(Math.floor(Math.random() * 4));
    s.inputIdx = 0;
    s.phase = "show";
    s.showIdx = 0;
    s.flashTimer = s.speed;
    s.flashOn = false;
    s.flashColor = -1;
  }

  function updateSimon() {
    const s = deps.state as {
      sequence: number[];
      inputIdx: number;
      phase: "show" | "input";
      showIdx: number;
      flashTimer: number;
      flashOn: boolean;
      flashColor: number;
      speed: number;
    };

    if (s.phase === "show") {
      s.flashTimer -= 16;
      if (s.flashTimer <= 0) {
        if (!s.flashOn) {
          s.flashOn = true;
          s.flashColor = s.sequence[s.showIdx];
          s.flashTimer = s.speed * 0.6;
        } else {
          s.flashOn = false;
          s.flashColor = -1;
          s.showIdx++;
          if (s.showIdx >= s.sequence.length) {
            s.phase = "input";
          } else {
            s.flashTimer = s.speed * 0.4;
          }
        }
      }
    }
  }

  function drawSimon() {
    const s = deps.state as {
      phase: "show" | "input";
      flashOn: boolean;
      flashColor: number;
      sequence: number[];
      padding: number;
    };
    deps.ctx.fillStyle = deps.theme.background;
    deps.ctx.fillRect(0, 0, deps.canvas.width, deps.canvas.height);

    const pad = s.padding;
    const w = (deps.canvas.width - pad * 3) / 2;
    const h = (deps.canvas.height - pad * 3 - 40) / 2;
    const positions = [
      [pad, pad],
      [pad * 2 + w, pad],
      [pad, pad * 2 + h],
      [pad * 2 + w, pad * 2 + h],
    ];

    positions.forEach(([x, y], i) => {
      const lit = s.flashOn && s.flashColor === i;
      deps.ctx.fillStyle = lit ? SIMON_COLORS[i] : SIMON_COLORS[i] + "55";
      deps.ctx.beginPath();
      deps.ctx.roundRect(x, y, w, h, 16);
      deps.ctx.fill();
    });

    deps.ctx.fillStyle = "#fff";
    deps.ctx.font = "16px sans-serif";
    deps.ctx.textAlign = "center";
    deps.ctx.fillText(`Round ${s.sequence.length}`, deps.canvas.width / 2, deps.canvas.height - 24);
    deps.ctx.font = "12px sans-serif";
    deps.ctx.fillStyle = "#ffffff88";
    deps.ctx.fillText(
      s.phase === "show" ? "Watch the sequence..." : "Repeat the pattern!",
      deps.canvas.width / 2,
      deps.canvas.height - 8
    );
  }

  function handleSimonTap(mx: number, my: number) {
    const s = deps.state as {
      phase: "show" | "input";
      sequence: number[];
      inputIdx: number;
      padding: number;
    };
    if (s.phase !== "input") return;

    const pad = s.padding;
    const w = (deps.canvas.width - pad * 3) / 2;
    const h = (deps.canvas.height - pad * 3 - 40) / 2;
    const regions = [
      { x: pad, y: pad },
      { x: pad * 2 + w, y: pad },
      { x: pad, y: pad * 2 + h },
      { x: pad * 2 + w, y: pad * 2 + h },
    ];

    let picked = -1;
    regions.forEach((r, i) => {
      if (mx >= r.x && mx <= r.x + w && my >= r.y && my <= r.y + h) picked = i;
    });
    if (picked < 0) return;

    if (picked !== s.sequence[s.inputIdx]) {
      deps.endGame(deps.scoreRef.current);
      return;
    }
    s.inputIdx++;
    deps.scoreRef.current += 5;
    deps.onScoreChange?.(deps.scoreRef.current);
    if (s.inputIdx >= s.sequence.length) nextSimonRound();
  }

  return {
    init: initSimon,
    update: updateSimon,
    draw: drawSimon,
    handleSimonTap: handleSimonTap,
  };
}
