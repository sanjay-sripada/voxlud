"use client";

import { useEffect, useRef, useCallback } from "react";
import type { GameConfig } from "@/types/game";

interface GameCanvasProps {
  config: GameConfig;
  onScoreChange?: (score: number) => void;
  onGameOver?: (score: number) => void;
}

export default function GameCanvas({ config, onScoreChange, onGameOver }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<Record<string, unknown>>({});
  const animRef = useRef<number>(0);
  const keysRef = useRef<Set<string>>(new Set());

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
        if (keys.has(" ") || keys.has("arrowup") || keys.has("w")) {
          s.gravity *= -1;
          keysRef.current.delete(" ");
          keysRef.current.delete("arrowup");
          keysRef.current.delete("w");
        }
      } else {
        const keys = keysRef.current;
        if ((keys.has(" ") || keys.has("arrowup") || keys.has("w")) && s.player.grounded) {
          s.player.vy = -12;
          s.player.grounded = false;
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
      ctx.fillText("Click the circle to earn! Press 1/2/3 to buy upgrades", cx, canvas.height - 16);
    }

    function handleClickerInput(e: MouseEvent) {
      if (config.type !== "clicker" || gameOver) return;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
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

    initGame();
    canvas.addEventListener("click", handleClickerInput);

    const loop = () => {
      if (gameOver) {
        ctx.fillStyle = theme.background + "ee";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#fff";
        ctx.font = "bold 32px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("Game Over!", canvas.width / 2, canvas.height / 2 - 20);
        ctx.font = "20px sans-serif";
        ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 + 20);
        ctx.font = "14px sans-serif";
        ctx.fillStyle = "#ffffff88";
        ctx.fillText("Press R to restart", canvas.width / 2, canvas.height / 2 + 60);
        if (keysRef.current.has("r")) {
          gameOver = false;
          score = 0;
          initGame();
        }
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
      }

      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("click", handleClickerInput);
    };
  }, [config, onScoreChange, onGameOver]);

  return (
    <canvas
      ref={canvasRef}
      className="h-full w-full cursor-pointer rounded-xl"
      tabIndex={0}
    />
  );
}
