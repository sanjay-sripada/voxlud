import { NextResponse } from "next/server";
import { getAllGames, getGamesByUserId } from "@/lib/games";
import { getAuthUser } from "@/lib/supabase/auth";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mine = searchParams.get("mine") === "true";

    if (mine) {
      const user = await getAuthUser();
      if (!user) {
        return NextResponse.json({ error: "Sign in required" }, { status: 401 });
      }
      const games = await getGamesByUserId(user.id);
      return NextResponse.json({ games });
    }

    const games = await getAllGames();
    return NextResponse.json({ games });
  } catch (err) {
    console.error("Games list error:", err);
    return NextResponse.json({ error: "Failed to load games" }, { status: 500 });
  }
}
