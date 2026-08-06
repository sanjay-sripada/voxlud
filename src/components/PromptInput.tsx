"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

interface ModelOption {
  id: string;
  label: string;
}

interface ModelCatalog {
  llmConfigured: boolean;
  provider: string | null;
  defaultModel: string;
  models: ModelOption[];
  providers?: Array<{ id: string; label: string; defaultModel: string; models: ModelOption[] }>;
}

interface PromptInputProps {
  placeholder?: string;
  examples?: string[];
  large?: boolean;
}

const MODEL_STORAGE_KEY = "voxlud-selected-model";
const PROVIDER_STORAGE_KEY = "voxlud-selected-provider";

export default function PromptInput({
  placeholder = "Describe your game idea...",
  examples = [],
  large = false,
}: PromptInputProps) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [models, setModels] = useState<ModelOption[]>([]);
  const [providers, setProviders] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedModel, setSelectedModel] = useState("");
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [provider, setProvider] = useState<string | null>(null);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    let cancelled = false;

    async function loadModels() {
      try {
        const res = await fetch("/api/models");
        if (!res.ok) return;

        const catalog = (await res.json()) as ModelCatalog;
        if (cancelled) return;

        const list = catalog.providers ?? [];
        setProviders(list.map((p) => ({ id: p.id, label: p.label })));

        const storedProvider = localStorage.getItem(PROVIDER_STORAGE_KEY);
        const activeId =
          storedProvider && list.some((p) => p.id === storedProvider)
            ? storedProvider
            : catalog.provider ?? list[0]?.id ?? null;
        const active = list.find((p) => p.id === activeId);

        setSelectedProvider(activeId);
        setProvider(activeId);
        setModels(active?.models ?? catalog.models);

        const stored = localStorage.getItem(MODEL_STORAGE_KEY);
        const initial =
          stored && (active?.models ?? catalog.models).some((m) => m.id === stored)
            ? stored
            : active?.defaultModel ?? catalog.defaultModel;
        setSelectedModel(initial);
      } catch {
        // Dropdown stays hidden if models fail to load
      }
    }

    loadModels();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleProviderChange = (providerId: string) => {
    setSelectedProvider(providerId);
    setProvider(providerId);
    localStorage.setItem(PROVIDER_STORAGE_KEY, providerId);
    void fetch(`/api/models?provider=${encodeURIComponent(providerId)}`)
      .then((r) => r.json())
      .then((catalog: ModelCatalog) => {
        setModels(catalog.models);
        setSelectedModel(catalog.defaultModel);
        localStorage.setItem(MODEL_STORAGE_KEY, catalog.defaultModel);
      });
  };

  const handleModelChange = (modelId: string) => {
    setSelectedModel(modelId);
    localStorage.setItem(MODEL_STORAGE_KEY, modelId);
  };

  const goToCreate = (value: string) => {
    const trimmed = value.trim();
    const params = new URLSearchParams({ prompt: trimmed });
    if (selectedModel) params.set("model", selectedModel);
    if (selectedProvider) params.set("provider", selectedProvider);
    router.push(`/create?${params.toString()}`);
  };

  const handleSubmit = (text?: string) => {
    const value = text ?? prompt;
    if (!value.trim()) return;

    if (!authLoading && !user) {
      const params = new URLSearchParams({ prompt: value.trim() });
      if (selectedModel) params.set("model", selectedModel);
    if (selectedProvider) params.set("provider", selectedProvider);
      const callback = `/create?${params.toString()}`;
      router.push(`/signin?callbackUrl=${encodeURIComponent(callback)}`);
      return;
    }

    setLoading(true);
    setError("");
    goToCreate(value);
    setLoading(false);
  };

  return (
    <div className="w-full">
      <div
        className={`relative rounded-2xl border border-white/10 bg-white/[0.04] p-2 backdrop-blur-sm transition focus-within:border-indigo-500/50 ${
          large ? "shadow-2xl shadow-indigo-500/10" : ""
        }`}
      >
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={placeholder}
          rows={large ? 3 : 2}
          className={`w-full resize-none bg-transparent px-4 py-3 text-white placeholder-zinc-500 outline-none ${
            large ? "text-lg" : "text-base"
          }`}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
        />
        <div className="flex items-center gap-2 px-2 pb-1">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
            {providers.length > 1 && (
              <select
                value={selectedProvider ?? ""}
                onChange={(e) => handleProviderChange(e.target.value)}
                disabled={loading}
                aria-label="AI provider"
                className="max-w-[140px] truncate rounded-lg border border-white/10 bg-zinc-900/80 px-2.5 py-1.5 text-xs text-zinc-300 outline-none transition hover:border-white/20 focus:border-indigo-500/50 disabled:opacity-50"
              >
                {providers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            )}
            {models.length > 0 && (
              <select
                value={selectedModel}
                onChange={(e) => handleModelChange(e.target.value)}
                disabled={loading}
                aria-label="Generation model"
                className="max-w-[220px] truncate rounded-lg border border-white/10 bg-zinc-900/80 px-2.5 py-1.5 text-xs text-zinc-300 outline-none transition hover:border-white/20 focus:border-indigo-500/50 disabled:opacity-50"
              >
                {models.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.label}
                  </option>
                ))}
              </select>
            )}
            <span className="text-xs text-zinc-600">
              {user ? "Enter to preview" : "Sign in to create"} · Shift+Enter for new line
              {provider ? ` · ${provider}` : ""}
            </span>
          </div>
          <button
            onClick={() => handleSubmit()}
            disabled={loading || !prompt.trim()}
            className="ml-auto shrink-0 rounded-xl bg-gradient-to-r from-indigo-500 to-pink-500 px-6 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Opening...
              </span>
            ) : (
              "Create game"
            )}
          </button>
        </div>
      </div>

      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}

      {examples.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {examples.map((ex) => (
            <button
              key={ex}
              onClick={() => {
                setPrompt(ex);
                handleSubmit(ex);
              }}
              disabled={loading}
              className="rounded-full border border-white/5 bg-white/[0.03] px-3 py-1.5 text-left text-xs text-zinc-400 transition hover:border-indigo-500/30 hover:text-white disabled:opacity-50"
            >
              {ex}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
