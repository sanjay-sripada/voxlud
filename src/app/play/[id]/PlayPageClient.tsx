"use client";

import { useEffect, useState, useCallback } from "react";
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

  return (
    <div className="mx-auto flex h-[calc(100vh-4rem)] max-w-6xl flex-col px-4 py-4 lg:flex-row lg:gap-6">
      <div className="flex flex-1 flex-col">
        {isNew && (
          <div className="mb-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-300">
            Your game is ready! Play it below, then share the link with friends.
          </div>
        )}

        <div
          className="relative flex-1 overflow-hidden rounded-2xl border border-white/5"
          style={{ minHeight: "400px" }}
        >
          <GameCanvas config={game.config} onScoreChange={setScore} />
        </div>

        <div className="mt-3 flex items-center justify-between text-sm text-zinc-500">
          <span>Score: {score}</span>
          <button
            onClick={() => setShowControls(!showControls)}
            className="text-zinc-400 hover:text-white"
          >
            {showControls ? "Hide controls" : "Show controls"}
          </button>
        </div>
      </div>

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
    </div>
  );
}
