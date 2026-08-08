import { NextResponse } from "next/server";
import { getGameByIdForUser } from "@/lib/games";
import { ensureAuthProfile } from "@/lib/supabase/auth";

/** Load a published game for editing (owner only). */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const profile = await ensureAuthProfile();
    if (!profile) {
      return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    }

    const { id } = await params;
    const game = await getGameByIdForUser(id, profile.id);

    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    return NextResponse.json({ game });
  } catch (err) {
    console.error("Load game for edit error:", err);
    return NextResponse.json({ error: "Failed to load game" }, { status: 500 });
  }
}
