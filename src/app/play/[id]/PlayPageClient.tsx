"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import GameCanvas from "@/components/GameCanvas";
import type { Game } from "@/types/game";

const CONTROLS: Record<string, string[]> = {
  pong: [
    "W/S or ↑/↓ — Player 1",
    "Touch & drag left side — Player 1 (mobile)",
    "I/K — Player 2 (multiplayer)",
    "First to 5 wins",
  ],
  snake: [
    "Arrow keys or WASD to move",
    "Swipe to steer (mobile)",
    "Eat colored food to grow",
    "Don't hit walls or yourself",
  ],
  breakout: [
    "←/→ or A/D to move paddle",
    "Touch & drag to move paddle (mobile)",
    "Break all bricks to win",
    "Don't lose all lives",
  ],
  runner: [
    "Space or ↑ to jump / flip gravity",
    "Tap screen to jump / flip (mobile)",
    "Dodge obstacles",
    "Survive as long as you can",
  ],
  clicker: [
    "Tap the circle to earn coins",
    "Tap upgrade rows to buy",
    "Press 1/2/3 to buy upgrades (desktop)",
    "Build your empire",
  ],
  flappy: [
    "Space or tap to flap",
    "Fly through gaps in the pipes",
    "Don't hit the ground or pipes",
    "Score a point for each pipe passed",
  ],
  shooter: [
    "←/→ or A/D to move",
    "Space or tap to shoot",
    "Destroy asteroids for points",
    "Don't let them hit your ship",
  ],
  tetris: [
    "←/→ to move blocks",
    "↑ to rotate",
    "↓ to drop faster",
    "Clear lines to score",
  ],
  memory: [
    "Tap cards to flip them",
    "Find matching pairs",
    "Fewer moves = better score",
    "Match all pairs to win",
  ],
};

export default function PlayPageClient() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const isNew = searchParams.get("new") === "true";

  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [score, setScore] = useState(0);
  const [copied, setCopied] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [gameOver, setGameOver] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [replayKey, setReplayKey] = useState(0);
  const [started, setStarted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const gameContainerRef = useRef<HTMLDivElement>(null);

  const handleGameOver = useCallback((endedScore: number) => {
    setFinalScore(endedScore);
    setGameOver(true);
  }, []);

  const handleReplay = useCallback(() => {
    setGameOver(false);
    setScore(0);
    setFinalScore(0);
    setReplayKey((key) => key + 1);
  }, []);

  const handleStart = useCallback(() => {
    setStarted(true);

    if (!isMobile) return;

    requestAnimationFrame(() => {
      requestAnimationFrame(async () => {
        const el = gameContainerRef.current;
        if (!el) return;

        try {
          const request =
            el.requestFullscreen?.bind(el) ??
            (el as HTMLElement & { webkitRequestFullscreen?: () => Promise<void> })
              .webkitRequestFullscreen?.bind(el);
          if (request) await request();
        } catch {
          // CSS fullscreen fallback handles iOS Safari
        }
      });
    });
  }, [isMobile]);

  const handleExitFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch {
      // ignore
    }
    setStarted(false);
    setGameOver(false);
    setScore(0);
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 1023px)");
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    setStarted(false);
    setGameOver(false);
    setScore(0);
    setFinalScore(0);
  }, [id]);

  useEffect(() => {
    if (!started || !isMobile) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [started, isMobile]);

  useEffect(() => {
    const onFullscreenChange = () => {
      const isFs = !!(document.fullscreenElement || (document as Document & { webkitFullscreenElement?: Element }).webkitFullscreenElement);
      if (!isFs && isMobile && started) {
        setStarted(false);
        setGameOver(false);
      }
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    document.addEventListener("webkitfullscreenchange", onFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", onFullscreenChange);
    };
  }, [isMobile, started]);

  useEffect(() => {
    fetch(`/api/games/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setGame(data.game);
        setLoading(false);
        fetch(`/api/games/${id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "play" }),
        });
      })
      .catch(() => setLoading(false));
  }, [id]);

  const shareUrl = typeof window !== "undefined" ? window.location.href.split("?")[0] : "";

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [shareUrl]);

  const handleLike = async () => {
    const res = await fetch(`/api/games/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "like" }),
    });
    const data = await res.json();
    if (game) setGame({ ...game, likes: data.likes });
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500/30 border-t-indigo-500" />
      </div>
    );
  }

  if (!game) {
    return (
      <div className="flex h-[calc(100vh-4rem)] flex-col items-center justify-center gap-4">
        <p className="text-zinc-400">Game not found</p>
        <Link href="/explore" className="text-indigo-400 hover:text-indigo-300">
          Browse games →
        </Link>
      </div>
    );
  }

  const controls = CONTROLS[game.config.type] || [];
  const mobilePlaying = isMobile && started;

  return (
    <div
      ref={gameContainerRef}
      className={
        mobilePlaying
          ? "fixed inset-0 z-[100] flex flex-col bg-[#0a0a12]"
          : "mx-auto flex h-[calc(100vh-4rem)] max-w-6xl flex-col px-4 py-4 lg:flex-row lg:gap-6"
      }
    >
      <div className={`flex flex-1 flex-col ${mobilePlaying ? "min-h-0 p-2" : ""}`}>
        {isNew && !mobilePlaying && (
          <div className="mb-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-300">
            Your game is ready! Play it below, then share the link with friends.
          </div>
        )}

        <div
          className={`relative min-h-0 flex-1 overflow-hidden ${
            mobilePlaying ? "rounded-xl border border-white/10" : "rounded-2xl border border-white/5"
          }`}
          style={{ minHeight: mobilePlaying ? undefined : "400px" }}
        >
          <GameCanvas
            key={replayKey}
            config={game.config}
            active={started}
            onScoreChange={setScore}
            onGameOver={handleGameOver}
          />

          {!started && (
            <button
              type="button"
              onClick={handleStart}
              className="absolute inset-0 z-10 flex cursor-pointer flex-col items-center justify-center gap-4 bg-[#0a0a12]/92 px-6 backdrop-blur-sm"
            >
              <div className="text-center">
                <p
                  className="mb-2 text-xs font-medium uppercase tracking-widest"
                  style={{ color: game.config.theme.primary }}
                >
                  {game.config.type}
                </p>
                <h2 className="text-2xl font-bold sm:text-3xl">{game.config.title}</h2>
                <p className="mt-2 max-w-xs text-sm text-zinc-400">{game.config.description}</p>
              </div>
              <span className="rounded-xl bg-gradient-to-r from-indigo-500 to-pink-500 px-10 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25">
                {isMobile ? "Tap to Play" : "Play"}
              </span>
              {isMobile && (
                <p className="text-xs text-zinc-500">Opens in fullscreen on mobile</p>
              )}
            </button>
          )}

          {mobilePlaying && (
            <>
              <div className="absolute left-3 top-3 z-20 rounded-lg bg-black/50 px-3 py-1.5 text-sm font-medium text-white backdrop-blur-sm">
                {score}
              </div>
              <button
                type="button"
                onClick={handleExitFullscreen}
                className="absolute right-3 top-3 z-20 rounded-lg bg-black/50 px-3 py-1.5 text-xs text-zinc-300 backdrop-blur-sm transition hover:bg-black/70 hover:text-white"
                aria-label="Exit fullscreen"
              >
                Exit
              </button>
            </>
          )}

          {gameOver && started && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#0a0a12]/85 px-6 backdrop-blur-sm">
              <div className="text-center">
                <p className="mb-1 text-sm font-medium uppercase tracking-wider text-pink-400">
                  Game over
                </p>
                <h2 className="text-3xl font-bold">Nice run!</h2>
                <p className="mt-2 text-zinc-400">
                  Final score: <span className="font-semibold text-white">{finalScore}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={handleReplay}
                className="rounded-xl bg-gradient-to-r from-indigo-500 to-pink-500 px-8 py-3 text-sm font-medium text-white transition hover:opacity-90"
              >
                Play again
              </button>
            </div>
          )}
        </div>

        {!mobilePlaying && (
        <div className="mt-3 flex items-center justify-between text-sm text-zinc-500">
          <span>Score: {started ? score : "—"}</span>
          <button
            onClick={() => setShowControls(!showControls)}
            className="text-zinc-400 hover:text-white"
          >
            {showControls ? "Hide controls" : "Show controls"}
          </button>
        </div>
        )}
      </div>

      {!mobilePlaying && (
      <div className="mt-4 w-full shrink-0 lg:mt-0 lg:w-80">
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
          <h1 className="mb-1 text-xl font-bold">{game.config.title}</h1>
          <p className="mb-4 text-sm text-zinc-400">{game.config.description}</p>

          <div className="mb-4 flex flex-wrap gap-2">
            <span
              className="rounded-full px-2.5 py-0.5 text-xs font-medium capitalize"
              style={{
                background: game.config.theme.primary + "33",
                color: game.config.theme.primary,
              }}
            >
              {game.config.type}
            </span>
            <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-xs capitalize text-zinc-400">
              {game.config.mode.replace("-", " ")}
            </span>
          </div>

          <div className="mb-4 rounded-lg bg-white/[0.03] p-3">
            <p className="mb-1 text-xs font-medium uppercase tracking-wider text-zinc-500">
              Original prompt
            </p>
            <p className="text-sm text-zinc-300">&quot;{game.prompt}&quot;</p>
          </div>

          <div className="mb-4 flex items-center gap-4 text-sm text-zinc-500">
            <span>{game.plays} plays</span>
            <button onClick={handleLike} className="transition hover:text-pink-400">
              ♥ {game.likes}
            </button>
          </div>

          <div className="space-y-2">
            <button
              onClick={handleCopy}
              className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-pink-500 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
            >
              {copied ? "Link copied!" : "Share game"}
            </button>
            <Link
              href="/create"
              className="block w-full rounded-xl border border-white/10 py-2.5 text-center text-sm text-zinc-300 transition hover:border-white/20 hover:text-white"
            >
              Create another
            </Link>
          </div>
        </div>

        {showControls && controls.length > 0 && (
          <div className="mt-4 rounded-2xl border border-white/5 bg-white/[0.02] p-5">
            <h3 className="mb-3 text-sm font-semibold">Controls</h3>
            <ul className="space-y-2">
              {controls.map((c) => (
                <li key={c} className="text-xs text-zinc-400">
                  {c}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      )}
    </div>
  );
}
