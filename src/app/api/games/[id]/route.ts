import { NextResponse } from "next/server";
import { getGameById, incrementPlays, likeGame } from "@/lib/games";

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
