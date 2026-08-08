import { generateGameFromPrompt } from "@/lib/generator";
import { buildGenerationPrompt } from "@/lib/build-generation-prompt";
import { generateGameConfigWithLlm } from "@/lib/llm";
import { LlmGenerationError } from "@/lib/llm-errors";
import { isLlmConfigured, isParserFallbackAllowed } from "@/lib/env";
import { FALLBACK_MODEL_ID, resolveLlmProviderConfig, type LlmProvider } from "@/lib/llm-provider";
import type { ChatMessage, GameConfig, GenerationSource } from "@/types/game";

export interface GenerateGameOptions {
  model?: string;
  provider?: LlmProvider;
  messages?: ChatMessage[];
  currentConfig?: GameConfig | null;
}

export interface GenerateGameOutcome {
  config: GameConfig;
  source: GenerationSource;
  model?: string;
}

export async function generateGame(
  promptOrMessages: string | ChatMessage[],
  options: GenerateGameOptions = {}
): Promise<GenerateGameOutcome> {
  const model = options.model?.trim();
  const messages = Array.isArray(promptOrMessages)
    ? promptOrMessages
    : options.messages ?? [];

  const prompt =
    typeof promptOrMessages === "string"
      ? promptOrMessages
      : buildGenerationPrompt(messages, options.currentConfig);

  if (model === FALLBACK_MODEL_ID) {
    if (!isParserFallbackAllowed() && isLlmConfigured()) {
      throw new LlmGenerationError(
        "Built-in parser is disabled. Pick an AI model in the dropdown to design games with the LLM."
      );
    }
    return {
      config: generateGameFromPrompt(prompt),
      source: "fallback",
      model: FALLBACK_MODEL_ID,
    };
  }

  if (!isLlmConfigured()) {
    if (isParserFallbackAllowed()) {
      return {
        config: generateGameFromPrompt(prompt),
        source: "fallback",
        model: FALLBACK_MODEL_ID,
      };
    }
    throw new LlmGenerationError(
      "No LLM API key configured. Add GROQ_API_KEY or OPENAI_API_KEY to .env, or set LLM_ALLOW_PARSER_FALLBACK=true to use the built-in parser."
    );
  }

  try {
    const llmConfig = await generateGameConfigWithLlm(prompt, {
      model,
      provider: options.provider,
      messages: messages.length > 0 ? messages : undefined,
      currentConfig: options.currentConfig,
    });
    const resolved = resolveLlmProviderConfig(model, options.provider);
    return { config: llmConfig, source: "llm", model: model || resolved.model };
  } catch (err) {
    if (isParserFallbackAllowed()) {
      console.warn("LLM failed, using parser fallback:", err);
      return {
        config: generateGameFromPrompt(prompt),
        source: "fallback",
        model: FALLBACK_MODEL_ID,
      };
    }
    throw err;
  }
}
