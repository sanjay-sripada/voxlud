import { createClient } from "@/lib/supabase/server";

export async function getAuthUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;
  return user;
}

function profileNameFromUser(user: {
  email?: string | null;
  user_metadata?: Record<string, unknown>;
}) {
  const meta = user.user_metadata ?? {};
  return (
    (typeof meta.full_name === "string" && meta.full_name) ||
    (typeof meta.name === "string" && meta.name) ||
    user.email?.split("@")[0] ||
    "Player"
  );
}

export async function getAuthProfile() {
  const user = await getAuthUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("name, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  const meta = user.user_metadata ?? {};
  const avatarUrl =
    profile?.avatar_url ??
    (typeof meta.avatar_url === "string" ? meta.avatar_url : null);

  return {
    id: user.id,
    email: user.email ?? "",
    name: profile?.name ?? profileNameFromUser(user),
    avatarUrl,
  };
}

/** Ensures a profiles row exists (fixes games_user_id_fkey for users created before the DB trigger). */
export async function ensureAuthProfile() {
  const user = await getAuthUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("profiles")
    .select("name, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  const meta = user.user_metadata ?? {};
  const name = existing?.name ?? profileNameFromUser(user);
  const avatarUrl =
    existing?.avatar_url ??
    (typeof meta.avatar_url === "string" ? meta.avatar_url : null);

  if (!existing) {
    const { error } = await supabase.from("profiles").insert({
      id: user.id,
      name,
      avatar_url: avatarUrl,
    });

    if (error && !error.message.includes("duplicate")) {
      console.error("Profile create failed:", error.message);
      return null;
    }
  }

  return {
    id: user.id,
    email: user.email ?? "",
    name,
    avatarUrl,
  };
}
