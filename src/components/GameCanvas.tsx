"use client";

import { useEffect, useRef, useCallback } from "react";
import type { GameConfig } from "@/types/game";

interface GameCanvasProps {
  config: GameConfig;
  active?: boolean;
  onScoreChange?: (score: number) => void;
  onGameOver?: (score: number) => void;
}

export default function GameCanvas({
  config,
  active = true,
  onScoreChange,
  onGameOver,
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<Record<string, unknown>>({});
  const animRef = useRef<number>(0);
  const keysRef = useRef<Set<string>>(new Set());
  const touchRef = useRef({
    pointerY: null as number | null,
    pointerX: null as number | null,
    pendingDir: null as { x: number; y: number } | null,
    actionTap: false,
  });

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    keysRef.current.add(e.key.toLowerCase());
  }, []);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    keysRef.current.delete(e.key.toLowerCase());
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  useEffect(() => {
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;

    const ctxRaw = canvasEl.getContext("2d");
    if (!ctxRaw) return;

    const canvas: HTMLCanvasElement = canvasEl;
    const ctx: CanvasRenderingContext2D = ctxRaw;

    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (rect) {
        canvas.width = rect.width;
        canvas.height = rect.height;
      }
    };
    resize();
    window.addEventListener("resize", resize);

    const { theme, settings, mode } = config;
    const isMulti = mode === "local-multiplayer";

    let score = 0;
    let gameOver = false;

    const initGame = () => {
      switch (config.type) {
        case "pong":
          initPong();
          break;
        case "snake":
          initSnake();
          break;
        case "breakout":
          initBreakout();
          break;
        case "runner":
          initRunner();
          break;
        case "clicker":
          initClicker();
          break;
        case "flappy":
          initFlappy();
          break;
        case "shooter":
          initShooter();
          break;
        case "tetris":
          initTetris();
          break;
        case "memory":
          initMemory();
          break;
        case "whack":
          initWhack();
          break;
        case "dodge":
          initDodge();
          break;
        case "slide":
          initSlide();
          break;
        case "catch":
          initCatch();
          break;
        case "cross":
          initCross();
          break;
        case "stack":
          initStack();
          break;
        case "simon":
          initSimon();
          break;
        case "reaction":
          initReaction();
          break;
      }
    };

    // ─── PONG ───
    function initPong() {
      const speed = (settings.speed as number) || 1;
      const shrink = settings.shrinkPaddles as boolean;
      stateRef.current = {
        ball: { x: canvas.width / 2, y: canvas.height / 2, vx: 4 * speed, vy: 3 * speed, r: 8 * ((settings.ballSize as number) || 1) },
        p1: { y: canvas.height / 2, h: 80, w: 12, score: 0 },
        p2: { y: canvas.height / 2, h: 80, w: 12, score: 0 },
        shrink,
        speed,
      };
    }

    function updatePong() {
      const s = stateRef.current as {
        ball: { x: number; y: number; vx: number; vy: number; r: number };
        p1: { y: number; h: number; w: number; score: number };
        p2: { y: number; h: number; w: number; score: number };
        shrink: boolean;
      };
      const { ball, p1, p2, shrink } = s;

      ball.x += ball.vx;
      ball.y += ball.vy;

      if (ball.y - ball.r < 0 || ball.y + ball.r > canvas.height) ball.vy *= -1;

      const p1x = 20;
      const p2x = canvas.width - 20 - p2.w;

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
        if (p2.score >= 5) endGame(p2.score);
      }
      if (ball.x > canvas.width) {
        p1.score++;
        if (shrink) p2.h = Math.max(30, p2.h - 8);
        resetBall();
        if (p1.score >= 5) endGame(p1.score);
      }

      const keys = keysRef.current;
      if (keys.has("w") || keys.has("arrowup")) p1.y = Math.max(p1.h / 2, p1.y - 6);
      if (keys.has("s") || keys.has("arrowdown")) p1.y = Math.min(canvas.height - p1.h / 2, p1.y + 6);
      if (touchRef.current.pointerY !== null) {
        p1.y = Math.max(p1.h / 2, Math.min(canvas.height - p1.h / 2, touchRef.current.pointerY));
      }
      if (isMulti) {
        if (keys.has("arrowup") && !keys.has("w")) p1.y = Math.max(p1.h / 2, p1.y - 6);
        if (keys.has("i")) p2.y = Math.max(p2.h / 2, p2.y - 6);
        if (keys.has("k")) p2.y = Math.min(canvas.height - p2.h / 2, p2.y + 6);
      } else {
        p2.y += (ball.y - p2.y) * 0.08;
      }
    }

    function resetBall() {
      const s = stateRef.current as { ball: { x: number; y: number; vx: number; vy: number; r: number }; speed: number };
      s.ball = {
        x: canvas.width / 2,
        y: canvas.height / 2,
        vx: (Math.random() > 0.5 ? 1 : -1) * 4 * s.speed,
        vy: (Math.random() - 0.5) * 6 * s.speed,
        r: s.ball.r,
      };
    }

    function drawPong() {
      const s = stateRef.current as {
        ball: { x: number; y: number; r: number };
        p1: { y: number; h: number; w: number; score: number };
        p2: { y: number; h: number; w: number; score: number };
      };
      ctx.fillStyle = theme.background;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.setLineDash([8, 8]);
      ctx.strokeStyle = theme.secondary + "44";
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2, 0);
      ctx.lineTo(canvas.width / 2, canvas.height);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = theme.primary;
      ctx.fillRect(20, s.p1.y - s.p1.h / 2, s.p1.w, s.p1.h);
      ctx.fillRect(canvas.width - 20 - s.p2.w, s.p2.y - s.p2.h / 2, s.p2.w, s.p2.h);

      ctx.beginPath();
      ctx.arc(s.ball.x, s.ball.y, s.ball.r, 0, Math.PI * 2);
      ctx.fillStyle = theme.accent;
      ctx.fill();

      ctx.fillStyle = "#fff";
      ctx.font = "bold 48px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(String(s.p1.score), canvas.width / 4, 60);
      ctx.fillText(String(s.p2.score), (canvas.width * 3) / 4, 60);
    }

    // ─── SNAKE ───
    function initSnake() {
      const gridSize = (settings.gridSize as number) || 16;
      const cellSize = Math.min(canvas.width, canvas.height) / gridSize;
      stateRef.current = {
        gridSize,
        cellSize,
        snake: [{ x: 5, y: 5 }],
        dir: { x: 1, y: 0 },
        food: { x: 10, y: 10, color: theme.accent },
        colors: [theme.primary, theme.secondary, theme.accent, "#fbbf24"],
        moveTimer: 0,
        moveInterval: (settings.speed as number) || 150,
        colorMatch: settings.colorMatch as boolean,
      };
    }

    function updateSnake() {
      const s = stateRef.current as {
        snake: { x: number; y: number }[];
        dir: { x: number; y: number };
        food: { x: number; y: number; color: string };
        gridSize: number;
        colors: string[];
        moveTimer: number;
        moveInterval: number;
      };
      const keys = keysRef.current;
      if (keys.has("arrowup") || keys.has("w")) s.dir = { x: 0, y: -1 };
      if (keys.has("arrowdown") || keys.has("s")) s.dir = { x: 0, y: 1 };
      if (keys.has("arrowleft") || keys.has("a")) s.dir = { x: -1, y: 0 };
      if (keys.has("arrowright") || keys.has("d")) s.dir = { x: 1, y: 0 };

      if (touchRef.current.pendingDir) {
        const next = touchRef.current.pendingDir;
        const reversing =
          (next.x !== 0 && next.x === -s.dir.x) || (next.y !== 0 && next.y === -s.dir.y);
        if (!reversing) s.dir = next;
        touchRef.current.pendingDir = null;
      }

      s.moveTimer += 16;
      if (s.moveTimer < s.moveInterval) return;
      s.moveTimer = 0;

      const head = { x: s.snake[0].x + s.dir.x, y: s.snake[0].y + s.dir.y };
      if (head.x < 0 || head.x >= s.gridSize || head.y < 0 || head.y >= s.gridSize) {
        endGame(score);
        return;
      }
      if (s.snake.some((seg) => seg.x === head.x && seg.y === head.y)) {
        endGame(score);
        return;
      }

      s.snake.unshift(head);
      if (head.x === s.food.x && head.y === s.food.y) {
        score += 10;
        onScoreChange?.(score);
        s.food = {
          x: Math.floor(Math.random() * s.gridSize),
          y: Math.floor(Math.random() * s.gridSize),
          color: s.colors[Math.floor(Math.random() * s.colors.length)],
        };
      } else {
        s.snake.pop();
      }
    }

    function drawSnake() {
      const s = stateRef.current as {
        snake: { x: number; y: number }[];
        food: { x: number; y: number; color: string };
        cellSize: number;
        gridSize: number;
        colors: string[];
      };
      const offsetX = (canvas.width - s.gridSize * s.cellSize) / 2;
      const offsetY = (canvas.height - s.gridSize * s.cellSize) / 2;

      ctx.fillStyle = theme.background;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      s.snake.forEach((seg, i) => {
        ctx.fillStyle = i === 0 ? theme.primary : theme.secondary;
        ctx.fillRect(offsetX + seg.x * s.cellSize + 1, offsetY + seg.y * s.cellSize + 1, s.cellSize - 2, s.cellSize - 2);
      });

      ctx.fillStyle = s.food.color;
      ctx.beginPath();
      ctx.arc(
        offsetX + s.food.x * s.cellSize + s.cellSize / 2,
        offsetY + s.food.y * s.cellSize + s.cellSize / 2,
        s.cellSize / 2 - 2,
        0,
        Math.PI * 2
      );
      ctx.fill();

      ctx.fillStyle = "#fff";
      ctx.font = "16px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(`Score: ${score}`, 16, 30);
    }

    // ─── BREAKOUT ───
    function initBreakout() {
      const rows = (settings.rows as number) || 5;
      const cols = 8;
      const brickW = canvas.width / cols - 4;
      const bricks: { x: number; y: number; w: number; h: number; alive: boolean; color: string }[] = [];
      const colors = [theme.primary, theme.secondary, theme.accent, "#fbbf24", "#34d399"];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          bricks.push({
            x: c * (brickW + 4) + 2,
            y: r * 28 + 40,
            w: brickW,
            h: 24,
            alive: true,
            color: colors[r % colors.length],
          });
        }
      }
      stateRef.current = {
        ball: { x: canvas.width / 2, y: canvas.height - 80, vx: 3, vy: -3, r: 6 },
        paddle: { x: canvas.width / 2, w: 80, h: 12 },
        bricks,
        lives: (settings.lives as number) || 3,
      };
    }

    function updateBreakout() {
      const s = stateRef.current as {
        ball: { x: number; y: number; vx: number; vy: number; r: number };
        paddle: { x: number; w: number; h: number };
        bricks: { x: number; y: number; w: number; h: number; alive: boolean }[];
        lives: number;
      };
      const keys = keysRef.current;
      if (keys.has("arrowleft") || keys.has("a")) s.paddle.x = Math.max(s.paddle.w / 2, s.paddle.x - 7);
      if (keys.has("arrowright") || keys.has("d")) s.paddle.x = Math.min(canvas.width - s.paddle.w / 2, s.paddle.x + 7);
      if (touchRef.current.pointerX !== null) {
        s.paddle.x = Math.max(
          s.paddle.w / 2,
          Math.min(canvas.width - s.paddle.w / 2, touchRef.current.pointerX)
        );
      }

      s.ball.x += s.ball.vx;
      s.ball.y += s.ball.vy;

      if (s.ball.x - s.ball.r < 0 || s.ball.x + s.ball.r > canvas.width) s.ball.vx *= -1;
      if (s.ball.y - s.ball.r < 0) s.ball.vy *= -1;

      const py = canvas.height - 30;
      if (
        s.ball.y + s.ball.r > py &&
        s.ball.y - s.ball.r < py + s.paddle.h &&
        s.ball.x > s.paddle.x - s.paddle.w / 2 &&
        s.ball.x < s.paddle.x + s.paddle.w / 2
      ) {
        s.ball.vy = -Math.abs(s.ball.vy);
        s.ball.vx += (s.ball.x - s.paddle.x) * 0.05;
      }

      if (s.ball.y > canvas.height) {
        s.lives--;
        if (s.lives <= 0) {
          endGame(score);
          return;
        }
        s.ball = { x: canvas.width / 2, y: canvas.height - 80, vx: 3, vy: -3, r: 6 };
      }

      s.bricks.forEach((b) => {
        if (!b.alive) return;
        if (
          s.ball.x + s.ball.r > b.x &&
          s.ball.x - s.ball.r < b.x + b.w &&
          s.ball.y + s.ball.r > b.y &&
          s.ball.y - s.ball.r < b.y + b.h
        ) {
          b.alive = false;
          s.ball.vy *= -1;
          score += 10;
          onScoreChange?.(score);
        }
      });

      if (s.bricks.every((b) => !b.alive)) endGame(score);
    }

    function drawBreakout() {
      const s = stateRef.current as {
        ball: { x: number; y: number; r: number };
        paddle: { x: number; w: number; h: number };
        bricks: { x: number; y: number; w: number; h: number; alive: boolean; color: string }[];
        lives: number;
      };
      ctx.fillStyle = theme.background;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      s.bricks.forEach((b) => {
        if (!b.alive) return;
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.roundRect(b.x, b.y, b.w, b.h, 4);
        ctx.fill();
      });

      ctx.fillStyle = theme.primary;
      ctx.fillRect(s.paddle.x - s.paddle.w / 2, canvas.height - 30, s.paddle.w, s.paddle.h);

      ctx.beginPath();
      ctx.arc(s.ball.x, s.ball.y, s.ball.r, 0, Math.PI * 2);
      ctx.fillStyle = theme.accent;
      ctx.fill();

      ctx.fillStyle = "#fff";
      ctx.font = "16px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(`Score: ${score}  Lives: ${s.lives}`, 16, 24);
    }

    // ─── RUNNER ───
    function initRunner() {
      stateRef.current = {
        player: { y: canvas.height / 2, vy: 0, r: 16, grounded: true },
        obstacles: [] as { x: number; y: number; w: number; h: number }[],
        gravityFlip: settings.gravityFlip as boolean,
        gravity: 1,
        speed: 4 * ((settings.obstacleSpeed as number) || 1.2),
        spawnTimer: 0,
        spawnInterval: 90,
      };
    }

    function updateRunner() {
      const s = stateRef.current as {
        player: { y: number; vy: number; r: number; grounded: boolean };
        obstacles: { x: number; y: number; w: number; h: number }[];
        gravityFlip: boolean;
        gravity: number;
        speed: number;
        spawnTimer: number;
        spawnInterval: number;
      };

      if (s.gravityFlip) {
        const keys = keysRef.current;
        if (keys.has(" ") || keys.has("arrowup") || keys.has("w") || touchRef.current.actionTap) {
          s.gravity *= -1;
          keysRef.current.delete(" ");
          keysRef.current.delete("arrowup");
          keysRef.current.delete("w");
          touchRef.current.actionTap = false;
        }
      } else {
        const keys = keysRef.current;
        if (
          (keys.has(" ") || keys.has("arrowup") || keys.has("w") || touchRef.current.actionTap) &&
          s.player.grounded
        ) {
          s.player.vy = -12;
          s.player.grounded = false;
          touchRef.current.actionTap = false;
        }
      }

      s.player.vy += 0.6 * s.gravity;
      s.player.y += s.player.vy;

      const ground = canvas.height - 60;
      const ceiling = 60;
      if (s.gravityFlip) {
        if (s.player.y + s.player.r > ground) {
          s.player.y = ground - s.player.r;
          s.player.vy = 0;
        }
        if (s.player.y - s.player.r < ceiling) {
          s.player.y = ceiling + s.player.r;
          s.player.vy = 0;
        }
      } else {
        if (s.player.y + s.player.r >= ground) {
          s.player.y = ground - s.player.r;
          s.player.vy = 0;
          s.player.grounded = true;
        }
      }

      s.spawnTimer++;
      if (s.spawnTimer >= s.spawnInterval) {
        s.spawnTimer = 0;
        const h = 30 + Math.random() * 50;
        s.obstacles.push({
          x: canvas.width,
          y: s.gravityFlip ? (Math.random() > 0.5 ? ground - h : ceiling) : ground - h,
          w: 20,
          h,
        });
      }

      s.obstacles.forEach((o) => (o.x -= s.speed));
      s.obstacles = s.obstacles.filter((o) => o.x + o.w > 0);

      score = Math.floor(score + 0.1);
      onScoreChange?.(score);

      const p = s.player;
      const px = 80;
      for (const o of s.obstacles) {
        if (px + p.r > o.x && px - p.r < o.x + o.w && p.y + p.r > o.y && p.y - p.r < o.y + o.h) {
          endGame(score);
          return;
        }
      }
    }

    function drawRunner() {
      const s = stateRef.current as {
        player: { y: number; r: number };
        obstacles: { x: number; y: number; w: number; h: number }[];
        gravityFlip: boolean;
      };
      ctx.fillStyle = theme.background;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const ground = canvas.height - 60;
      ctx.fillStyle = theme.secondary + "33";
      ctx.fillRect(0, ground, canvas.width, 60);
      ctx.fillRect(0, 0, canvas.width, 60);

      ctx.fillStyle = theme.primary;
      ctx.beginPath();
      ctx.arc(80, s.player.y, s.player.r, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = theme.accent;
      s.obstacles.forEach((o) => ctx.fillRect(o.x, o.y, o.w, o.h));

      ctx.fillStyle = "#fff";
      ctx.font = "16px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(`Score: ${score}`, 16, 30);
      ctx.font = "12px sans-serif";
      ctx.fillStyle = "#ffffff88";
      ctx.fillText(s.gravityFlip ? "Tap/Space to flip gravity" : "Space/Up to jump", 16, canvas.height - 16);
    }

    // ─── CLICKER ───
    function initClicker() {
      stateRef.current = {
        coins: 0,
        perClick: 1,
        perSecond: 0,
        upgrades: [
          { name: "Better Tap", cost: 10, level: 0, effect: "click" },
          { name: "Auto Worker", cost: 50, level: 0, effect: "auto" },
          { name: "Mega Boost", cost: 200, level: 0, effect: "click" },
        ],
        clickAnim: 0,
        theme: settings.theme as string,
      };
    }

    function updateClicker() {
      const s = stateRef.current as {
        coins: number;
        perSecond: number;
        clickAnim: number;
      };
      s.coins += s.perSecond / 60;
      score = Math.floor(s.coins);
      onScoreChange?.(score);
      if (s.clickAnim > 0) s.clickAnim -= 0.05;
    }

    function drawClicker() {
      const s = stateRef.current as {
        coins: number;
        perClick: number;
        perSecond: number;
        upgrades: { name: string; cost: number; level: number; effect: string }[];
        clickAnim: number;
        theme: string;
      };

      ctx.fillStyle = theme.background;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width / 2;
      const cy = canvas.height / 2 - 40;
      const scale = 1 + s.clickAnim * 0.2;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(scale, scale);
      ctx.fillStyle = theme.primary;
      ctx.beginPath();
      ctx.arc(0, 0, 60, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = "bold 24px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(s.theme === "cafe" ? "☕" : "🪙", 0, 0);
      ctx.restore();

      ctx.fillStyle = "#fff";
      ctx.font = "bold 28px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`${Math.floor(s.coins)} coins`, cx, cy + 100);
      ctx.font = "14px sans-serif";
      ctx.fillStyle = "#ffffff88";
      ctx.fillText(`+${s.perClick}/click  +${s.perSecond.toFixed(1)}/sec`, cx, cy + 130);

      s.upgrades.forEach((u, i) => {
        const y = canvas.height - 120 + i * 36;
        const canBuy = s.coins >= u.cost;
        ctx.fillStyle = canBuy ? theme.secondary + "44" : "#ffffff11";
        ctx.beginPath();
        ctx.roundRect(20, y, canvas.width - 40, 30, 6);
        ctx.fill();
        ctx.fillStyle = canBuy ? "#fff" : "#ffffff66";
        ctx.font = "13px sans-serif";
        ctx.textAlign = "left";
        ctx.fillText(`${u.name} (Lv.${u.level}) — ${u.cost}`, 32, y + 20);
      });

      ctx.fillStyle = "#ffffff66";
      ctx.font = "12px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Tap circle & upgrades! Press 1/2/3 on desktop", cx, canvas.height - 16);
    }

    // ─── FLAPPY ───
    function initFlappy() {
      stateRef.current = {
        bird: { x: canvas.width * 0.25, y: canvas.height / 2, vy: 0, r: 14 },
        pipes: [] as { x: number; gapY: number; gapH: number; scored: boolean }[],
        pipeGap: (settings.pipeGap as number) || 160,
        pipeW: 52,
        gravity: (settings.gravity as number) || 0.5,
        pipeSpeed: (settings.pipeSpeed as number) || 2.8,
        spawnTimer: 0,
        spawnInterval: 90,
      };
    }

    function updateFlappy() {
      const s = stateRef.current as {
        bird: { x: number; y: number; vy: number; r: number };
        pipes: { x: number; gapY: number; gapH: number; scored: boolean }[];
        pipeGap: number;
        pipeW: number;
        gravity: number;
        pipeSpeed: number;
        spawnTimer: number;
        spawnInterval: number;
      };
      const keys = keysRef.current;
      if (keys.has(" ") || keys.has("arrowup") || keys.has("w") || touchRef.current.actionTap) {
        s.bird.vy = -8;
        keysRef.current.delete(" ");
        keysRef.current.delete("arrowup");
        keysRef.current.delete("w");
        touchRef.current.actionTap = false;
      }

      s.bird.vy += s.gravity;
      s.bird.y += s.bird.vy;

      if (s.bird.y - s.bird.r < 0 || s.bird.y + s.bird.r > canvas.height) {
        endGame(score);
        return;
      }

      s.spawnTimer++;
      if (s.spawnTimer >= s.spawnInterval) {
        s.spawnTimer = 0;
        const gapH = s.pipeGap;
        const gapY = 80 + Math.random() * (canvas.height - gapH - 160);
        s.pipes.push({ x: canvas.width, gapY, gapH, scored: false });
      }

      s.pipes.forEach((p) => (p.x -= s.pipeSpeed));
      s.pipes = s.pipes.filter((p) => p.x + s.pipeW > -20);

      const b = s.bird;
      for (const p of s.pipes) {
        if (!p.scored && p.x + s.pipeW < b.x) {
          p.scored = true;
          score++;
          onScoreChange?.(score);
        }
        const hitPipe =
          b.x + b.r > p.x &&
          b.x - b.r < p.x + s.pipeW &&
          (b.y - b.r < p.gapY || b.y + b.r > p.gapY + p.gapH);
        if (hitPipe) {
          endGame(score);
          return;
        }
      }
    }

    function drawFlappy() {
      const s = stateRef.current as {
        bird: { x: number; y: number; r: number };
        pipes: { x: number; gapY: number; gapH: number }[];
        pipeW: number;
      };
      ctx.fillStyle = theme.background;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = theme.secondary + "55";
      s.pipes.forEach((p) => {
        ctx.fillRect(p.x, 0, s.pipeW, p.gapY);
        ctx.fillRect(p.x, p.gapY + p.gapH, s.pipeW, canvas.height - p.gapY - p.gapH);
      });

      ctx.fillStyle = theme.primary;
      ctx.beginPath();
      ctx.arc(s.bird.x, s.bird.y, s.bird.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(s.bird.x + 6, s.bird.y - 4, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#fff";
      ctx.font = "bold 24px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(String(score), canvas.width / 2, 50);
      ctx.font = "12px sans-serif";
      ctx.fillStyle = "#ffffff88";
      ctx.fillText("Tap/Space to flap", canvas.width / 2, canvas.height - 16);
    }

    // ─── SHOOTER ───
    function initShooter() {
      stateRef.current = {
        player: { x: canvas.width / 2, w: 36, h: 16 },
        bullets: [] as { x: number; y: number; vy: number }[],
        enemies: [] as { x: number; y: number; r: number; vy: number }[],
        enemySpeed: (settings.enemySpeed as number) || 1.8,
        shootCooldown: 0,
        rapidFire: settings.rapidFire as boolean,
        spawnTimer: 0,
        spawnInterval: 50,
      };
    }

    function updateShooter() {
      const s = stateRef.current as {
        player: { x: number; w: number; h: number };
        bullets: { x: number; y: number; vy: number }[];
        enemies: { x: number; y: number; r: number; vy: number }[];
        enemySpeed: number;
        shootCooldown: number;
        rapidFire: boolean;
        spawnTimer: number;
        spawnInterval: number;
      };
      const keys = keysRef.current;
      if (keys.has("arrowleft") || keys.has("a")) s.player.x = Math.max(s.player.w / 2, s.player.x - 6);
      if (keys.has("arrowright") || keys.has("d")) s.player.x = Math.min(canvas.width - s.player.w / 2, s.player.x + 6);
      if (touchRef.current.pointerX !== null) {
        s.player.x = Math.max(
          s.player.w / 2,
          Math.min(canvas.width - s.player.w / 2, touchRef.current.pointerX)
        );
      }

      const fireRate = s.rapidFire ? 8 : 20;
      if ((keys.has(" ") || keys.has("arrowup") || touchRef.current.actionTap) && s.shootCooldown <= 0) {
        s.bullets.push({ x: s.player.x, y: canvas.height - 50, vy: -10 });
        s.shootCooldown = fireRate;
        touchRef.current.actionTap = false;
        keysRef.current.delete(" ");
      }
      if (s.shootCooldown > 0) s.shootCooldown--;

      s.bullets.forEach((b) => (b.y += b.vy));
      s.bullets = s.bullets.filter((b) => b.y > -10);

      s.spawnTimer++;
      if (s.spawnTimer >= s.spawnInterval) {
        s.spawnTimer = 0;
        const r = 14 + Math.random() * 16;
        s.enemies.push({
          x: 30 + Math.random() * (canvas.width - 60),
          y: -r,
          r,
          vy: s.enemySpeed + Math.random() * 0.8,
        });
      }

      s.enemies.forEach((e) => (e.y += e.vy));

      for (let bi = s.bullets.length - 1; bi >= 0; bi--) {
        const b = s.bullets[bi];
        for (let ei = s.enemies.length - 1; ei >= 0; ei--) {
          const e = s.enemies[ei];
          if (Math.hypot(b.x - e.x, b.y - e.y) < e.r + 4) {
            s.bullets.splice(bi, 1);
            s.enemies.splice(ei, 1);
            score += 10;
            onScoreChange?.(score);
            break;
          }
        }
      }

      const p = s.player;
      const py = canvas.height - 40;
      for (const e of s.enemies) {
        if (e.y + e.r < 0) continue;
        if (Math.hypot(e.x - p.x, e.y - py) < e.r + p.w / 2) {
          endGame(score);
          return;
        }
      }
      s.enemies = s.enemies.filter((e) => e.y < canvas.height + 50);
    }

    function drawShooter() {
      const s = stateRef.current as {
        player: { x: number; w: number; h: number };
        bullets: { x: number; y: number }[];
        enemies: { x: number; y: number; r: number }[];
      };
      ctx.fillStyle = theme.background;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < 30; i++) {
        ctx.fillStyle = "#ffffff" + (i % 3 === 0 ? "33" : "11");
        ctx.fillRect((i * 137) % canvas.width, (i * 89 + Date.now() * 0.02) % canvas.height, 2, 2);
      }

      ctx.fillStyle = theme.accent;
      s.enemies.forEach((e) => {
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.fillStyle = theme.secondary;
      s.bullets.forEach((b) => {
        ctx.fillRect(b.x - 2, b.y - 8, 4, 12);
      });

      const p = s.player;
      ctx.fillStyle = theme.primary;
      ctx.beginPath();
      ctx.moveTo(p.x, canvas.height - 40 - p.h);
      ctx.lineTo(p.x - p.w / 2, canvas.height - 40);
      ctx.lineTo(p.x + p.w / 2, canvas.height - 40);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "#fff";
      ctx.font = "16px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(`Score: ${score}`, 16, 30);
      ctx.font = "12px sans-serif";
      ctx.fillStyle = "#ffffff88";
      ctx.fillText("←/→ move · Space shoot", 16, canvas.height - 16);
    }

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
      const cols = (settings.gridWidth as number) || 10;
      const rows = 20;
      const cellSize = Math.min(canvas.width / (cols + 4), canvas.height / (rows + 2));
      stateRef.current = {
        cols,
        rows,
        cellSize,
        offsetX: (canvas.width - cols * cellSize) / 2,
        offsetY: (canvas.height - rows * cellSize) / 2,
        board: Array.from({ length: rows }, () => Array(cols).fill(0)),
        piece: null as { shape: number[][]; color: number; x: number; y: number } | null,
        dropTimer: 0,
        dropInterval: (settings.dropSpeed as number) || 600,
        colors: [theme.primary, theme.secondary, theme.accent, "#fbbf24", "#34d399", "#fb7185", "#818cf8"],
      };
      spawnTetrisPiece();
    }

    function spawnTetrisPiece() {
      const s = stateRef.current as {
        cols: number;
        board: number[][];
        piece: { shape: number[][]; color: number; x: number; y: number } | null;
      };
      const t = TETROMINOES[Math.floor(Math.random() * TETROMINOES.length)];
      s.piece = { shape: t.shape.map((r) => [...r]), color: t.color, x: Math.floor(s.cols / 2) - 1, y: 0 };
      if (tetrisCollision(s.piece)) endGame(score);
    }

    function tetrisCollision(
      piece: { shape: number[][]; x: number; y: number },
      ox = 0,
      oy = 0
    ): boolean {
      const s = stateRef.current as { cols: number; rows: number; board: number[][] };
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
      const s = stateRef.current as {
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
        score += cleared * 100 * cleared;
        onScoreChange?.(score);
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
      const s = stateRef.current as {
        piece: { shape: number[][]; color: number; x: number; y: number } | null;
        dropTimer: number;
        dropInterval: number;
      };
      if (!s.piece) return;
      const keys = keysRef.current;
      if (keys.has("arrowleft") || keys.has("a")) {
        if (!tetrisCollision(s.piece, -1, 0)) s.piece.x--;
        keysRef.current.delete("arrowleft");
        keysRef.current.delete("a");
      }
      if (keys.has("arrowright") || keys.has("d")) {
        if (!tetrisCollision(s.piece, 1, 0)) s.piece.x++;
        keysRef.current.delete("arrowright");
        keysRef.current.delete("d");
      }
      if (keys.has("arrowup") || keys.has("w")) {
        const rotated = rotateTetris(s.piece.shape);
        const prev = s.piece.shape;
        s.piece.shape = rotated;
        if (tetrisCollision(s.piece)) s.piece.shape = prev;
        keysRef.current.delete("arrowup");
        keysRef.current.delete("w");
      }
      if (keys.has("arrowdown") || keys.has("s")) {
        if (!tetrisCollision(s.piece, 0, 1)) s.piece.y++;
        keysRef.current.delete("arrowdown");
        keysRef.current.delete("s");
      }

      if (touchRef.current.pendingDir) {
        const d = touchRef.current.pendingDir;
        if (d.x < 0 && !tetrisCollision(s.piece, -1, 0)) s.piece.x--;
        if (d.x > 0 && !tetrisCollision(s.piece, 1, 0)) s.piece.x++;
        if (d.y < 0) {
          const rotated = rotateTetris(s.piece.shape);
          const prev = s.piece.shape;
          s.piece.shape = rotated;
          if (tetrisCollision(s.piece)) s.piece.shape = prev;
        }
        if (d.y > 0 && !tetrisCollision(s.piece, 0, 1)) s.piece.y++;
        touchRef.current.pendingDir = null;
      }

      s.dropTimer += 16;
      if (s.dropTimer >= s.dropInterval) {
        s.dropTimer = 0;
        if (!tetrisCollision(s.piece, 0, 1)) s.piece.y++;
        else lockTetrisPiece();
      }
    }

    function drawTetris() {
      const s = stateRef.current as {
        cols: number;
        rows: number;
        cellSize: number;
        offsetX: number;
        offsetY: number;
        board: number[][];
        piece: { shape: number[][]; color: number; x: number; y: number } | null;
        colors: string[];
      };
      ctx.fillStyle = theme.background;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const drawCell = (cx: number, cy: number, colorIdx: number) => {
        ctx.fillStyle = s.colors[colorIdx % s.colors.length];
        ctx.fillRect(
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

      ctx.strokeStyle = theme.secondary + "44";
      ctx.strokeRect(s.offsetX, s.offsetY, s.cols * s.cellSize, s.rows * s.cellSize);

      ctx.fillStyle = "#fff";
      ctx.font = "16px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(`Score: ${score}`, 16, 30);
      ctx.font = "12px sans-serif";
      ctx.fillStyle = "#ffffff88";
      ctx.fillText("←/→ move · ↑ rotate · ↓ drop", 16, canvas.height - 16);
    }

    // ─── MEMORY ───
    function initMemory() {
      const sizeSetting = (settings.gridSize as number) || 4;
      const cols = sizeSetting === 3 ? 3 : sizeSetting === 6 ? 6 : 4;
      const rows = sizeSetting === 3 ? 2 : sizeSetting === 6 ? 6 : 4;
      const total = cols * rows;
      const pairs = total / 2;
      const symbols = ["🌟", "🔥", "💎", "🎵", "🌈", "🍀", "🎯", "🚀", "🎨", "⚡", "🌸", "🎲", "🦋", "🍕", "🎮", "🌙", "🎪", "🧩"];
      const cards: { symbol: string; flipped: boolean; matched: boolean }[] = [];
      const deck = symbols.slice(0, pairs);
      const shuffled = [...deck, ...deck].sort(() => Math.random() - 0.5);
      shuffled.forEach((sym) => cards.push({ symbol: sym, flipped: false, matched: false }));

      const cellSize = Math.min((canvas.width - 40) / cols, (canvas.height - 80) / rows);
      stateRef.current = {
        cols,
        rows,
        cellSize,
        offsetX: (canvas.width - cols * cellSize) / 2,
        offsetY: (canvas.height - rows * cellSize) / 2 + 10,
        cards,
        firstPick: null as number | null,
        secondPick: null as number | null,
        lockTimer: 0,
        moves: 0,
        timeLimit: (settings.timeLimit as number) || 0,
        timeLeft: (settings.timeLimit as number) || 0,
        timer: 0,
      };
    }

    function updateMemory() {
      const s = stateRef.current as {
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
          if (s.timeLeft <= 0) endGame(score);
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
            score += 20;
            onScoreChange?.(score);
            if (s.cards.every((c) => c.matched)) endGame(score);
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
      const s = stateRef.current as {
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
      ctx.fillStyle = theme.background;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      s.cards.forEach((card, i) => {
        const col = i % s.cols;
        const row = Math.floor(i / s.cols);
        const x = s.offsetX + col * s.cellSize;
        const y = s.offsetY + row * s.cellSize;
        const show = card.flipped || card.matched;

        ctx.fillStyle = card.matched ? theme.secondary + "33" : show ? theme.primary + "44" : theme.secondary + "66";
        ctx.beginPath();
        ctx.roundRect(x + 3, y + 3, s.cellSize - 6, s.cellSize - 6, 8);
        ctx.fill();

        if (show) {
          ctx.font = `${s.cellSize * 0.45}px sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(card.symbol, x + s.cellSize / 2, y + s.cellSize / 2);
        } else {
          ctx.fillStyle = theme.accent + "88";
          ctx.font = `bold ${s.cellSize * 0.3}px sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("?", x + s.cellSize / 2, y + s.cellSize / 2);
        }
      });

      ctx.fillStyle = "#fff";
      ctx.font = "16px sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      ctx.fillText(`Score: ${score}  Moves: ${s.moves}`, 16, 30);
      if (s.timeLimit > 0) ctx.fillText(`Time: ${s.timeLeft}s`, 16, 52);
      ctx.font = "12px sans-serif";
      ctx.fillStyle = "#ffffff88";
      ctx.textAlign = "center";
      ctx.fillText("Tap cards to flip and match pairs", canvas.width / 2, canvas.height - 16);
    }

    // ─── WHACK ───
    function initWhack() {
      const cols = 3;
      const rows = 3;
      const cellSize = Math.min((canvas.width - 40) / cols, (canvas.height - 100) / rows);
      const duration = ((settings.duration as number) || 30) * 1000;
      stateRef.current = {
        cols,
        rows,
        cellSize,
        offsetX: (canvas.width - cols * cellSize) / 2,
        offsetY: (canvas.height - rows * cellSize) / 2 + 10,
        moles: Array.from({ length: cols * rows }, () => null) as ({
          active: boolean;
          golden: boolean;
          timer: number;
          maxTime: number;
        } | null)[],
        spawnTimer: 0,
        duration,
        timeLeft: duration,
        moleSpeed: (settings.moleSpeed as number) || 1,
      };
    }

    function updateWhack() {
      const s = stateRef.current as {
        moles: ({ active: boolean; golden: boolean; timer: number; maxTime: number } | null)[];
        spawnTimer: number;
        moleSpeed: number;
        timeLeft: number;
      };
      s.timeLeft -= 16;
      if (s.timeLeft <= 0) {
        endGame(score);
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
      const s = stateRef.current as {
        cols: number;
        rows: number;
        cellSize: number;
        offsetX: number;
        offsetY: number;
        moles: ({ active: boolean; golden: boolean } | null)[];
        timeLeft: number;
        duration: number;
      };
      ctx.fillStyle = theme.background;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < s.cols * s.rows; i++) {
        const col = i % s.cols;
        const row = Math.floor(i / s.cols);
        const x = s.offsetX + col * s.cellSize;
        const y = s.offsetY + row * s.cellSize;
        ctx.fillStyle = theme.secondary + "33";
        ctx.beginPath();
        ctx.ellipse(x + s.cellSize / 2, y + s.cellSize * 0.85, s.cellSize * 0.35, s.cellSize * 0.12, 0, 0, Math.PI * 2);
        ctx.fill();

        const mole = s.moles[i];
        if (mole?.active) {
          ctx.font = `${s.cellSize * 0.5}px sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(mole.golden ? "⭐" : "🐹", x + s.cellSize / 2, y + s.cellSize / 2);
        }
      }

      ctx.fillStyle = "#fff";
      ctx.font = "16px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(`Score: ${score}`, 16, 28);
      ctx.fillText(`Time: ${Math.ceil(s.timeLeft / 1000)}s`, 16, 50);
      ctx.font = "12px sans-serif";
      ctx.fillStyle = "#ffffff88";
      ctx.textAlign = "center";
      ctx.fillText("Tap moles before they hide!", canvas.width / 2, canvas.height - 16);
    }

    function handleWhackTap(mx: number, my: number) {
      const s = stateRef.current as {
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
      score += mole.golden ? 25 : 10;
      onScoreChange?.(score);
      s.moles[idx] = null;
    }

    // ─── DODGE ───
    function initDodge() {
      stateRef.current = {
        player: { x: canvas.width / 2, w: 44, h: 20 },
        hazards: [] as { x: number; y: number; w: number; h: number; vy: number }[],
        fallSpeed: (settings.fallSpeed as number) || 1.6,
        density: (settings.density as number) || 1,
        spawnTimer: 0,
        spawnInterval: 45,
      };
    }

    function updateDodge() {
      const s = stateRef.current as {
        player: { x: number; w: number; h: number };
        hazards: { x: number; y: number; w: number; h: number; vy: number }[];
        fallSpeed: number;
        density: number;
        spawnTimer: number;
        spawnInterval: number;
      };
      const keys = keysRef.current;
      if (keys.has("arrowleft") || keys.has("a")) s.player.x = Math.max(s.player.w / 2, s.player.x - 7);
      if (keys.has("arrowright") || keys.has("d")) s.player.x = Math.min(canvas.width - s.player.w / 2, s.player.x + 7);
      if (touchRef.current.pointerX !== null) {
        s.player.x = Math.max(
          s.player.w / 2,
          Math.min(canvas.width - s.player.w / 2, touchRef.current.pointerX)
        );
      }

      s.spawnTimer++;
      if (s.spawnTimer >= s.spawnInterval / s.density) {
        s.spawnTimer = 0;
        const w = 16 + Math.random() * 28;
        s.hazards.push({
          x: Math.random() * (canvas.width - w),
          y: -30,
          w,
          h: w,
          vy: (2 + Math.random() * 2) * s.fallSpeed,
        });
      }

      s.hazards.forEach((h) => (h.y += h.vy));
      s.hazards = s.hazards.filter((h) => h.y < canvas.height + 40);

      score = Math.floor(score + 0.15 * s.fallSpeed);
      onScoreChange?.(score);

      const py = canvas.height - 40;
      const px = s.player.x;
      for (const h of s.hazards) {
        if (
          px + s.player.w / 2 > h.x &&
          px - s.player.w / 2 < h.x + h.w &&
          py < h.y + h.h &&
          py + s.player.h > h.y
        ) {
          endGame(score);
          return;
        }
      }
    }

    function drawDodge() {
      const s = stateRef.current as {
        player: { x: number; w: number; h: number };
        hazards: { x: number; y: number; w: number; h: number }[];
      };
      ctx.fillStyle = theme.background;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = theme.accent;
      s.hazards.forEach((h) => {
        ctx.beginPath();
        ctx.arc(h.x + h.w / 2, h.y + h.h / 2, h.w / 2, 0, Math.PI * 2);
        ctx.fill();
      });

      const py = canvas.height - 40;
      ctx.fillStyle = theme.primary;
      ctx.fillRect(s.player.x - s.player.w / 2, py, s.player.w, s.player.h);

      ctx.fillStyle = "#fff";
      ctx.font = "16px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(`Score: ${score}`, 16, 28);
      ctx.font = "12px sans-serif";
      ctx.fillStyle = "#ffffff88";
      ctx.fillText("Dodge the falling hazards!", 16, canvas.height - 16);
    }

    // ─── SLIDE (2048) ───
    function initSlide() {
      const size = (settings.gridSize as number) || 4;
      const cellSize = Math.min((canvas.width - 48) / size, (canvas.height - 100) / size);
      const grid = Array.from({ length: size }, () => Array(size).fill(0));
      slideSpawn(grid);
      slideSpawn(grid);
      stateRef.current = {
        size,
        cellSize,
        offsetX: (canvas.width - size * cellSize) / 2,
        offsetY: (canvas.height - size * cellSize) / 2 + 10,
        grid,
        target: (settings.target as number) || 2048,
        pendingMove: null as { x: number; y: number } | null,
      };
    }

    function slideSpawn(grid: number[][]) {
      const empty: [number, number][] = [];
      grid.forEach((row, r) => row.forEach((v, c) => { if (!v) empty.push([r, c]); }));
      if (!empty.length) return;
      const [r, c] = empty[Math.floor(Math.random() * empty.length)];
      grid[r][c] = Math.random() < 0.9 ? 2 : 4;
    }

    function slideCanMove(grid: number[][]): boolean {
      const size = grid.length;
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          const v = grid[r][c];
          if (!v) return true;
          if (c < size - 1 && grid[r][c + 1] === v) return true;
          if (r < size - 1 && grid[r + 1][c] === v) return true;
        }
      }
      return false;
    }

    function slideLine(line: number[]) {
      const filtered = line.filter((v) => v);
      const result: number[] = [];
      let gained = 0;
      let i = 0;
      while (i < filtered.length) {
        if (i + 1 < filtered.length && filtered[i] === filtered[i + 1]) {
          const merged = filtered[i] * 2;
          result.push(merged);
          gained += merged;
          i += 2;
        } else {
          result.push(filtered[i]);
          i += 1;
        }
      }
      while (result.length < line.length) result.push(0);
      const changed = line.some((v, idx) => v !== result[idx]);
      return { line: result, changed, gained };
    }

    function slideMove(grid: number[][], dx: number, dy: number): boolean {
      const size = grid.length;
      let moved = false;
      let gained = 0;

      if (dx !== 0) {
        for (let r = 0; r < size; r++) {
          const row = dx < 0 ? [...grid[r]] : [...grid[r]].reverse();
          const { line, changed, gained: g } = slideLine(row);
          const out = dx < 0 ? line : [...line].reverse();
          if (changed) {
            moved = true;
            gained += g;
            grid[r] = out;
          }
        }
      } else {
        for (let c = 0; c < size; c++) {
          const col = grid.map((row) => row[c]);
          const working = dy < 0 ? [...col] : [...col].reverse();
          const { line, changed, gained: g } = slideLine(working);
          const out = dy < 0 ? line : [...line].reverse();
          if (changed) {
            moved = true;
            gained += g;
            for (let r = 0; r < size; r++) grid[r][c] = out[r];
          }
        }
      }

      if (gained > 0) {
        score += gained;
        onScoreChange?.(score);
      }
      return moved;
    }

    function updateSlide() {
      const s = stateRef.current as {
        grid: number[][];
        target: number;
        pendingMove: { x: number; y: number } | null;
      };
      const keys = keysRef.current;
      let dx = 0;
      let dy = 0;
      if (keys.has("arrowleft") || keys.has("a")) dx = -1;
      if (keys.has("arrowright") || keys.has("d")) dx = 1;
      if (keys.has("arrowup") || keys.has("w")) dy = -1;
      if (keys.has("arrowdown") || keys.has("s")) dy = 1;
      if (dx || dy) {
        keysRef.current.delete("arrowleft");
        keysRef.current.delete("a");
        keysRef.current.delete("arrowright");
        keysRef.current.delete("d");
        keysRef.current.delete("arrowup");
        keysRef.current.delete("w");
        keysRef.current.delete("arrowdown");
        keysRef.current.delete("s");
      }

      if (touchRef.current.pendingDir) {
        const d = touchRef.current.pendingDir;
        if (Math.abs(d.x) > Math.abs(d.y)) dx = d.x > 0 ? 1 : -1;
        else dy = d.y > 0 ? 1 : -1;
        touchRef.current.pendingDir = null;
      }

      if (dx || dy) {
        const moved = slideMove(s.grid, dx, dy);
        if (moved) {
          slideSpawn(s.grid);
          if (s.grid.some((row) => row.some((v) => v >= s.target))) endGame(score);
          else if (!slideCanMove(s.grid)) endGame(score);
        }
      }
    }

    function drawSlide() {
      const s = stateRef.current as {
        size: number;
        cellSize: number;
        offsetX: number;
        offsetY: number;
        grid: number[][];
        target: number;
      };
      const colors = ["", "#334155", "#475569", "#6366f1", "#818cf8", "#a78bfa", "#f472b6", "#fb7185", "#fbbf24", "#34d399", "#22d3ee", "#f97316"];
      ctx.fillStyle = theme.background;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (let r = 0; r < s.size; r++) {
        for (let c = 0; c < s.size; c++) {
          const val = s.grid[r][c];
          const x = s.offsetX + c * s.cellSize;
          const y = s.offsetY + r * s.cellSize;
          ctx.fillStyle = val ? (colors[Math.min(Math.log2(val), colors.length - 1)] || theme.primary) : theme.secondary + "33";
          ctx.beginPath();
          ctx.roundRect(x + 3, y + 3, s.cellSize - 6, s.cellSize - 6, 8);
          ctx.fill();
          if (val) {
            ctx.fillStyle = val > 4 ? "#fff" : "#e2e8f0";
            ctx.font = `bold ${s.cellSize * (val >= 1000 ? 0.28 : 0.36)}px sans-serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(String(val), x + s.cellSize / 2, y + s.cellSize / 2);
          }
        }
      }

      ctx.fillStyle = "#fff";
      ctx.font = "16px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(`Score: ${score}  Target: ${s.target}`, 16, 28);
      ctx.font = "12px sans-serif";
      ctx.fillStyle = "#ffffff88";
      ctx.textAlign = "center";
      ctx.fillText("Swipe or use arrows to merge tiles", canvas.width / 2, canvas.height - 16);
    }

    // ─── CATCH ───
    function initCatch() {
      stateRef.current = {
        basket: { x: canvas.width / 2, w: 70, h: 16 },
        items: [] as { x: number; y: number; r: number; type: "fruit" | "bomb"; emoji: string }[],
        fallSpeed: (settings.fallSpeed as number) || 1.4,
        lives: (settings.lives as number) || 3,
        missed: 0,
        spawnTimer: 0,
        spawnInterval: 55,
        fruits: ["🍎", "🍊", "🍇", "🍌", "🍓"],
      };
    }

    function updateCatch() {
      const s = stateRef.current as {
        basket: { x: number; w: number; h: number };
        items: { x: number; y: number; r: number; type: "fruit" | "bomb"; emoji: string }[];
        fallSpeed: number;
        lives: number;
        missed: number;
        spawnTimer: number;
        spawnInterval: number;
        fruits: string[];
      };
      const keys = keysRef.current;
      if (keys.has("arrowleft") || keys.has("a")) s.basket.x = Math.max(s.basket.w / 2, s.basket.x - 8);
      if (keys.has("arrowright") || keys.has("d")) s.basket.x = Math.min(canvas.width - s.basket.w / 2, s.basket.x + 8);
      if (touchRef.current.pointerX !== null) {
        s.basket.x = Math.max(
          s.basket.w / 2,
          Math.min(canvas.width - s.basket.w / 2, touchRef.current.pointerX)
        );
      }

      s.spawnTimer++;
      if (s.spawnTimer >= s.spawnInterval) {
        s.spawnTimer = 0;
        const bomb = Math.random() < 0.18;
        s.items.push({
          x: 20 + Math.random() * (canvas.width - 40),
          y: -20,
          r: 16,
          type: bomb ? "bomb" : "fruit",
          emoji: bomb ? "💣" : s.fruits[Math.floor(Math.random() * s.fruits.length)],
        });
      }

      const by = canvas.height - 36;
      s.items.forEach((item) => (item.y += 3 * s.fallSpeed));
      s.items = s.items.filter((item) => {
        if (item.y - item.r > canvas.height) {
          if (item.type === "fruit") {
            s.missed++;
            if (s.missed >= 3) {
              s.lives--;
              s.missed = 0;
              if (s.lives <= 0) endGame(score);
            }
          }
          return false;
        }
        const caught =
          item.y + item.r > by &&
          item.x > s.basket.x - s.basket.w / 2 &&
          item.x < s.basket.x + s.basket.w / 2;
        if (caught) {
          if (item.type === "bomb") {
            s.lives--;
            if (s.lives <= 0) endGame(score);
          } else {
            score += 10;
            onScoreChange?.(score);
          }
          return false;
        }
        return true;
      });
    }

    function drawCatch() {
      const s = stateRef.current as {
        basket: { x: number; w: number; h: number };
        items: { x: number; y: number; r: number; emoji: string }[];
        lives: number;
      };
      ctx.fillStyle = theme.background;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      s.items.forEach((item) => {
        ctx.font = `${item.r * 1.6}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(item.emoji, item.x, item.y);
      });

      const by = canvas.height - 36;
      ctx.fillStyle = theme.primary;
      ctx.beginPath();
      ctx.roundRect(s.basket.x - s.basket.w / 2, by, s.basket.w, s.basket.h, 6);
      ctx.fill();

      ctx.fillStyle = "#fff";
      ctx.font = "16px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(`Score: ${score}  Lives: ${s.lives}`, 16, 28);
      ctx.font = "12px sans-serif";
      ctx.fillStyle = "#ffffff88";
      ctx.fillText("Catch fruit, avoid bombs!", 16, canvas.height - 16);
    }

    // ─── CROSS (Frogger) ───
    function initCross() {
      const cols = 7;
      const rows = 9;
      const cellW = canvas.width / cols;
      const cellH = (canvas.height - 50) / rows;
      const trafficRows = [1, 3, 5, 7];
      const carSpeed = ((settings.carSpeed as number) || 1.4) * 2;
      stateRef.current = {
        cols,
        rows,
        cellW,
        cellH,
        offsetY: 30,
        player: { c: Math.floor(cols / 2), r: rows - 1 },
        cars: trafficRows.flatMap((row, laneIdx) =>
          [0, 1, 2].map((i) => ({
            row,
            x: (i * canvas.width) / 3 + Math.random() * 30,
            w: cellW * 1.4,
            speed: (laneIdx % 2 === 0 ? 1 : -1) * carSpeed * (0.8 + Math.random() * 0.4),
          }))
        ),
        moveCooldown: 0,
      };
    }

    function tryMoveCross(dc: number, dr: number) {
      const s = stateRef.current as {
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
      if (s.player.r === 0) {
        score += 100;
        onScoreChange?.(score);
        s.player.r = s.rows - 1;
        s.player.c = Math.floor(s.cols / 2);
      }
    }

    function updateCross() {
      const s = stateRef.current as {
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

      const keys = keysRef.current;
      if (keys.has("arrowup") || keys.has("w")) tryMoveCross(0, -1);
      if (keys.has("arrowdown") || keys.has("s")) tryMoveCross(0, 1);
      if (keys.has("arrowleft") || keys.has("a")) tryMoveCross(-1, 0);
      if (keys.has("arrowright") || keys.has("d")) tryMoveCross(1, 0);
      keysRef.current.delete("arrowup");
      keysRef.current.delete("w");
      keysRef.current.delete("arrowdown");
      keysRef.current.delete("s");
      keysRef.current.delete("arrowleft");
      keysRef.current.delete("a");
      keysRef.current.delete("arrowright");
      keysRef.current.delete("d");

      if (touchRef.current.pendingDir) {
        const d = touchRef.current.pendingDir;
        if (Math.abs(d.x) > Math.abs(d.y)) tryMoveCross(d.x > 0 ? 1 : -1, 0);
        else tryMoveCross(0, d.y > 0 ? 1 : -1);
        touchRef.current.pendingDir = null;
      }

      s.cars.forEach((car) => {
        car.x += car.speed;
        if (car.speed > 0 && car.x > canvas.width + car.w) car.x = -car.w;
        if (car.speed < 0 && car.x < -car.w) car.x = canvas.width + car.w;
      });

      const px = s.player.c * s.cellW + s.cellW / 2;
      const py = s.offsetY + s.player.r * s.cellH + s.cellH / 2;
      for (const car of s.cars) {
        if (car.row !== s.player.r) continue;
        if (px + s.cellW * 0.3 > car.x && px - s.cellW * 0.3 < car.x + car.w) {
          endGame(score);
          return;
        }
      }
    }

    function drawCross() {
      const s = stateRef.current as {
        cols: number;
        rows: number;
        cellW: number;
        cellH: number;
        offsetY: number;
        player: { c: number; r: number };
        cars: { row: number; x: number; w: number }[];
      };
      ctx.fillStyle = theme.background;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (let r = 0; r < s.rows; r++) {
        const y = s.offsetY + r * s.cellH;
        ctx.fillStyle = r === 0 ? theme.accent + "33" : r % 2 === 0 ? theme.secondary + "22" : theme.secondary + "11";
        ctx.fillRect(0, y, canvas.width, s.cellH);
      }

      ctx.fillStyle = theme.primary;
      s.cars.forEach((car) => {
        const y = s.offsetY + car.row * s.cellH + s.cellH * 0.2;
        ctx.fillRect(car.x, y, car.w, s.cellH * 0.6);
      });

      const px = s.player.c * s.cellW + s.cellW / 2;
      const py = s.offsetY + s.player.r * s.cellH + s.cellH / 2;
      ctx.fillStyle = theme.accent;
      ctx.beginPath();
      ctx.arc(px, py, s.cellW * 0.32, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#fff";
      ctx.font = "16px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(`Score: ${score}`, 16, 22);
      ctx.font = "12px sans-serif";
      ctx.fillStyle = "#ffffff88";
      ctx.fillText("Cross to the top!", 16, canvas.height - 12);
    }

    // ─── STACK ───
    function initStack() {
      const w = (settings.startWidth as number) || 100;
      const baseY = canvas.height - 48;
      stateRef.current = {
        blocks: [{ x: canvas.width / 2 - w / 2, w, y: baseY }],
        current: { x: 20, w, dir: 1, y: baseY - 28 },
        speed: (settings.blockSpeed as number) || 1.6,
      };
    }

    function dropStack() {
      const s = stateRef.current as {
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
        endGame(score);
        return;
      }
      const perfect = Math.abs(prev.x - cur.x) < 6;
      score += perfect ? 25 : 10;
      onScoreChange?.(score);
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
      const s = stateRef.current as {
        current: { x: number; w: number; dir: number; y: number };
        speed: number;
      };
      const cur = s.current;
      cur.x += cur.dir * s.speed * 4;
      if (cur.x <= 10) {
        cur.x = 10;
        cur.dir = 1;
      }
      if (cur.x + cur.w >= canvas.width - 10) {
        cur.x = canvas.width - 10 - cur.w;
        cur.dir = -1;
      }

      if (keysRef.current.has(" ") || touchRef.current.actionTap) {
        dropStack();
        keysRef.current.delete(" ");
        touchRef.current.actionTap = false;
      }
    }

    function drawStack() {
      const s = stateRef.current as {
        blocks: { x: number; w: number; y: number }[];
        current: { x: number; w: number; y: number };
      };
      ctx.fillStyle = theme.background;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      s.blocks.forEach((b, i) => {
        ctx.fillStyle = i === s.blocks.length - 1 ? theme.primary : theme.secondary + "cc";
        ctx.fillRect(b.x, b.y, b.w, 20);
      });
      ctx.fillStyle = theme.accent;
      ctx.fillRect(s.current.x, s.current.y, s.current.w, 20);

      ctx.fillStyle = "#fff";
      ctx.font = "16px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(`Score: ${score}  Height: ${s.blocks.length}`, 16, 24);
      ctx.font = "12px sans-serif";
      ctx.fillStyle = "#ffffff88";
      ctx.fillText("Tap to drop the block", 16, canvas.height - 12);
    }

    // ─── SIMON ───
    const SIMON_COLORS = ["#ef4444", "#22c55e", "#3b82f6", "#eab308"];

    function initSimon() {
      stateRef.current = {
        sequence: [] as number[],
        inputIdx: 0,
        phase: "show" as "show" | "input",
        showIdx: 0,
        flashTimer: 0,
        flashOn: false,
        flashColor: -1,
        speed: (settings.speed as number) || 650,
        padding: 40,
      };
      nextSimonRound();
    }

    function nextSimonRound() {
      const s = stateRef.current as {
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
      const s = stateRef.current as {
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
      const s = stateRef.current as {
        phase: "show" | "input";
        flashOn: boolean;
        flashColor: number;
        sequence: number[];
        padding: number;
      };
      ctx.fillStyle = theme.background;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const pad = s.padding;
      const w = (canvas.width - pad * 3) / 2;
      const h = (canvas.height - pad * 3 - 40) / 2;
      const positions = [
        [pad, pad],
        [pad * 2 + w, pad],
        [pad, pad * 2 + h],
        [pad * 2 + w, pad * 2 + h],
      ];

      positions.forEach(([x, y], i) => {
        const lit = s.flashOn && s.flashColor === i;
        ctx.fillStyle = lit ? SIMON_COLORS[i] : SIMON_COLORS[i] + "55";
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, 16);
        ctx.fill();
      });

      ctx.fillStyle = "#fff";
      ctx.font = "16px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`Round ${s.sequence.length}`, canvas.width / 2, canvas.height - 24);
      ctx.font = "12px sans-serif";
      ctx.fillStyle = "#ffffff88";
      ctx.fillText(
        s.phase === "show" ? "Watch the sequence..." : "Repeat the pattern!",
        canvas.width / 2,
        canvas.height - 8
      );
    }

    function handleSimonTap(mx: number, my: number) {
      const s = stateRef.current as {
        phase: "show" | "input";
        sequence: number[];
        inputIdx: number;
        padding: number;
      };
      if (s.phase !== "input") return;

      const pad = s.padding;
      const w = (canvas.width - pad * 3) / 2;
      const h = (canvas.height - pad * 3 - 40) / 2;
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
        endGame(score);
        return;
      }
      s.inputIdx++;
      score += 5;
      onScoreChange?.(score);
      if (s.inputIdx >= s.sequence.length) nextSimonRound();
    }

    // ─── REACTION ───
    function initReaction() {
      const rounds = (settings.rounds as number) || 5;
      stateRef.current = {
        phase: "wait" as "wait" | "go" | "early",
        timer: 0,
        waitTime: 0,
        round: 0,
        maxRounds: rounds,
        minDelay: (settings.minDelay as number) || 800,
        lastMs: 0,
      };
      startReactionWait();
    }

    function startReactionWait() {
      const s = stateRef.current as {
        phase: "wait" | "go" | "early";
        timer: number;
        waitTime: number;
        round: number;
        maxRounds: number;
        minDelay: number;
      };
      if (s.round >= s.maxRounds) {
        endGame(score);
        return;
      }
      s.phase = "wait";
      s.waitTime = s.minDelay + Math.random() * 2000;
      s.timer = 0;
    }

    function updateReaction() {
      const s = stateRef.current as {
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

      if (keysRef.current.has(" ")) {
        handleReactionTap();
        keysRef.current.delete(" ");
      }
    }

    function handleReactionTap() {
      const s = stateRef.current as {
        phase: "wait" | "go" | "early";
        round: number;
        lastMs: number;
        maxRounds: number;
      };
      if (s.phase === "wait") {
        endGame(score);
        return;
      }
      if (s.phase === "go") {
        const points = Math.max(10, 500 - s.lastMs);
        score += points;
        onScoreChange?.(score);
        s.round++;
        startReactionWait();
      }
    }

    function drawReaction() {
      const s = stateRef.current as {
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
      ctx.fillStyle = colors[s.phase];
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "#fff";
      ctx.font = "bold 28px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      if (s.phase === "wait") ctx.fillText("Wait...", canvas.width / 2, canvas.height / 2 - 20);
      if (s.phase === "go") ctx.fillText("TAP!", canvas.width / 2, canvas.height / 2 - 20);

      ctx.font = "16px sans-serif";
      ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 + 30);
      ctx.font = "13px sans-serif";
      ctx.fillStyle = "#ffffffcc";
      ctx.fillText(`Round ${Math.min(s.round + 1, s.maxRounds)} / ${s.maxRounds}`, canvas.width / 2, 40);
      if (s.phase === "go") ctx.fillText(`${s.lastMs}ms`, canvas.width / 2, canvas.height / 2 + 60);
    }

    function handleMemoryTap(mx: number, my: number) {
      const s = stateRef.current as {
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

    function handlePointerInput(clientX: number, clientY: number) {
      if (gameOver) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const mx = (clientX - rect.left) * scaleX;
      const my = (clientY - rect.top) * scaleY;

      if (config.type === "memory") {
        handleMemoryTap(mx, my);
        return;
      }

      if (config.type === "whack") {
        handleWhackTap(mx, my);
        return;
      }

      if (config.type === "simon") {
        handleSimonTap(mx, my);
        return;
      }

      if (config.type === "reaction") {
        handleReactionTap();
        return;
      }

      if (config.type !== "clicker") return;
      const s = stateRef.current as {
        coins: number;
        perClick: number;
        perSecond: number;
        upgrades: { name: string; cost: number; level: number; effect: string }[];
        clickAnim: number;
      };

      const cx = canvas.width / 2;
      const cy = canvas.height / 2 - 40;
      if (Math.hypot(mx - cx, my - cy) < 60) {
        s.coins += s.perClick;
        s.clickAnim = 1;
        score = Math.floor(s.coins);
        onScoreChange?.(score);
      }

      s.upgrades.forEach((u, i) => {
        const y = canvas.height - 120 + i * 36;
        if (mx > 20 && mx < canvas.width - 20 && my > y && my < y + 30 && s.coins >= u.cost) {
          s.coins -= u.cost;
          u.level++;
          u.cost = Math.floor(u.cost * 1.5);
          if (u.effect === "click") s.perClick += u.level;
          else s.perSecond += u.level * 0.5;
        }
      });
    }

    function handleClickerInput(e: MouseEvent) {
      handlePointerInput(e.clientX, e.clientY);
    }

    let swipeStart: { x: number; y: number } | null = null;

    function canvasCoords(clientX: number, clientY: number) {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY,
      };
    }

    function onTouchStart(e: TouchEvent) {
      const touch = e.touches[0];
      if (!touch || gameOver) return;

      const { x, y } = canvasCoords(touch.clientX, touch.clientY);

      if (config.type === "clicker") {
        handlePointerInput(touch.clientX, touch.clientY);
        e.preventDefault();
        return;
      }

      if (config.type === "memory" || config.type === "whack" || config.type === "simon" || config.type === "reaction") {
        handlePointerInput(touch.clientX, touch.clientY);
        e.preventDefault();
        return;
      }

      if (config.type === "stack") {
        touchRef.current.actionTap = true;
        e.preventDefault();
        return;
      }

      if (config.type === "snake" || config.type === "runner" || config.type === "tetris" || config.type === "slide" || config.type === "cross") {
        swipeStart = { x, y };
        e.preventDefault();
        return;
      }

      if (config.type === "flappy") {
        touchRef.current.actionTap = true;
        e.preventDefault();
        return;
      }

      if (config.type === "shooter" || config.type === "dodge" || config.type === "catch") {
        touchRef.current.pointerX = x;
        touchRef.current.actionTap = true;
        e.preventDefault();
        return;
      }

      if (config.type === "pong") {
        touchRef.current.pointerY = y;
        e.preventDefault();
        return;
      }

      if (config.type === "breakout") {
        touchRef.current.pointerX = x;
        e.preventDefault();
      }
    }

    function onTouchMove(e: TouchEvent) {
      const touch = e.touches[0];
      if (!touch || gameOver) return;

      const { x, y } = canvasCoords(touch.clientX, touch.clientY);

      if (config.type === "pong") {
        touchRef.current.pointerY = y;
        e.preventDefault();
      } else if (config.type === "breakout" || config.type === "shooter" || config.type === "dodge" || config.type === "catch") {
        touchRef.current.pointerX = x;
        e.preventDefault();
      } else if (config.type === "snake" || config.type === "runner" || config.type === "tetris" || config.type === "slide" || config.type === "cross") {
        e.preventDefault();
      }
    }

    function onTouchEnd(e: TouchEvent) {
      const touch = e.changedTouches[0];
      if (!touch) return;

      if (config.type === "runner" && !gameOver) {
        touchRef.current.actionTap = true;
      }

      if (config.type === "flappy" && !gameOver) {
        touchRef.current.actionTap = true;
      }

      if ((config.type === "snake" || config.type === "tetris" || config.type === "slide" || config.type === "cross") && swipeStart && !gameOver) {
        const { x, y } = canvasCoords(touch.clientX, touch.clientY);
        const dx = x - swipeStart.x;
        const dy = y - swipeStart.y;
        const minSwipe = 20;
        if (Math.abs(dx) >= minSwipe || Math.abs(dy) >= minSwipe) {
          if (Math.abs(dx) > Math.abs(dy)) {
            touchRef.current.pendingDir = { x: dx > 0 ? 1 : -1, y: 0 };
          } else {
            touchRef.current.pendingDir = { x: 0, y: dy > 0 ? 1 : -1 };
          }
        }
      }

      swipeStart = null;
      if (config.type === "pong") touchRef.current.pointerY = null;
      if (config.type === "breakout" || config.type === "shooter" || config.type === "dodge" || config.type === "catch") touchRef.current.pointerX = null;
    }

    function handleClickerKeys() {
      if (config.type !== "clicker") return;
      const s = stateRef.current as {
        coins: number;
        perClick: number;
        perSecond: number;
        upgrades: { name: string; cost: number; level: number; effect: string }[];
      };
      const keys = keysRef.current;
      ["1", "2", "3"].forEach((k, i) => {
        if (keys.has(k)) {
          const u = s.upgrades[i];
          if (u && s.coins >= u.cost) {
            s.coins -= u.cost;
            u.level++;
            u.cost = Math.floor(u.cost * 1.5);
            if (u.effect === "click") s.perClick += u.level;
            else s.perSecond += u.level * 0.5;
          }
          keysRef.current.delete(k);
        }
      });
    }

    function endGame(finalScore: number) {
      gameOver = true;
      onGameOver?.(finalScore);
    }

    function drawPreview() {
      switch (config.type) {
        case "pong":
          drawPong();
          break;
        case "snake":
          drawSnake();
          break;
        case "breakout":
          drawBreakout();
          break;
        case "runner":
          drawRunner();
          break;
        case "clicker":
          drawClicker();
          break;
        case "flappy":
          drawFlappy();
          break;
        case "shooter":
          drawShooter();
          break;
        case "tetris":
          drawTetris();
          break;
        case "memory":
          drawMemory();
          break;
        case "whack":
          drawWhack();
          break;
        case "dodge":
          drawDodge();
          break;
        case "slide":
          drawSlide();
          break;
        case "catch":
          drawCatch();
          break;
        case "cross":
          drawCross();
          break;
        case "stack":
          drawStack();
          break;
        case "simon":
          drawSimon();
          break;
        case "reaction":
          drawReaction();
          break;
      }
    }

    initGame();
    canvas.addEventListener("click", handleClickerInput);
    canvas.addEventListener("touchstart", onTouchStart, { passive: false });
    canvas.addEventListener("touchmove", onTouchMove, { passive: false });
    canvas.addEventListener("touchend", onTouchEnd);

    const loop = () => {
      if (!active) {
        drawPreview();
        animRef.current = requestAnimationFrame(loop);
        return;
      }

      if (gameOver) {
        animRef.current = requestAnimationFrame(loop);
        return;
      }

      switch (config.type) {
        case "pong":
          updatePong();
          drawPong();
          break;
        case "snake":
          updateSnake();
          drawSnake();
          break;
        case "breakout":
          updateBreakout();
          drawBreakout();
          break;
        case "runner":
          updateRunner();
          drawRunner();
          break;
        case "clicker":
          handleClickerKeys();
          updateClicker();
          drawClicker();
          break;
        case "flappy":
          updateFlappy();
          drawFlappy();
          break;
        case "shooter":
          updateShooter();
          drawShooter();
          break;
        case "tetris":
          updateTetris();
          drawTetris();
          break;
        case "memory":
          updateMemory();
          drawMemory();
          break;
        case "whack":
          updateWhack();
          drawWhack();
          break;
        case "dodge":
          updateDodge();
          drawDodge();
          break;
        case "slide":
          updateSlide();
          drawSlide();
          break;
        case "catch":
          updateCatch();
          drawCatch();
          break;
        case "cross":
          updateCross();
          drawCross();
          break;
        case "stack":
          updateStack();
          drawStack();
          break;
        case "simon":
          updateSimon();
          drawSimon();
          break;
        case "reaction":
          updateReaction();
          drawReaction();
          break;
      }

      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("click", handleClickerInput);
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("touchend", onTouchEnd);
    };
  }, [config, active, onScoreChange, onGameOver]);

  return (
    <canvas
      ref={canvasRef}
      className="h-full w-full cursor-pointer rounded-xl touch-none"
      style={{ touchAction: "none" }}
      tabIndex={0}
    />
  );
}
