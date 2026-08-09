import type { GameDeps } from "@/components/game-canvas/types";

interface Bumper {
  x: number;
  y: number;
  r: number;
}

export function createPinballGame(deps: GameDeps) {
  function initPinball() {
    const w = deps.canvas.width;
    const h = deps.canvas.height;
    const bumperCount = (deps.settings.bumpers as number) || 5;
    const bumpers: Bumper[] = [];
    for (let i = 0; i < bumperCount; i++) {
      bumpers.push({
        x: w * 0.2 + Math.random() * w * 0.6,
        y: h * 0.25 + Math.random() * h * 0.35,
        r: 16 + Math.random() * 10,
      });
    }

    deps.state = {
      ball: { x: w / 2, y: h - 80, vx: 2.5, vy: -6, r: 10 },
      leftFlipper: { x: w * 0.3, y: h - 36, angle: 0.4, active: false },
      rightFlipper: { x: w * 0.7, y: h - 36, angle: -0.4, active: false },
      bumpers,
      lives: (deps.settings.lives as number) || 3,
      ballSpeed: (deps.settings.ballSpeed as number) || 1,
    };
  }

  function launchBall(ball: { x: number; y: number; vx: number; vy: number; r: number }, speed: number) {
    const w = deps.canvas.width;
    const h = deps.canvas.height;
    ball.x = w / 2;
    ball.y = h - 80;
    ball.vx = (Math.random() - 0.5) * 3 * speed;
    ball.vy = -7 * speed;
  }

  function updatePinball() {
    const s = deps.state as {
      ball: { x: number; y: number; vx: number; vy: number; r: number };
      leftFlipper: { x: number; y: number; angle: number; active: boolean };
      rightFlipper: { x: number; y: number; angle: number; active: boolean };
      bumpers: Bumper[];
      lives: number;
      ballSpeed: number;
    };

    const w = deps.canvas.width;
    const h = deps.canvas.height;
    const ball = s.ball;
    const speed = s.ballSpeed;

    s.leftFlipper.active = deps.keys.has("a") || deps.keys.has("arrowleft") || deps.touch.pointerX !== null && deps.touch.pointerX < w / 2;
    s.rightFlipper.active = deps.keys.has("d") || deps.keys.has("arrowright") || deps.touch.pointerX !== null && deps.touch.pointerX >= w / 2;

    if (deps.touch.actionTap) {
      if (deps.touch.pointerX !== null && deps.touch.pointerX < w / 2) s.leftFlipper.active = true;
      else s.rightFlipper.active = true;
      deps.touch.actionTap = false;
    }

    ball.vy += 0.18 * speed;
    ball.x += ball.vx * speed;
    ball.y += ball.vy * speed;

    if (ball.x - ball.r < 0) {
      ball.x = ball.r;
      ball.vx = Math.abs(ball.vx);
    }
    if (ball.x + ball.r > w) {
      ball.x = w - ball.r;
      ball.vx = -Math.abs(ball.vx);
    }
    if (ball.y - ball.r < 0) {
      ball.y = ball.r;
      ball.vy = Math.abs(ball.vy);
    }

    for (const b of s.bumpers) {
      const dist = Math.hypot(ball.x - b.x, ball.y - b.y);
      if (dist < ball.r + b.r) {
        const angle = Math.atan2(ball.y - b.y, ball.x - b.x);
        ball.vx = Math.cos(angle) * 5 * speed;
        ball.vy = Math.sin(angle) * 5 * speed;
        deps.scoreRef.current += 25;
        deps.onScoreChange?.(deps.scoreRef.current);
      }
    }

    const flipperLen = 50;
    for (const flip of [s.leftFlipper, s.rightFlipper]) {
      const targetAngle = flip.active ? (flip === s.leftFlipper ? -0.8 : 0.8) : flip === s.leftFlipper ? 0.4 : -0.4;
      flip.angle += (targetAngle - flip.angle) * 0.35;
      const fx = flip.x + Math.cos(flip.angle) * flipperLen;
      const fy = flip.y + Math.sin(flip.angle) * flipperLen;
      const dist = Math.hypot(ball.x - fx, ball.y - fy);
      if (dist < ball.r + 8 && ball.y > flip.y - 20) {
        ball.vy = -Math.abs(ball.vy) - 3 * speed;
        ball.vx += flip === s.leftFlipper ? -2 : 2;
      }
    }

    if (ball.y > h + 20) {
      s.lives--;
      if (s.lives <= 0) {
        deps.endGame(deps.scoreRef.current);
      } else {
        launchBall(ball, speed);
      }
    }
  }

  function drawPinball() {
    const s = deps.state as {
      ball: { x: number; y: number; r: number };
      leftFlipper: { x: number; y: number; angle: number };
      rightFlipper: { x: number; y: number; angle: number };
      bumpers: Bumper[];
      lives: number;
    };

    deps.ctx.fillStyle = deps.theme.background;
    deps.ctx.fillRect(0, 0, deps.canvas.width, deps.canvas.height);

    deps.ctx.strokeStyle = deps.theme.secondary;
    deps.ctx.lineWidth = 3;
    deps.ctx.strokeRect(8, 8, deps.canvas.width - 16, deps.canvas.height - 16);

    for (const b of s.bumpers) {
      deps.ctx.beginPath();
      deps.ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      deps.ctx.fillStyle = deps.theme.accent + "88";
      deps.ctx.fill();
      deps.ctx.strokeStyle = deps.theme.accent;
      deps.ctx.lineWidth = 2;
      deps.ctx.stroke();
    }

    const flipperLen = 50;
    for (const flip of [s.leftFlipper, s.rightFlipper]) {
      deps.ctx.strokeStyle = deps.theme.primary;
      deps.ctx.lineWidth = 8;
      deps.ctx.lineCap = "round";
      deps.ctx.beginPath();
      deps.ctx.moveTo(flip.x, flip.y);
      deps.ctx.lineTo(
        flip.x + Math.cos(flip.angle) * flipperLen,
        flip.y + Math.sin(flip.angle) * flipperLen
      );
      deps.ctx.stroke();
    }

    const ball = s.ball;
    deps.ctx.beginPath();
    deps.ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
    deps.ctx.fillStyle = deps.theme.primary;
    deps.ctx.fill();

    deps.ctx.fillStyle = "#fff";
    deps.ctx.font = "16px sans-serif";
    deps.ctx.textAlign = "left";
    deps.ctx.fillText(`Score: ${deps.scoreRef.current}`, 16, 28);
    deps.ctx.fillText(`Lives: ${s.lives}`, 16, 50);

    deps.ctx.font = "12px sans-serif";
    deps.ctx.fillStyle = "#ffffff88";
    deps.ctx.textAlign = "center";
    deps.ctx.fillText("Tap left/right or use A/D to flip!", deps.canvas.width / 2, deps.canvas.height - 14);
  }

  return {
    init: initPinball,
    update: updatePinball,
    draw: drawPinball,
  };
}
