"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import GameCard from "@/components/GameCard";
import {
  filterAndSortGames,
  getAvailableGameTypes,
  parseExploreSort,
  type ExploreFilters,
  type ExploreSort,
} from "@/lib/filter-games";
import { MODE_LABELS, TYPE_LABELS } from "@/lib/game-labels";
import type { Game, GameMode, GameType } from "@/types/game";

const SORT_OPTIONS: { value: ExploreSort; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "plays", label: "Most played" },
  { value: "likes", label: "Most liked" },
  { value: "title", label: "A–Z" },
];

const MODE_OPTIONS: { value: GameMode | "all"; label: string }[] = [
  { value: "all", label: "All modes" },
  { value: "solo", label: MODE_LABELS.solo },
  { value: "local-multiplayer", label: MODE_LABELS["local-multiplayer"] },
  { value: "online", label: MODE_LABELS.online },
];

interface ExplorePageClientProps {
  games: Game[];
}

function filtersFromParams(searchParams: URLSearchParams): ExploreFilters {
  const type = searchParams.get("type");
  return {
    query: searchParams.get("q") ?? "",
    type: type && type in TYPE_LABELS ? (type as GameType) : "all",
    mode:
      searchParams.get("mode") === "solo" ||
      searchParams.get("mode") === "local-multiplayer" ||
      searchParams.get("mode") === "online"
        ? (searchParams.get("mode") as GameMode)
        : "all",
    sort: parseExploreSort(searchParams.get("sort")),
  };
}

function buildExploreUrl(filters: ExploreFilters): string {
  const params = new URLSearchParams();
  const q = filters.query.trim();
  if (q) params.set("q", q);
  if (filters.type !== "all") params.set("type", filters.type);
  if (filters.mode !== "all") params.set("mode", filters.mode);
  if (filters.sort !== "newest") params.set("sort", filters.sort);
  const query = params.toString();
  return query ? `/explore?${query}` : "/explore";
}

export default function ExplorePageClient({ games }: ExplorePageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<ExploreFilters>(() =>
    filtersFromParams(searchParams)
  );

  useEffect(() => {
    setFilters(filtersFromParams(searchParams));
  }, [searchParams]);

  const availableTypes = useMemo(() => getAvailableGameTypes(games), [games]);

  const filteredGames = useMemo(
    () => filterAndSortGames(games, filters),
    [games, filters]
  );

  const hasActiveFilters =
    filters.query.trim().length > 0 ||
    filters.type !== "all" ||
    filters.mode !== "all" ||
    filters.sort !== "newest";

  const updateFilters = useCallback((patch: Partial<ExploreFilters>) => {
    setFilters((current) => ({ ...current, ...patch }));
  }, []);

  useEffect(() => {
    const nextUrl = buildExploreUrl(filters);
    const currentUrl = buildExploreUrl(filtersFromParams(searchParams));
    if (nextUrl !== currentUrl) {
      router.replace(nextUrl, { scroll: false });
    }
  }, [filters, router, searchParams]);

  const clearFilters = () => {
    router.replace("/explore", { scroll: false });
    setFilters({
      query: "",
      type: "all",
      mode: "all",
      sort: "newest",
    });
  };

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

      <div className="mb-8 space-y-4 rounded-2xl border border-white/5 bg-white/[0.02] p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
              ⌕
            </span>
            <input
              type="search"
              value={filters.query}
              onChange={(e) => updateFilters({ query: e.target.value })}
              placeholder="Search by title, prompt, or author..."
              className="w-full rounded-xl border border-white/10 bg-black/20 py-2.5 pl-9 pr-4 text-sm text-white placeholder:text-zinc-500 focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
            />
          </div>
          <select
            value={filters.sort}
            onChange={(e) => updateFilters({ sort: e.target.value as ExploreSort })}
            className="rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white focus:border-indigo-500/50 focus:outline-none"
            aria-label="Sort games"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap gap-2">
          {MODE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => updateFilters({ mode: option.value })}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                filters.mode === option.value
                  ? "bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-500/40"
                  : "bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-zinc-200"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {availableTypes.length > 1 && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => updateFilters({ type: "all" })}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                filters.type === "all"
                  ? "bg-pink-500/20 text-pink-300 ring-1 ring-pink-500/40"
                  : "bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-zinc-200"
              }`}
            >
              All types
            </button>
            {availableTypes.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => updateFilters({ type })}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  filters.type === type
                    ? "bg-pink-500/20 text-pink-300 ring-1 ring-pink-500/40"
                    : "bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-zinc-200"
                }`}
              >
                {TYPE_LABELS[type]}
              </button>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-zinc-500">
          <span>
            {filteredGames.length} of {games.length} game{games.length === 1 ? "" : "s"}
          </span>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-indigo-400 transition hover:text-indigo-300"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {games.length === 0 ? (
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-12 text-center">
          <p className="text-zinc-400">No games yet. Be the first to create one!</p>
        </div>
      ) : filteredGames.length === 0 ? (
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-12 text-center">
          <p className="mb-4 text-zinc-400">No games match your search or filters.</p>
          <button
            type="button"
            onClick={clearFilters}
            className="text-sm text-indigo-400 transition hover:text-indigo-300"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredGames.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      )}
    </div>
  );
}
