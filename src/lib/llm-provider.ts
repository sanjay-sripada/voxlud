import { getConfiguredLlmProviders, getDefaultLlmProvider, isParserFallbackAllowed, isProviderConfigured } from "@/lib/env";

export type LlmProvider = "openai" | "groq" | "huggingface" | "ollama" | "openrouter";

export const FALLBACK_MODEL_ID = "fallback";

export interface LlmModelOption {
  id: string;
  label: string;
}

export interface LlmProviderConfig {
  provider: LlmProvider;
  baseUrl: string;
  model: string;
  supportsJsonMode: boolean;
}

export interface LlmProviderCatalog {
  id: LlmProvider;
  label: string;
  defaultModel: string;
  models: LlmModelOption[];
}

export interface LlmModelCatalog {
  llmConfigured: boolean;
  provider: LlmProvider | null;
  defaultModel: string;
  models: LlmModelOption[];
  providers: LlmProviderCatalog[];
}

const PROVIDER_DEFAULTS: Record<
  LlmProvider,
  { baseUrl: string; model: string; supportsJsonMode: boolean }
> = {
  openai: {
    baseUrl: "https://api.openai.com/v1",
    model: "gpt-4o-mini",
    supportsJsonMode: true,
  },
  groq: {
    baseUrl: "https://api.groq.com/openai/v1",
    model: "llama-3.1-8b-instant",
    supportsJsonMode: false,
  },
  huggingface: {
    baseUrl: "https://router.huggingface.co/v1",
    model: "meta-llama/Meta-Llama-3.1-8B-Instruct",
    supportsJsonMode: false,
  },
  ollama: {
    baseUrl: "http://localhost:11434/v1",
    model: "llama3.2",
    supportsJsonMode: false,
  },
  openrouter: {
    baseUrl: "https://openrouter.ai/api/v1",
    model: "meta-llama/llama-3.2-3b-instruct",
    supportsJsonMode: false,
  },
};

export const PROVIDER_MODELS: Record<LlmProvider, LlmModelOption[]> = {
  openai: [
    { id: "gpt-4o-mini", label: "GPT-4o Mini" },
    { id: "gpt-4o", label: "GPT-4o" },
    { id: "gpt-4.1-mini", label: "GPT-4.1 Mini" },
    { id: "gpt-4.1-nano", label: "GPT-4.1 Nano" },
  ],
  groq: [
    { id: "llama-3.1-8b-instant", label: "Llama 3.1 8B (fast)" },
    { id: "llama-3.3-70b-versatile", label: "Llama 3.3 70B" },
    { id: "mixtral-8x7b-32768", label: "Mixtral 8x7B" },
    { id: "gemma2-9b-it", label: "Gemma 2 9B" },
  ],
  huggingface: [
    { id: "meta-llama/Meta-Llama-3.1-8B-Instruct", label: "Llama 3.1 8B" },
    { id: "meta-llama/Meta-Llama-3.1-70B-Instruct", label: "Llama 3.1 70B" },
    { id: "Qwen/Qwen2.5-7B-Instruct", label: "Qwen 2.5 7B" },
    { id: "mistralai/Mistral-7B-Instruct-v0.3", label: "Mistral 7B" },
  ],
  ollama: [
    { id: "llama3.2", label: "Llama 3.2" },
    { id: "llama3.1", label: "Llama 3.1" },
    { id: "mistral", label: "Mistral" },
    { id: "phi3", label: "Phi-3" },
  ],
  openrouter: [
    { id: "meta-llama/llama-3.2-3b-instruct", label: "Llama 3.2 3B" },
    { id: "qwen/qwen-2.5-7b-instruct", label: "Qwen 2.5 7B" },
    { id: "google/gemma-2-9b-it", label: "Gemma 2 9B" },
    { id: "openai/gpt-4o-mini", label: "GPT-4o Mini" },
  ],
};

const PROVIDER_LABELS: Record<LlmProvider, string> = {
  openai: "OpenAI",
  groq: "Groq",
  huggingface: "Hugging Face",
  ollama: "Ollama (local)",
  openrouter: "OpenRouter",
};

const FALLBACK_MODEL: LlmModelOption = {
  id: FALLBACK_MODEL_ID,
  label: "Built-in parser (no API)",
};

function normalizeProvider(value: string | undefined): LlmProvider | null {
  if (!value) return null;
  const normalized = value.toLowerCase().trim();
  if (normalized in PROVIDER_DEFAULTS) {
    return normalized as LlmProvider;
  }
  return null;
}

function detectProviderFromBaseUrl(baseUrl: string): LlmProvider {
  const url = baseUrl.toLowerCase();
  if (url.includes("groq.com")) return "groq";
  if (url.includes("huggingface.co")) return "huggingface";
  if (url.includes("openrouter.ai")) return "openrouter";
  if (url.includes("localhost:11434") || url.includes("127.0.0.1:11434")) return "ollama";
  return "openai";
}

export function resolveLlmProviderConfig(
  modelOverride?: string,
  providerOverride?: LlmProvider
): LlmProviderConfig {
  const configured = getConfiguredLlmProviders();
  const explicit = providerOverride ?? normalizeProvider(process.env.LLM_PROVIDER);
  const baseUrlOverride = process.env.LLM_BASE_URL ?? process.env.OPENAI_BASE_URL;
  const modelOverrideEnv = process.env.LLM_MODEL ?? process.env.OPENAI_MODEL;

  const provider =
    (explicit && configured.includes(explicit) ? explicit : null) ??
    getDefaultLlmProvider() ??
    (baseUrlOverride ? detectProviderFromBaseUrl(baseUrlOverride) : "openai");

  const defaults = PROVIDER_DEFAULTS[provider];
  const model = modelOverride ?? modelOverrideEnv ?? defaults.model;

  return {
    provider,
    baseUrl: baseUrlOverride ?? defaults.baseUrl,
    model,
    supportsJsonMode: defaults.supportsJsonMode,
  };
}

function parseEnvModelList(): LlmModelOption[] {
  const raw = process.env.LLM_MODELS;
  if (!raw?.trim()) return [];

  return raw
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((id) => ({ id, label: id }));
}

function ensureDefaultInList(models: LlmModelOption[], defaultModel: string): LlmModelOption[] {
  if (models.some((m) => m.id === defaultModel)) return models;
  return [{ id: defaultModel, label: defaultModel }, ...models];
}

async function fetchOpenRouterModels(): Promise<LlmModelOption[] | null> {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/models", {
      signal: AbortSignal.timeout(5000),
      next: { revalidate: 3600 },
    });
    if (!response.ok) return null;

    const data = (await response.json()) as {
      data?: Array<{
        id: string;
        name: string;
        pricing?: { prompt?: string; completion?: string };
      }>;
    };

    const models = (data.data ?? [])
      .filter((m) => {
        const promptPrice = parseFloat(m.pricing?.prompt ?? "1");
        const completionPrice = parseFloat(m.pricing?.completion ?? "1");
        return promptPrice === 0 && completionPrice === 0;
      })
      .slice(0, 12)
      .map((m) => ({
        id: m.id,
        label: m.name.length > 40 ? `${m.name.slice(0, 37)}...` : m.name,
      }));

    return models.length > 0 ? models : null;
  } catch {
    return null;
  }
}

async function fetchOllamaModels(baseUrl: string): Promise<LlmModelOption[] | null> {
  try {
    const origin = baseUrl.replace(/\/v1\/?$/, "");
    const response = await fetch(`${origin}/api/tags`, {
      signal: AbortSignal.timeout(2500),
    });
    if (!response.ok) return null;

    const data = (await response.json()) as {
      models?: Array<{ name: string }>;
    };

    const models = data.models?.map((m) => ({ id: m.name, label: m.name }));
    return models?.length ? models : null;
  } catch {
    return null;
  }
}

async function getModelsForProvider(provider: LlmProvider): Promise<LlmModelOption[]> {
  const config = resolveLlmProviderConfig(undefined, provider);
  const envModels = parseEnvModelList();

  let providerModels =
    envModels.length > 0 ? envModels : [...PROVIDER_MODELS[provider]];

  if (provider === "ollama" && envModels.length === 0) {
    const liveModels = await fetchOllamaModels(config.baseUrl);
    if (liveModels) providerModels = liveModels;
  }

  if (provider === "openrouter" && envModels.length === 0) {
    const liveModels = await fetchOpenRouterModels();
    if (liveModels) providerModels = liveModels;
  }

  return ensureDefaultInList(providerModels, config.model);
}

export async function getLlmModelCatalog(
  llmConfigured: boolean,
  activeProvider?: LlmProvider
): Promise<LlmModelCatalog> {
  if (!llmConfigured) {
    return {
      llmConfigured: false,
      provider: null,
      defaultModel: FALLBACK_MODEL_ID,
      models: [FALLBACK_MODEL],
      providers: [],
    };
  }

  const configuredIds = getConfiguredLlmProviders();
  const providerCatalogs: LlmProviderCatalog[] = [];

  for (const id of configuredIds) {
    if (!isProviderConfigured(id)) continue;
    const models = await getModelsForProvider(id);
    const config = resolveLlmProviderConfig(undefined, id);
    providerCatalogs.push({
      id,
      label: PROVIDER_LABELS[id],
      defaultModel: config.model,
      models,
    });
  }

  const defaultProvider = getDefaultLlmProvider();
  const provider =
    activeProvider && providerCatalogs.some((p) => p.id === activeProvider)
      ? activeProvider
      : defaultProvider && providerCatalogs.some((p) => p.id === defaultProvider)
        ? defaultProvider
        : providerCatalogs[0]?.id ?? null;

  const active = providerCatalogs.find((p) => p.id === provider);
  let models = active?.models ?? [];

  if (isParserFallbackAllowed()) {
    models = [...models, FALLBACK_MODEL];
  }

  return {
    llmConfigured: true,
    provider,
    defaultModel: active?.defaultModel ?? FALLBACK_MODEL_ID,
    models,
    providers: providerCatalogs,
  };
}

export function isAllowedModel(
  model: string,
  catalog: LlmModelCatalog,
  provider?: LlmProvider
): boolean {
  if (provider) {
    const entry = catalog.providers.find((p) => p.id === provider);
    if (entry?.models.some((m) => m.id === model)) return true;
  }
  return catalog.models.some((m) => m.id === model);
}

export function getProviderSetupHint(provider: LlmProvider): string {
  const hints: Record<LlmProvider, string> = {
    openai: "OPENAI_API_KEY=sk-...",
    groq: "LLM_PROVIDER=groq and GROQ_API_KEY=gsk_... (or OPENAI_API_KEY)",
    huggingface: "LLM_PROVIDER=huggingface and HUGGINGFACE_API_KEY=hf_... (or OPENAI_API_KEY)",
    ollama: "LLM_PROVIDER=ollama (run: ollama pull llama3.2)",
    openrouter: "LLM_PROVIDER=openrouter and OPENAI_API_KEY=sk-or-...",
  };
  return hints[provider];
}
