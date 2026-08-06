"use client";

import { useEffect, useRef } from "react";
import type { ChatMessage } from "@/types/game";

interface ModelOption {
  id: string;
  label: string;
}

interface ProviderOption {
  id: string;
  label: string;
}

interface GameCreatorChatProps {
  messages: ChatMessage[];
  input: string;
  loading?: boolean;
  disabled?: boolean;
  models: ModelOption[];
  providers?: ProviderOption[];
  selectedModel: string;
  selectedProvider?: string | null;
  provider: string | null;
  llmConfigured?: boolean;
  examples?: string[];
  onInputChange: (value: string) => void;
  onModelChange: (modelId: string) => void;
  onProviderChange?: (providerId: string) => void;
  onSend: (text?: string) => void;
}

export default function GameCreatorChat({
  messages,
  input,
  loading = false,
  disabled = false,
  models,
  providers = [],
  selectedModel,
  selectedProvider,
  provider,
  llmConfigured = false,
  examples = [],
  onInputChange,
  onModelChange,
  onProviderChange,
  onSend,
}: GameCreatorChatProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  return (
    <div className="flex h-[min(640px,calc(100vh-12rem))] flex-col rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-sm">
      <div className="border-b border-white/5 px-4 py-3">
        <p className="text-sm font-medium text-white">Game designer chat</p>
        <p className="text-xs text-zinc-500">
          {llmConfigured
            ? "AI designs your game config from chat — pick a model below."
            : "Add an LLM API key to .env to design games with AI."}
        </p>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-4 text-sm text-zinc-500">
            Start with something like: &quot;A cozy cat cafe clicker with upgrades&quot; or &quot;Make
            a hard neon pong game for two players.&quot;
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                message.role === "user"
                  ? "bg-gradient-to-r from-indigo-500 to-pink-500 text-white"
                  : "border border-white/10 bg-white/[0.06] text-zinc-200"
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-2.5 text-sm text-zinc-400">
              <span className="h-2 w-2 animate-pulse rounded-full bg-indigo-400" />
              Designing your game...
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {examples.length > 0 && messages.length === 0 && (
        <div className="border-t border-white/5 px-4 py-3">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
            Try an example
          </p>
          <div className="flex flex-wrap gap-2">
            {examples.slice(0, 4).map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => onSend(ex)}
                disabled={loading || disabled}
                className="rounded-full border border-white/5 bg-white/[0.03] px-3 py-1.5 text-left text-xs text-zinc-400 transition hover:border-indigo-500/30 hover:text-white disabled:opacity-50"
              >
                {ex.length > 42 ? `${ex.slice(0, 42)}…` : ex}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="border-t border-white/5 p-3">
        <textarea
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          placeholder="Describe or refine your game..."
          rows={2}
          disabled={loading || disabled}
          className="mb-2 min-h-[44px] w-full resize-none rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white placeholder-zinc-500 outline-none focus:border-indigo-500/50 disabled:opacity-50"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSend();
            }
          }}
        />
        <div className="flex items-center gap-2">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
            {providers.length > 1 && onProviderChange && (
              <select
                value={selectedProvider ?? ""}
                onChange={(e) => onProviderChange(e.target.value)}
                disabled={loading || disabled}
                aria-label="AI provider"
                className="max-w-[140px] truncate rounded-lg border border-white/10 bg-zinc-900/80 px-2 py-1 text-xs text-zinc-300 outline-none focus:border-indigo-500/50"
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
                onChange={(e) => onModelChange(e.target.value)}
                disabled={loading || disabled}
                aria-label="Generation model"
                className="max-w-[200px] truncate rounded-lg border border-white/10 bg-zinc-900/80 px-2 py-1 text-xs text-zinc-300 outline-none focus:border-indigo-500/50"
              >
                {models.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.label}
                  </option>
                ))}
              </select>
            )}
            <span className="text-xs text-zinc-600">
              Enter to send · Shift+Enter for new line
              {llmConfigured && provider ? ` · AI: ${provider}` : ""}
            </span>
          </div>
          <button
            type="button"
            onClick={() => onSend()}
            disabled={loading || disabled || !input.trim()}
            className="ml-auto shrink-0 rounded-xl bg-gradient-to-r from-indigo-500 to-pink-500 px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
