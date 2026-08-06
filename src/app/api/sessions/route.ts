import { NextResponse } from "next/server";
import { ensureAuthProfile } from "@/lib/supabase/auth";
import { createSession, getSessionById, listSessions } from "@/lib/sessions";

export async function POST() {
  try {
    const profile = await ensureAuthProfile();
    if (!profile) {
      return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    }

    const session = await createSession(profile.id);
    return NextResponse.json({ session });
  } catch (err) {
    console.error("Create session error:", err);
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const profile = await ensureAuthProfile();
    if (!profile) {
      return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      const sessions = await listSessions(profile.id);
      const drafts = sessions.filter(
        (s) => s.messages.length > 0 || s.currentConfig !== null
      );
      return NextResponse.json({ sessions: drafts });
    }

    const session = await getSessionById(id, profile.id);
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    return NextResponse.json({ session });
  } catch (err) {
    console.error("Get session error:", err);
    return NextResponse.json({ error: "Failed to load session" }, { status: 500 });
  }
}
