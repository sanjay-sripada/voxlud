import { Suspense } from "react";
import ExplorePageClient from "@/app/explore/ExplorePageClient";
import { getAllGames } from "@/lib/games";
import { isSupabaseConfigured } from "@/lib/env";

export default async function ExplorePage() {
  if (!isSupabaseConfigured()) {
    return (
      <div className="mx-auto max-w-lg px-6 py-24 text-center">
        <h1 className="mb-4 text-2xl font-bold">Setup required</h1>
        <p className="text-zinc-400">Configure Supabase in .env.local to browse games.</p>
      </div>
    );
  }

  let games: Awaited<ReturnType<typeof getAllGames>> = [];
  let error = "";

  try {
    games = await getAllGames();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    error =
      process.env.NODE_ENV === "development"
        ? `Could not load games: ${message}`
        : "Could not load games. Check your Supabase connection and run the migration.";
  }

  if (error) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="mb-10">
          <p className="mb-2 text-sm font-medium uppercase tracking-wider text-pink-400">
            Discover
          </p>
          <h1 className="mb-2 text-4xl font-bold">Explore games</h1>
        </div>
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500/30 border-t-indigo-500" />
        </div>
      }
    >
      <ExplorePageClient games={games} />
    </Suspense>
  );
}
