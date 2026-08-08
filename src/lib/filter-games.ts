import type { Game, GameMode, GameType } from "@/types/game";

export type ExploreSort = "newest" | "plays" | "likes" | "title";

export interface ExploreFilters {
  query: string;
  type: GameType | "all";
  mode: GameMode | "all";
  sort: ExploreSort;
}

const SORT_VALUES: ExploreSort[] = ["newest", "plays", "likes", "title"];

export function parseExploreSort(value: string | null): ExploreSort {
  if (value && SORT_VALUES.includes(value as ExploreSort)) {
    return value as ExploreSort;
  }
  return "newest";
}

export function filterAndSortGames(games: Game[], filters: ExploreFilters): Game[] {
  let result = [...games];

  const q = filters.query.trim().toLowerCase();
  if (q) {
    result = result.filter((game) => {
      const haystack = [
        game.config.title,
        game.config.description,
        game.prompt,
        game.author,
        game.config.type,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }

  if (filters.type !== "all") {
    result = result.filter((game) => game.config.type === filters.type);
  }

  if (filters.mode !== "all") {
    result = result.filter((game) => game.config.mode === filters.mode);
  }

  switch (filters.sort) {
    case "plays":
      result.sort((a, b) => b.plays - a.plays || b.likes - a.likes);
      break;
    case "likes":
      result.sort((a, b) => b.likes - a.likes || b.plays - a.plays);
      break;
    case "title":
      result.sort((a, b) => a.config.title.localeCompare(b.config.title));
      break;
    case "newest":
    default:
      result.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }

  return result;
}

export function getAvailableGameTypes(games: Game[]): GameType[] {
  return [...new Set(games.map((game) => game.config.type))].sort();
}
