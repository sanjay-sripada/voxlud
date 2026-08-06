import { nanoid } from "nanoid";
import { createClient } from "@/lib/supabase/server";
import type { ChatMessage, Game, GameConfig } from "@/types/game";
import type { Database } from "@/types/database";

type GameRow = Database["public"]["Tables"]["games"]["Row"];

function rowToGame(row: GameRow): Game {
  return {
    id: row.id,
    userId: row.user_id,
    prompt: row.prompt,
    config: row.config as GameConfig,
    author: row.author,
    plays: row.plays,
    likes: row.likes,
    featured: row.featured,
    published: row.published,
    chatHistory: (row.chat_history as Game["chatHistory"]) ?? [],
    createdAt: row.created_at,
  };
}

export async function getAllGames(): Promise<Game[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("games")
    .select("*")
    .eq("published", true)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map(rowToGame);
}

export async function getGameById(id: string): Promise<Game | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("games").select("*").eq("id", id).maybeSingle();

  if (error) throw new Error(error.message);
  return data ? rowToGame(data) : null;
}

export async function getGamesByUserId(userId: string): Promise<Game[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("games")
    .select("*")
    .eq("user_id", userId)
    .eq("published", true)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map(rowToGame);
}

export async function publishGame(
  game: Omit<Game, "id" | "plays" | "likes" | "createdAt" | "published"> & {
    chatHistory?: ChatMessage[];
  }
): Promise<Game> {
  const supabase = await createClient();
  const id = nanoid(10);

  const { data, error } = await supabase
    .from("games")
    .insert({
      id,
      user_id: game.userId,
      prompt: game.prompt,
      config: game.config,
      author: game.author,
      featured: game.featured,
      published: true,
      chat_history: game.chatHistory ?? [],
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return rowToGame(data);
}

/** @deprecated Use publishGame */
export async function saveGame(
  game: Omit<Game, "id" | "plays" | "likes" | "createdAt" | "published">
): Promise<Game> {
  return publishGame(game);
}

export async function deleteGame(id: string, userId: string): Promise<boolean> {
  const supabase = await createClient();
  const { error, count } = await supabase
    .from("games")
    .delete({ count: "exact" })
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
  return (count ?? 0) > 0;
}

export async function incrementPlays(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("increment_game_plays", { game_id: id });
  if (error) throw new Error(error.message);
}

export async function likeGame(id: string): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("increment_game_likes", { game_id: id });
  if (error) throw new Error(error.message);
  return data ?? 0;
}
