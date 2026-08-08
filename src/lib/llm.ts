import type { ChatMessage, GameConfig } from "@/types/game";
import { buildGenerationPrompt } from "@/lib/build-generation-prompt";
import { getGameConfigSchemaHint, parseGameConfig } from "@/lib/game-config-validator";
import { getLlmApiKey, isLlmConfigured, isParserFallbackAllowed } from "@/lib/env";
import { parseLlmJsonContent } from "@/lib/parse-llm-json";
import { resolveLlmProviderConfig, type LlmProvider } from "@/lib/llm-provider";
import { LlmGenerationError } from "@/lib/llm-errors";

const SYSTEM_PROMPT = `You are a game designer for Voxlud, a browser game generator.
Given a user's text prompt, output a single playable arcade game configuration.
Pick the best matching game type and tune settings to reflect the prompt (difficulty, theme, mechanics).
Use vivid hex colors in theme that match the mood (cozy, neon, space, retro, etc.).
For two-player or versus prompts use "local-multiplayer". For online/remote prompts use "online". Otherwise "solo".

Always set "emoji" to a single character emoji that represents the player/hero in the game (e.g. "🚗" for car, "🐱" for cat cafe, "🚀" for space). Match the user's theme — never omit emoji.

${getGameConfigSchemaHint()}

Respond with valid JSON only. No markdown, no code fences, no explanation.`;

interface ChatCompletionResponse {
  choices?: Array<{ message?: { content?: string } }>;
}

export interface LlmGenerateOptions {
  model?: string;
  provider?: LlmProvider;
  messages?: ChatMessage[];
  currentConfig?: GameConfig | null;
}

async function callLlm(
  prompt: string,
  useJsonMode: boolean,
  model?: string,
  provider?: LlmProvider
): Promise<string> {
  const { baseUrl, model: resolvedModel, provider: resolvedProvider } =
    resolveLlmProviderConfig(model, provider);
  const apiKey = getLlmApiKey(resolvedProvider);

  const llmMessages: Array<{ role: string; content: string }> = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: prompt },
  ];

  const body: Record<string, unknown> = {
    model: resolvedModel,
    temperature: 0.7,
    max_tokens: 2048,
    messages: llmMessages,
    tool_choice: "none",
  };

  if (useJsonMode) {
    body.response_format = { type: "json_object" };
  }

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...(baseUrl.includes("openrouter.ai")
        ? {
            "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
            "X-Title": "Voxlud",
          }
        : {}),
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`LLM request failed (${response.status}): ${errorBody.slice(0, 300)}`);
  }

  const data = (await response.json()) as ChatCompletionResponse & {
    choices?: Array<{
      finish_reason?: string;
      message?: { content?: string | null; refusal?: string | null };
    }>;
  };

  const choice = data.choices?.[0];
  const content = choice?.message?.content?.trim();
  const refusal = choice?.message?.refusal?.trim();

  if (content) return content;

  const finish = choice?.finish_reason ?? "unknown";
  if (refusal) {
    throw new Error(`LLM refused (${finish}): ${refusal.slice(0, 200)}`);
  }

  throw new Error(
    `LLM returned empty response (${resolvedProvider}/${resolvedModel}, finish=${finish}). Try another model or provider.`
  );
}

async function requestGameConfig(
  prompt: string,
  model?: string,
  provider?: LlmProvider
): Promise<unknown> {
  const { supportsJsonMode } = resolveLlmProviderConfig(model, provider);

  if (supportsJsonMode) {
    try {
      const content = await callLlm(prompt, true, model, provider);
      return parseLlmJsonContent(content);
    } catch (err) {
      console.warn("LLM json_mode request failed, retrying without json_mode:", err);
    }
  }

  const content = await callLlm(prompt, false, model, provider);
  return parseLlmJsonContent(content);
}

export async function generateGameConfigWithLlm(
  prompt: string,
  options: LlmGenerateOptions = {}
): Promise<GameConfig> {
  if (!isLlmConfigured()) {
    throw new LlmGenerationError(
      "No LLM API key configured. Add GROQ_API_KEY, OPENAI_API_KEY, or another provider key to .env."
    );
  }

  const effectivePrompt =
    options.messages && options.messages.length > 0
      ? buildGenerationPrompt(options.messages, options.currentConfig)
      : prompt;

  let lastError: unknown;
  try {
    const raw = await requestGameConfig(effectivePrompt, options.model, options.provider);
    const config = parseGameConfig(raw);
    if (!config) {
      throw new LlmGenerationError(
        "The AI returned game settings we could not parse. Try again or pick a different model."
      );
    }
    return config;
  } catch (err) {
    lastError = err;
    if (err instanceof LlmGenerationError) throw err;
    console.error("LLM generation failed:", err);
  }

  const detail =
    lastError instanceof Error ? lastError.message : "Unknown LLM error";
  throw new LlmGenerationError(
    `AI game design failed: ${detail.slice(0, 280)}`
  );
}

export function getActiveLlmProvider() {
  return resolveLlmProviderConfig().provider;
}
