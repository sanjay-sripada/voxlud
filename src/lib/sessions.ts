import { nanoid } from "nanoid";
import { createClient } from "@/lib/supabase/server";
import type { ChatMessage, CreationSession, GameConfig } from "@/types/game";
import type { Database } from "@/types/database";

type SessionRow = Database["public"]["Tables"]["creation_sessions"]["Row"];

function rowToSession(row: SessionRow): CreationSession {
  return {
    id: row.id,
    userId: row.user_id,
    messages: (row.messages as ChatMessage[]) ?? [],
    currentConfig: (row.current_config as GameConfig | null) ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function createSession(userId: string): Promise<CreationSession> {
  const supabase = await createClient();
  const id = nanoid(12);

  const { data, error } = await supabase
    .from("creation_sessions")
    .insert({
      id,
      user_id: userId,
      messages: [],
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return rowToSession(data);
}


export async function listSessions(
  userId: string,
  limit = 30
): Promise<CreationSession[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("creation_sessions")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return (data ?? []).map(rowToSession);
}

export async function getSessionById(
  id: string,
  userId: string
): Promise<CreationSession | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("creation_sessions")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? rowToSession(data) : null;
}

export async function updateSession(
  id: string,
  userId: string,
  update: {
    messages: ChatMessage[];
    currentConfig?: GameConfig | null;
  }
): Promise<CreationSession> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("creation_sessions")
    .update({
      messages: update.messages,
      current_config: update.currentConfig ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return rowToSession(data);
}

export async function deleteSession(id: string, userId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("creation_sessions")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
}
