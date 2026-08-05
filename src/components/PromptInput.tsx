"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

interface PromptInputProps {
  placeholder?: string;
  examples?: string[];
  large?: boolean;
}

export default function PromptInput({
  placeholder = "Describe your game idea...",
  examples = [],
  large = false,
}: PromptInputProps) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const handleSubmit = async (text?: string) => {
    const value = text ?? prompt;
    if (!value.trim()) return;

    if (!authLoading && !user) {
      router.push(`/signin?callbackUrl=${encodeURIComponent("/create")}`);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: value.trim() }),
      });

      if (res.status === 401) {
        router.push(`/signin?callbackUrl=${encodeURIComponent("/create")}`);
        return;
      }

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Generation failed");
      }

      const data = await res.json();
      router.push(`/play/${data.game.id}?new=true`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
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
        <div className="flex items-center justify-between px-2 pb-1">
          <span className="text-xs text-zinc-600">
            {user ? "Enter to generate" : "Sign in to generate"} · Shift+Enter for new line
          </span>
          <button
            onClick={() => handleSubmit()}
            disabled={loading || !prompt.trim()}
            className="rounded-xl bg-gradient-to-r from-indigo-500 to-pink-500 px-6 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Generating...
              </span>
            ) : (
              "Generate Game"
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
