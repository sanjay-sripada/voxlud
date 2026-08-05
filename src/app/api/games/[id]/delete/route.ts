import { NextResponse } from "next/server";
import { deleteGame } from "@/lib/games";
import { getAuthUser } from "@/lib/supabase/auth";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    }

    const { id } = await params;
    const deleted = await deleteGame(id, user.id);

    if (!deleted) {
      return NextResponse.json({ error: "Game not found or not yours" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Delete game error:", err);
    return NextResponse.json({ error: "Failed to delete game" }, { status: 500 });
  }
}
