"use client";

import { useCallback, useEffect, useState } from "react";
import { getSessionLabel } from "@/lib/session-label";
import type { CreationSession } from "@/types/game";

interface CreationSessionHistoryProps {
  currentSessionId: string | null;
  disabled?: boolean;
  refreshKey?: number;
  onSelect: (session: CreationSession) => void;
}

function formatWhen(iso: string): string {
  const date = new Date(iso);
  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function CreationSessionHistory({
  currentSessionId,
  disabled = false,
  refreshKey = 0,
  onSelect,
}: CreationSessionHistoryProps) {
  const [open, setOpen] = useState(false);
  const [sessions, setSessions] = useState<CreationSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadSessions = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/sessions");
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to load sessions");
      }

      const data = await res.json();
      setSessions(data.sessions ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load sessions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    void loadSessions();
  }, [open, refreshKey, loadSessions]);

  const otherSessions = sessions.filter((s) => s.id !== currentSessionId);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        disabled={disabled}
        className="shrink-0 rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-400 transition hover:border-white/20 hover:text-white disabled:opacity-50"
      >
        Previous chats
        {otherSessions.length > 0 && (
          <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 text-xs text-zinc-300">
            {otherSessions.length}
          </span>
        )}
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close previous chats"
            className="fixed inset-0 z-40 bg-black/40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 z-50 mt-2 w-[min(22rem,calc(100vw-3rem))] rounded-2xl border border-white/10 bg-zinc-950/95 p-2 shadow-2xl backdrop-blur-md">
            <div className="border-b border-white/5 px-3 py-2">
              <p className="text-sm font-medium text-white">Previous chats</p>
              <p className="text-xs text-zinc-500">Resume a draft you started earlier</p>
            </div>

            <div className="max-h-80 overflow-y-auto p-1">
              {loading && (
                <div className="flex items-center justify-center py-8">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-500/30 border-t-indigo-500" />
                </div>
              )}

              {!loading && error && (
                <p className="px-3 py-4 text-sm text-red-400">{error}</p>
              )}

              {!loading && !error && otherSessions.length === 0 && (
                <p className="px-3 py-6 text-center text-sm text-zinc-500">
                  No other drafts yet. Chats save automatically while you work.
                </p>
              )}

              {!loading &&
                !error &&
                otherSessions.map((session) => (
                  <button
                    key={session.id}
                    type="button"
                    onClick={() => {
                      onSelect(session);
                      setOpen(false);
                    }}
                    className="flex w-full flex-col gap-1 rounded-xl px-3 py-2.5 text-left transition hover:bg-white/[0.06]"
                  >
                    <span className="line-clamp-2 text-sm text-zinc-200">
                      {getSessionLabel(session)}
                    </span>
                    <span className="flex items-center gap-2 text-xs text-zinc-500">
                      <span>{formatWhen(session.updatedAt)}</span>
                      <span>·</span>
                      <span>
                        {session.messages.length} message
                        {session.messages.length === 1 ? "" : "s"}
                      </span>
                      {session.currentConfig?.title && (
                        <>
                          <span>·</span>
                          <span className="truncate">{session.currentConfig.title}</span>
                        </>
                      )}
                    </span>
                  </button>
                ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
