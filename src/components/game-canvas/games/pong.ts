import type { GameDeps } from "@/components/game-canvas/types";
import type { PongSyncState } from "@/types/online-game";

export function createPongGame(deps: GameDeps) {
  // ─── PONG ───
  function initPong() {
    const speed = (deps.settings.speed as number) || 1;
    const shrink = deps.settings.shrinkPaddles as boolean;
    deps.state = {
      ball: { x: deps.canvas.width / 2, y: deps.canvas.height / 2, vx: 4 * speed, vy: 3 * speed, r: 8 * ((deps.settings.ballSize as number) || 1) },
      p1: { y: deps.canvas.height / 2, h: 80, w: 12, score: 0 },
      p2: { y: deps.canvas.height / 2, h: 80, w: 12, score: 0 },
      shrink,
      speed,
    };
  }

  function updatePong() {
    const online = deps.onlineSessionRef?.current;
    const s = deps.state as {
      ball: { x: number; y: number; vx: number; vy: number; r: number };
      p1: { y: number; h: number; w: number; score: number };
      p2: { y: number; h: number; w: number; score: number };
      shrink: boolean;
    };

    if (deps.isOnline && online?.role === "guest") {
      if (online.remoteState) {
        s.ball = { ...online.remoteState.ball };
        s.p1 = { ...online.remoteState.p1 };
        s.p2 = { ...online.remoteState.p2 };
      }

      const keys = deps.keys;
      if (keys.has("i") || keys.has("arrowup")) {
        s.p2.y = Math.max(s.p2.h / 2, s.p2.y - 6);
      }
      if (keys.has("k") || keys.has("arrowdown")) {
        s.p2.y = Math.min(deps.canvas.height - s.p2.h / 2, s.p2.y + 6);
      }

      const now = performance.now();
      if (now - deps.lastGuestPaddleSent > 33) {
        online.sendPaddleY?.(s.p2.y);
        deps.lastGuestPaddleSent = now;
      }
      return;
    }

    const { ball, p1, p2, shrink } = s;

    ball.x += ball.vx;
    ball.y += ball.vy;

    if (ball.y - ball.r < 0 || ball.y + ball.r > deps.canvas.height) ball.vy *= -1;

    const p1x = 20;
    const p2x = deps.canvas.width - 20 - p2.w;

    if (ball.x - ball.r < p1x + p1.w && ball.y > p1.y - p1.h / 2 && ball.y < p1.y + p1.h / 2) {
      ball.vx = Math.abs(ball.vx);
      ball.vy += (ball.y - p1.y) * 0.1;
    }
    if (ball.x + ball.r > p2x && ball.y > p2.y - p2.h / 2 && ball.y < p2.y + p2.h / 2) {
      ball.vx = -Math.abs(ball.vx);
      ball.vy += (ball.y - p2.y) * 0.1;
    }

    if (ball.x < 0) {
      p2.score++;
      if (shrink) p1.h = Math.max(30, p1.h - 8);
      resetBall();
      if (p2.score >= 5) deps.endGame(p2.score);
    }
    if (ball.x > deps.canvas.width) {
      p1.score++;
      if (shrink) p2.h = Math.max(30, p2.h - 8);
      resetBall();
      if (p1.score >= 5) deps.endGame(p1.score);
    }

    const keys = deps.keys;
    if (keys.has("w") || keys.has("arrowup")) p1.y = Math.max(p1.h / 2, p1.y - 6);
    if (keys.has("s") || keys.has("arrowdown")) p1.y = Math.min(deps.canvas.height - p1.h / 2, p1.y + 6);
    if (deps.touch.pointerY !== null) {
      p1.y = Math.max(p1.h / 2, Math.min(deps.canvas.height - p1.h / 2, deps.touch.pointerY));
    }
    if (deps.isMulti) {
      if (deps.isOnline) {
        if (online?.role === "host") {
          if (online.remoteP2Y != null) {
            p2.y = online.remoteP2Y;
          } else {
            p2.y += (ball.y - p2.y) * 0.05;
          }
        }
      } else {
        if (keys.has("arrowup") && !keys.has("w")) p1.y = Math.max(p1.h / 2, p1.y - 6);
        if (keys.has("i")) p2.y = Math.max(p2.h / 2, p2.y - 6);
        if (keys.has("k")) p2.y = Math.min(deps.canvas.height - p2.h / 2, p2.y + 6);
      }
    } else {
      p2.y += (ball.y - p2.y) * 0.08;
    }

    if (deps.isOnline && online?.role === "host" && online.connected) {
      deps.syncFrame += 1;
      if (deps.syncFrame % 2 === 0) {
        const payload: PongSyncState = {
          ball: { ...ball },
          p1: { ...p1 },
          p2: { ...p2 },
        };
        online.broadcastState?.(payload);
      }
    }
  }

  function resetBall() {
    const s = deps.state as { ball: { x: number; y: number; vx: number; vy: number; r: number }; speed: number };
    s.ball = {
      x: deps.canvas.width / 2,
      y: deps.canvas.height / 2,
      vx: (Math.random() > 0.5 ? 1 : -1) * 4 * s.speed,
      vy: (Math.random() - 0.5) * 6 * s.speed,
      r: s.ball.r,
    };
  }

  function drawPong() {
    const s = deps.state as {
      ball: { x: number; y: number; r: number };
      p1: { y: number; h: number; w: number; score: number };
      p2: { y: number; h: number; w: number; score: number };
    };
    deps.ctx.fillStyle = deps.theme.background;
    deps.ctx.fillRect(0, 0, deps.canvas.width, deps.canvas.height);

    deps.ctx.setLineDash([8, 8]);
    deps.ctx.strokeStyle = deps.theme.secondary + "44";
    deps.ctx.beginPath();
    deps.ctx.moveTo(deps.canvas.width / 2, 0);
    deps.ctx.lineTo(deps.canvas.width / 2, deps.canvas.height);
    deps.ctx.stroke();
    deps.ctx.setLineDash([]);

    deps.ctx.fillStyle = deps.theme.primary;
    deps.ctx.fillRect(20, s.p1.y - s.p1.h / 2, s.p1.w, s.p1.h);
    deps.ctx.fillRect(deps.canvas.width - 20 - s.p2.w, s.p2.y - s.p2.h / 2, s.p2.w, s.p2.h);

    deps.ctx.beginPath();
    deps.ctx.arc(s.ball.x, s.ball.y, s.ball.r, 0, Math.PI * 2);
    deps.ctx.fillStyle = deps.theme.accent;
    deps.ctx.fill();

    deps.ctx.fillStyle = "#fff";
    deps.ctx.font = "bold 48px sans-serif";
    deps.ctx.textAlign = "center";
    deps.ctx.fillText(String(s.p1.score), deps.canvas.width / 4, 60);
    deps.ctx.fillText(String(s.p2.score), (deps.canvas.width * 3) / 4, 60);
  }

  return {
    init: initPong,
    update: updatePong,
    draw: drawPong,
  };
}
