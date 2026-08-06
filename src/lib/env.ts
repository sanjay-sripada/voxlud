export function getSupabaseUrl() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  }
  return url;
}

export function getSupabaseAnonKey() {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
  return key;
}

const PLACEHOLDER_PATTERNS = [
  "your-project",
  "your-anon-key",
  "your_supabase",
  "example.com",
];

function isPlaceholder(value: string | undefined) {
  if (!value) return true;
  const lower = value.toLowerCase();
  return PLACEHOLDER_PATTERNS.some((pattern) => lower.includes(pattern));
}

export function isSupabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return !!(url && key && !isPlaceholder(url) && !isPlaceholder(key));
}

export function getSiteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
  );
}

function firstConfiguredKey(...keys: Array<string | undefined>) {
  for (const key of keys) {
    if (key && !isPlaceholder(key)) return key;
  }
  return undefined;
}

import type { LlmProvider } from "@/lib/llm-provider";

/** When false (default), LLM failures surface as errors instead of silent parser fallback. */
export function isParserFallbackAllowed() {
  return process.env.LLM_ALLOW_PARSER_FALLBACK === "true";
}

function openAiKey(): string | undefined {
  const key = process.env.OPENAI_API_KEY;
  if (!key || isPlaceholder(key)) return undefined;
  if (key.startsWith("sk-or-")) return undefined;
  return key;
}

function openRouterKey(): string | undefined {
  return firstConfiguredKey(
    process.env.OPENROUTER_API_KEY,
    process.env.OPENAI_API_KEY?.startsWith("sk-or-") ? process.env.OPENAI_API_KEY : undefined
  );
}

export function isProviderConfigured(provider: LlmProvider): boolean {
  switch (provider) {
    case "groq":
      return !!firstConfiguredKey(process.env.GROQ_API_KEY);
    case "huggingface":
      return !!firstConfiguredKey(process.env.HUGGINGFACE_API_KEY, process.env.HF_TOKEN);
    case "openrouter":
      return !!openRouterKey();
    case "openai":
      return !!openAiKey() || !!firstConfiguredKey(process.env.LLM_API_KEY);
    case "ollama":
      return (
        process.env.LLM_PROVIDER?.toLowerCase() === "ollama" ||
        process.env.OLLAMA_ENABLED === "true"
      );
    default:
      return false;
  }
}

export function getConfiguredLlmProviders(): LlmProvider[] {
  const providers: LlmProvider[] = [];
  if (isProviderConfigured("groq")) providers.push("groq");
  if (isProviderConfigured("openai")) providers.push("openai");
  if (isProviderConfigured("openrouter")) providers.push("openrouter");
  if (isProviderConfigured("huggingface")) providers.push("huggingface");
  if (isProviderConfigured("ollama")) providers.push("ollama");
  return providers;
}

export function getDefaultLlmProvider(): LlmProvider | null {
  const configured = getConfiguredLlmProviders();
  if (configured.length === 0) return null;

  const preferred = process.env.LLM_PROVIDER?.toLowerCase().trim();
  if (preferred && configured.includes(preferred as LlmProvider)) {
    return preferred as LlmProvider;
  }
  return configured[0];
}

/** API key for a specific LLM provider. */
export function getLlmApiKey(provider?: LlmProvider) {
  const generic = firstConfiguredKey(process.env.LLM_API_KEY);
  const resolved = provider ?? getDefaultLlmProvider();

  if (!resolved) {
    throw new Error(
      "Missing LLM API key. Set GROQ_API_KEY, OPENAI_API_KEY, OPENROUTER_API_KEY, or HUGGINGFACE_API_KEY."
    );
  }

  if (generic && resolved === "openai") return generic;

  switch (resolved) {
    case "groq": {
      const key = firstConfiguredKey(process.env.GROQ_API_KEY);
      if (key) return key;
      break;
    }
    case "huggingface": {
      const key = firstConfiguredKey(process.env.HUGGINGFACE_API_KEY, process.env.HF_TOKEN);
      if (key) return key;
      break;
    }
    case "openrouter": {
      const key = openRouterKey();
      if (key) return key;
      break;
    }
    case "ollama":
      return "ollama";
    case "openai": {
      const key = openAiKey();
      if (key) return key;
      break;
    }
  }

  throw new Error(`Missing API key for LLM provider "${resolved}".`);
}

/** @deprecated Use getLlmApiKey */
export function getOpenAiApiKey() {
  return getLlmApiKey();
}

export function getOpenAiBaseUrl() {
  return process.env.LLM_BASE_URL ?? process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1";
}

export function getOpenAiModel() {
  return process.env.LLM_MODEL ?? process.env.OPENAI_MODEL ?? "gpt-4o-mini";
}

export function isLlmConfigured() {
  return getConfiguredLlmProviders().length > 0;
}
