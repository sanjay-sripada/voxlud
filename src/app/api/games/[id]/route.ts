import { NextResponse } from "next/server";
import { getGameById, getGameByIdForUser, incrementPlays, likeGame, updateGame } from "@/lib/games";
import { parseGameConfig } from "@/lib/game-config-validator";
import { ensureAuthProfile } from "@/lib/supabase/auth";
import type { UpdateGameRequest } from "@/types/game";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const game = await getGameById(id);

    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    return NextResponse.json({ game });
  } catch (err) {
    console.error("Get game error:", err);
    return NextResponse.json({ error: "Failed to load game" }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (body.action === "play") {
      await incrementPlays(id);
      return NextResponse.json({ ok: true });
    }

    if (body.action === "like") {
      const likes = await likeGame(id);
      return NextResponse.json({ likes });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    console.error("Game action error:", err);
    return NextResponse.json({ error: "Action failed" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const profile = await ensureAuthProfile();
    if (!profile) {
      return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    }

    const { id } = await params;
    const existing = await getGameByIdForUser(id, profile.id);
    if (!existing) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    const body = (await request.json()) as UpdateGameRequest;
    const prompt = body.prompt?.trim();
    const parsedConfig = parseGameConfig(body.config);

    if (!prompt || prompt.length < 3) {
      return NextResponse.json({ error: "Prompt must be at least 3 characters" }, { status: 400 });
    }

    if (!parsedConfig) {
      return NextResponse.json({ error: "Invalid game configuration" }, { status: 400 });
    }

    const game = await updateGame(id, profile.id, {
      prompt,
      config: parsedConfig,
      chatHistory: body.chatHistory ?? [],
    });

    return NextResponse.json({ game });
  } catch (err) {
    console.error("Update game error:", err);
    return NextResponse.json({ error: "Failed to update game" }, { status: 500 });
  }
}
