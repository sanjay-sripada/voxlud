import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { applyConfigRefinements } from "@/lib/apply-config-refinements";
import { primaryPromptFromMessages } from "@/lib/build-generation-prompt";
import { assistantReplyForConfig } from "@/lib/describe-game-config";
import { generateGame } from "@/lib/generate-game";
import { LlmGenerationError } from "@/lib/llm-errors";
import { createSession, getSessionById, updateSession } from "@/lib/sessions";
import { isLlmConfigured } from "@/lib/env";
import { getLlmModelCatalog, isAllowedModel, resolveLlmProviderConfig, type LlmProvider } from "@/lib/llm-provider";
import { ensureAuthProfile } from "@/lib/supabase/auth";
import type { ChatMessage, GenerateRequest } from "@/types/game";

function createChatMessage(role: ChatMessage["role"], content: string): ChatMessage {
  return {
    id: nanoid(10),
    role,
    content,
    createdAt: new Date().toISOString(),
  };
}

/** Preview-only chat generation. Persists messages to creation_sessions. */
export async function POST(request: Request) {
  try {
    const profile = await ensureAuthProfile();
    if (!profile) {
      return NextResponse.json(
        { error: "Sign in to create games, or sign out and back in if this persists." },
        { status: 401 }
      );
    }

    const body = (await request.json()) as GenerateRequest;
    const userMessage = (body.message ?? body.prompt)?.trim();
    const model = body.model?.trim();
    const provider = body.provider?.trim() as LlmProvider | undefined;
    let sessionId = body.sessionId?.trim();

    if (!userMessage || userMessage.length < 3) {
      return NextResponse.json({ error: "Message must be at least 3 characters" }, { status: 400 });
    }

    if (userMessage.length > 500) {
      return NextResponse.json({ error: "Message must be under 500 characters" }, { status: 400 });
    }

    if (model) {
      const catalog = await getLlmModelCatalog(isLlmConfigured(), provider);
      if (!isAllowedModel(model, catalog, provider)) {
        return NextResponse.json({ error: "Invalid model selection" }, { status: 400 });
      }
    }

    let session = sessionId ? await getSessionById(sessionId, profile.id) : null;
    if (!session) {
      session = await createSession(profile.id);
      sessionId = session.id;
    }

    const userChatMessage = createChatMessage("user", userMessage);
    const messages = [...session.messages, userChatMessage];
    const currentConfig = body.currentConfig ?? session.currentConfig;

    const start = Date.now();
    const { config: rawConfig, source, model: usedModel } = await generateGame(messages, {
      model,
      provider,
      messages,
      currentConfig,
    });

    const resolvedProvider =
      source === "llm" ? resolveLlmProviderConfig(model, provider).provider : null;
    const resolvedModel =
      usedModel ?? (model || (source === "llm" ? resolveLlmProviderConfig(model, provider).model : undefined));

    console.info(
      `[generate] source=${source} provider=${resolvedProvider ?? "n/a"} model=${resolvedModel ?? "n/a"}`
    );

    const config = applyConfigRefinements(rawConfig, userMessage, messages, source);
    const assistantMessage = createChatMessage(
      "assistant",
      assistantReplyForConfig(config, { source, model: resolvedModel, provider: resolvedProvider })
    );
    const updatedMessages = [...messages, assistantMessage];

    await updateSession(sessionId!, profile.id, {
      messages: updatedMessages,
      currentConfig: config,
    });

    return NextResponse.json({
      sessionId,
      messages: updatedMessages,
      config,
      prompt: primaryPromptFromMessages(updatedMessages),
      generationTimeMs: Date.now() - start,
      generationSource: source,
      model: resolvedModel,
      provider: resolvedProvider,
    });
  } catch (err) {
    console.error("Generate error:", err);
    if (err instanceof LlmGenerationError) {
      return NextResponse.json({ error: err.message, code: "llm_failed" }, { status: 502 });
    }
    return NextResponse.json({ error: "Failed to generate preview" }, { status: 500 });
  }
}
