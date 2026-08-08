import type { GameDeps } from "@/components/game-canvas/types";

export function createReactionGame(deps: GameDeps) {
  // ─── REACTION ───
  function initReaction() {
    const rounds = (deps.settings.rounds as number) || 5;
    deps.state = {
      phase: "wait" as "wait" | "go" | "early",
      timer: 0,
      waitTime: 0,
      round: 0,
      maxRounds: rounds,
      minDelay: (deps.settings.minDelay as number) || 800,
      lastMs: 0,
    };
    startReactionWait();
  }

  function startReactionWait() {
    const s = deps.state as {
      phase: "wait" | "go" | "early";
      timer: number;
      waitTime: number;
      round: number;
      maxRounds: number;
      minDelay: number;
    };
    if (s.round >= s.maxRounds) {
      deps.endGame(deps.scoreRef.current);
      return;
    }
    s.phase = "wait";
    s.waitTime = s.minDelay + Math.random() * 2000;
    s.timer = 0;
  }

  function updateReaction() {
    const s = deps.state as {
      phase: "wait" | "go" | "early";
      timer: number;
      waitTime: number;
      round: number;
      lastMs: number;
    };
    if (s.phase === "wait") {
      s.timer += 16;
      if (s.timer >= s.waitTime) s.phase = "go";
    } else       if (s.phase === "go") {
      s.lastMs += 16;
    }

    if (deps.keys.has(" ")) {
      handleReactionTap();
      deps.keys.delete(" ");
    }
  }

  function handleReactionTap() {
    const s = deps.state as {
      phase: "wait" | "go" | "early";
      round: number;
      lastMs: number;
      maxRounds: number;
    };
    if (s.phase === "wait") {
      deps.endGame(deps.scoreRef.current);
      return;
    }
    if (s.phase === "go") {
      const points = Math.max(10, 500 - s.lastMs);
      deps.scoreRef.current += points;
      deps.onScoreChange?.(deps.scoreRef.current);
      s.round++;
      startReactionWait();
    }
  }

  function drawReaction() {
    const s = deps.state as {
      phase: "wait" | "go" | "early";
      round: number;
      maxRounds: number;
      lastMs: number;
    };
    const colors = {
      wait: "#ef4444",
      go: "#22c55e",
      early: "#ef4444",
    };
    deps.ctx.fillStyle = colors[s.phase];
    deps.ctx.fillRect(0, 0, deps.canvas.width, deps.canvas.height);

    deps.ctx.fillStyle = "#fff";
    deps.ctx.font = "bold 28px sans-serif";
    deps.ctx.textAlign = "center";
    deps.ctx.textBaseline = "middle";
    if (s.phase === "wait") deps.ctx.fillText("Wait...", deps.canvas.width / 2, deps.canvas.height / 2 - 20);
    if (s.phase === "go") deps.ctx.fillText("TAP!", deps.canvas.width / 2, deps.canvas.height / 2 - 20);

    deps.ctx.font = "16px sans-serif";
    deps.ctx.fillText(`Score: ${deps.scoreRef.current}`, deps.canvas.width / 2, deps.canvas.height / 2 + 30);
    deps.ctx.font = "13px sans-serif";
    deps.ctx.fillStyle = "#ffffffcc";
    deps.ctx.fillText(`Round ${Math.min(s.round + 1, s.maxRounds)} / ${s.maxRounds}`, deps.canvas.width / 2, 40);
    if (s.phase === "go") deps.ctx.fillText(`${s.lastMs}ms`, deps.canvas.width / 2, deps.canvas.height / 2 + 60);
  }

  return {
    init: initReaction,
    update: updateReaction,
    draw: drawReaction,
    handleReactionTap: handleReactionTap,
  };
}
