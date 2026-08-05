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

  return {
    id: user.id,
    email: user.email ?? "",
    name:
      profile?.name ??
      meta.full_name ??
      meta.name ??
      user.email?.split("@")[0] ??
      "Player",
    avatarUrl: profile?.avatar_url ?? meta.avatar_url ?? null,
  };
}
