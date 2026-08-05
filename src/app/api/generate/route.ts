import { NextResponse } from "next/server";
import { getAuthProfile } from "@/lib/supabase/auth";
import { generateGameFromPrompt, getGenerationDelay } from "@/lib/generator";
import { saveGame } from "@/lib/games";
import type { GenerateRequest } from "@/types/game";

export async function POST(request: Request) {
  try {
    const profile = await getAuthProfile();
    if (!profile) {
      return NextResponse.json({ error: "Sign in to create games" }, { status: 401 });
    }

    const body = (await request.json()) as GenerateRequest;
    const prompt = body.prompt?.trim();

    if (!prompt || prompt.length < 3) {
      return NextResponse.json({ error: "Prompt must be at least 3 characters" }, { status: 400 });
    }

    if (prompt.length > 500) {
      return NextResponse.json({ error: "Prompt must be under 500 characters" }, { status: 400 });
    }

    const start = Date.now();
    const delay = getGenerationDelay();
    await new Promise((r) => setTimeout(r, delay));

    const config = generateGameFromPrompt(prompt);
    const game = await saveGame({
      prompt,
      config,
      userId: profile.id,
      author: profile.name,
      featured: false,
    });

    return NextResponse.json({
      game,
      generationTimeMs: Date.now() - start,
    });
  } catch (err) {
    console.error("Generate error:", err);
    return NextResponse.json({ error: "Failed to generate game" }, { status: 500 });
  }
}
