import { NextResponse } from "next/server";
import { getAllGames, getGamesByUserId, publishGame } from "@/lib/games";
import { parseGameConfig } from "@/lib/game-config-validator";
import { deleteSession } from "@/lib/sessions";
import { ensureAuthProfile, getAuthUser } from "@/lib/supabase/auth";
import type { PublishGameRequest } from "@/types/game";

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

export async function POST(request: Request) {
  try {
    const profile = await ensureAuthProfile();
    if (!profile) {
      return NextResponse.json({ error: "Sign in to publish games" }, { status: 401 });
    }

    const body = (await request.json()) as PublishGameRequest;
    const prompt = body.prompt?.trim();
    const parsedConfig = parseGameConfig(body.config);

    if (!prompt || prompt.length < 3) {
      return NextResponse.json({ error: "Prompt must be at least 3 characters" }, { status: 400 });
    }

    if (!parsedConfig) {
      return NextResponse.json({ error: "Invalid game configuration" }, { status: 400 });
    }

    const game = await publishGame({
      prompt,
      config: parsedConfig,
      userId: profile.id,
      author: profile.name,
      featured: false,
      chatHistory: body.chatHistory ?? [],
    });

    if (body.sessionId) {
      await deleteSession(body.sessionId, profile.id).catch(() => undefined);
    }

    return NextResponse.json({ game });
  } catch (err) {
    console.error("Publish game error:", err);
    return NextResponse.json({ error: "Failed to publish game" }, { status: 500 });
  }
}
