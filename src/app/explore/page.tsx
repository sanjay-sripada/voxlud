import GameCard from "@/components/GameCard";
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

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <div className="mb-10">
        <p className="mb-2 text-sm font-medium uppercase tracking-wider text-pink-400">
          Discover
        </p>
        <h1 className="mb-2 text-4xl font-bold">Explore games</h1>
        <p className="text-zinc-400">
          Browse AI-generated games from the community. Play instantly in your browser.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {games.length === 0 && !error ? (
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-12 text-center">
          <p className="text-zinc-400">No games yet. Be the first to create one!</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {games.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      )}
    </div>
  );
}
