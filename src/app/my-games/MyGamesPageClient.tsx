"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import GameCard from "@/components/GameCard";
import type { Game } from "@/types/game";

export default function MyGamesPageClient() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push("/signin?callbackUrl=/my-games");
      return;
    }

    fetch("/api/games?mine=true")
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || "Failed to load games");
        setGames(data.games || []);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load games"))
      .finally(() => setLoading(false));
  }, [user, authLoading, router]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this game? This cannot be undone.")) return;

    const res = await fetch(`/api/games/${id}/delete`, { method: "DELETE" });
    if (res.ok) {
      setGames((prev) => prev.filter((g) => g.id !== id));
    }
  };

  const displayName =
    user?.user_metadata?.full_name ??
    user?.user_metadata?.name ??
    user?.email?.split("@")[0] ??
    "you";

  if (authLoading || loading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500/30 border-t-indigo-500" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-sm font-medium uppercase tracking-wider text-indigo-400">
            Your library
          </p>
          <h1 className="mb-2 text-4xl font-bold">My games</h1>
          <p className="text-zinc-400">Published games by {displayName}</p>
        </div>
        <Link
          href="/create"
          className="inline-flex rounded-full bg-gradient-to-r from-indigo-500 to-pink-500 px-6 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
        >
          Create new game
        </Link>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {games.length === 0 ? (
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-12 text-center">
          <p className="mb-4 text-zinc-400">
            You haven&apos;t published any games yet. Create a game and hit Publish when you&apos;re
            ready.
          </p>
          <Link
            href="/create"
            className="inline-flex rounded-full bg-gradient-to-r from-indigo-500 to-pink-500 px-6 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
          >
            Create your first game
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {games.map((game) => (
            <div key={game.id} className="group relative">
              <GameCard game={game} />
              <button
                onClick={() => handleDelete(game.id)}
                className="absolute top-3 right-3 rounded-lg bg-black/60 px-2 py-1 text-xs text-red-400 opacity-0 transition group-hover:opacity-100 hover:bg-black/80"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
