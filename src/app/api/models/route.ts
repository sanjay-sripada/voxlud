import { NextResponse } from "next/server";
import { isLlmConfigured } from "@/lib/env";
import { getLlmModelCatalog, type LlmProvider } from "@/lib/llm-provider";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const provider = searchParams.get("provider") as LlmProvider | null;
    const catalog = await getLlmModelCatalog(
      isLlmConfigured(),
      provider ?? undefined
    );
    return NextResponse.json(catalog);
  } catch (err) {
    console.error("Models list error:", err);
    return NextResponse.json({ error: "Failed to load models" }, { status: 500 });
  }
}
