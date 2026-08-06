"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import GameCreatorChat from "@/components/GameCreatorChat";
import CreationSessionHistory from "@/components/CreationSessionHistory";
import GamePreviewPanel from "@/components/GamePreviewPanel";
import { primaryPromptFromMessages } from "@/lib/build-generation-prompt";
import { FALLBACK_MODEL_ID } from "@/lib/llm-provider";
import type { ChatMessage, CreationSession, GameConfig, GenerationSource } from "@/types/game";

interface ModelOption {
  id: string;
  label: string;
}

interface ProviderOption {
  id: string;
  label: string;
  defaultModel: string;
  models: ModelOption[];
}

interface ModelCatalog {
  llmConfigured: boolean;
  provider: string | null;
  defaultModel: string;
  models: ModelOption[];
  providers?: ProviderOption[];
}

const MODEL_STORAGE_KEY = "voxlud-selected-model";
const PROVIDER_STORAGE_KEY = "voxlud-selected-provider";
const SESSION_STORAGE_KEY = "voxlud-creation-session";

function pickProviderCatalog(catalog: ModelCatalog, providerId: string | null) {
  const providers = catalog.providers ?? [];
  const activeId =
    providerId && providers.some((p) => p.id === providerId)
      ? providerId
      : catalog.provider ?? providers[0]?.id ?? null;
  const active = providers.find((p) => p.id === activeId);
  return {
    activeId,
    models: active?.models ?? catalog.models,
    defaultModel: active?.defaultModel ?? catalog.defaultModel,
  };
}

interface CreatePageClientProps {
  userName: string;
  examples: string[];
}

export default function CreatePageClient({ userName, examples }: CreatePageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const autoSent = useRef(false);
  const [modelsReady, setModelsReady] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [models, setModels] = useState<ModelOption[]>([]);
  const [providers, setProviders] = useState<ProviderOption[]>([]);
  const [selectedModel, setSelectedModel] = useState("");
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [provider, setProvider] = useState<string | null>(null);
  const [previewConfig, setPreviewConfig] = useState<GameConfig | null>(null);
  const [generationSource, setGenerationSource] = useState<GenerationSource | undefined>();
  const [generationModel, setGenerationModel] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [sessionRefreshKey, setSessionRefreshKey] = useState(0);
  const [llmConfigured, setLlmConfigured] = useState(false);

  const promptSummary = primaryPromptFromMessages(messages);

  useEffect(() => {
    let cancelled = false;

    async function loadModels() {
      try {
        const res = await fetch("/api/models");
        if (!res.ok) return;
        const catalog = (await res.json()) as ModelCatalog;
        if (cancelled) return;

        setProviders(catalog.providers ?? []);
        setLlmConfigured(catalog.llmConfigured);

        const storedProvider = localStorage.getItem(PROVIDER_STORAGE_KEY);
        const { activeId, models: providerModels, defaultModel } = pickProviderCatalog(
          catalog,
          storedProvider
        );

        setSelectedProvider(activeId);
        setProvider(activeId);
        setModels(providerModels);

        const stored = localStorage.getItem(MODEL_STORAGE_KEY);
        const storedOk =
          stored &&
          providerModels.some((m) => m.id === stored) &&
          !(catalog.llmConfigured && stored === FALLBACK_MODEL_ID);
        const initial = storedOk ? stored! : defaultModel;
        setSelectedModel(initial);
        if (catalog.llmConfigured && initial !== FALLBACK_MODEL_ID) {
          localStorage.setItem(MODEL_STORAGE_KEY, initial);
        }
        if (activeId) localStorage.setItem(PROVIDER_STORAGE_KEY, activeId);
      } catch {
        // ignore
      } finally {
        if (!cancelled) setModelsReady(true);
      }
    }

    loadModels();
    return () => {
      cancelled = true;
    };
  }, []);

  const initSession = useCallback(async () => {
    const storedId = localStorage.getItem(SESSION_STORAGE_KEY);

    if (storedId) {
      const res = await fetch(`/api/sessions?id=${encodeURIComponent(storedId)}`);
      if (res.ok) {
        const data = await res.json();
        setSessionId(data.session.id);
        setMessages(data.session.messages ?? []);
        setPreviewConfig(data.session.currentConfig ?? null);
        setSessionReady(true);
        return data.session.id as string;
      }
    }

    const res = await fetch("/api/sessions", { method: "POST" });
    if (!res.ok) throw new Error("Failed to start chat session");

    const data = await res.json();
    localStorage.setItem(SESSION_STORAGE_KEY, data.session.id);
    setSessionId(data.session.id);
    setSessionReady(true);
    return data.session.id as string;
  }, []);

  useEffect(() => {
    if (!modelsReady) return;
    initSession().catch(() => setError("Could not start chat session"));
  }, [modelsReady, initSession]);

  const handleProviderChange = (providerId: string) => {
    const entry = providers.find((p) => p.id === providerId);
    if (!entry) return;
    setSelectedProvider(providerId);
    setProvider(providerId);
    setModels(entry.models);
    localStorage.setItem(PROVIDER_STORAGE_KEY, providerId);
    const nextModel = entry.models.some((m) => m.id === entry.defaultModel)
      ? entry.defaultModel
      : entry.models[0]?.id ?? "";
    setSelectedModel(nextModel);
    if (nextModel) localStorage.setItem(MODEL_STORAGE_KEY, nextModel);
  };

  const handleModelChange = (modelId: string) => {
    setSelectedModel(modelId);
    localStorage.setItem(MODEL_STORAGE_KEY, modelId);
  };

  const sendMessage = async (text?: string) => {
    const value = (text ?? input).trim();
    if (!value || loading || saving) return;

    setLoading(true);
    setError("");
    setInput("");

    try {
      let activeSessionId = sessionId;
      if (!activeSessionId) {
        activeSessionId = await initSession();
      }

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: value,
          sessionId: activeSessionId,
          currentConfig: previewConfig,
          ...(selectedModel ? { model: selectedModel } : {}),
          ...(selectedProvider ? { provider: selectedProvider } : {}),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Generation failed");
      }

      const data = await res.json();
      localStorage.setItem(SESSION_STORAGE_KEY, data.sessionId);
      setSessionId(data.sessionId);
      setMessages(data.messages);
      setPreviewConfig(data.config);
      setGenerationSource(data.generationSource);
      setGenerationModel(data.model);
      setSessionRefreshKey((k) => k + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      if (!text) setInput(value);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const urlPrompt = searchParams.get("prompt");
    const urlModel = searchParams.get("model");
    const urlProvider = searchParams.get("provider");
    if (urlProvider && providers.some((p) => p.id === urlProvider)) {
      handleProviderChange(urlProvider);
    }
    if (urlModel && models.some((m) => m.id === urlModel)) {
      setSelectedModel(urlModel);
    }
    if (!urlPrompt || autoSent.current || !sessionReady) return;

    autoSent.current = true;
    router.replace("/create", { scroll: false });
    void sendMessage(urlPrompt);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once when session is ready
  }, [searchParams, sessionReady, models]);

  const handlePublish = async () => {
    if (!previewConfig || messages.length === 0) return;

    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: promptSummary,
          config: previewConfig,
          sessionId,
          chatHistory: messages,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to publish game");
      }

      const data = await res.json();
      localStorage.removeItem(SESSION_STORAGE_KEY);
      router.push(`/play/${data.game.id}?new=true`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to publish game");
    } finally {
      setSaving(false);
    }
  };

  const handleResumeSession = (session: CreationSession) => {
    localStorage.setItem(SESSION_STORAGE_KEY, session.id);
    setSessionId(session.id);
    setMessages(session.messages ?? []);
    setPreviewConfig(session.currentConfig ?? null);
    setInput("");
    setError("");
    setGenerationSource(undefined);
    setSessionReady(true);
  };

  const handleNewChat = async () => {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    setMessages([]);
    setPreviewConfig(null);
    setInput("");
    setSessionId(null);
    setSessionReady(false);
    setError("");
    await initSession();
    setSessionRefreshKey((k) => k + 1);
  };

  return (
    <div className="relative mx-auto max-w-7xl px-6 py-10 lg:py-16">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 left-1/4 h-[400px] w-[600px] rounded-full bg-indigo-600/15 blur-[100px]" />
        <div className="absolute right-0 top-1/3 h-[300px] w-[400px] rounded-full bg-pink-600/10 blur-[100px]" />
      </div>

      <div className="relative mb-8 flex flex-col gap-4 lg:mb-10 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-2 text-sm font-medium uppercase tracking-wider text-indigo-400">
            Create
          </p>
          <h1 className="mb-2 text-3xl font-bold lg:text-4xl">Make a game</h1>
          <p className="text-zinc-400">
            Chat to design your game with AI, preview live on the right, then publish when ready.
            {llmConfigured ? " Games are configured by the LLM you pick below." : " Add an API key in .env to enable AI game design."}
          </p>
          <p className="mt-1 text-sm text-indigo-400">Signed in as {userName}</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <CreationSessionHistory
            currentSessionId={sessionId}
            disabled={loading || saving || !sessionReady}
            refreshKey={sessionRefreshKey}
            onSelect={handleResumeSession}
          />
          <button
            type="button"
            onClick={handleNewChat}
            disabled={loading || saving}
            className="shrink-0 rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-400 transition hover:border-white/20 hover:text-white disabled:opacity-50"
          >
            New chat
          </button>
        </div>
      </div>

      <div className="relative grid gap-8 lg:grid-cols-2 lg:gap-10">
        <div className="flex flex-col gap-4">
          <GameCreatorChat
            messages={messages}
            input={input}
            loading={loading}
            disabled={!sessionReady || saving}
            models={models}
            providers={providers}
            selectedModel={selectedModel}
            selectedProvider={selectedProvider}
            provider={provider}
            llmConfigured={llmConfigured}
            examples={examples}
            onInputChange={setInput}
            onModelChange={handleModelChange}
            onProviderChange={handleProviderChange}
            onSend={sendMessage}
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
        </div>

        <div className="lg:sticky lg:top-20 lg:self-start">
          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-pink-400">
            Live preview
          </p>
          <GamePreviewPanel
            config={previewConfig}
            prompt={promptSummary}
            loading={loading && messages.length === 0}
            saving={saving}
            generationSource={generationSource}
            generationModel={generationModel}
            generationProvider={provider}
            onConfigChange={setPreviewConfig}
            onRegenerate={() => {
              const lastUser = [...messages].reverse().find((m) => m.role === "user");
              if (lastUser) void sendMessage(lastUser.content);
            }}
            onSave={handlePublish}
          />
        </div>
      </div>
    </div>
  );
}
