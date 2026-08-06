"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import GameCanvas from "@/components/GameCanvas";
import {
  GAME_MODE_LABELS,
  GAME_TYPE_EMOJI,
  GAME_TYPE_LABELS,
} from "@/lib/game-labels";
import { describeGameConfig, getDisplayEmoji } from "@/lib/describe-game-config";
import type { GameConfig } from "@/types/game";

interface GamePreviewPanelProps {
  config: GameConfig | null;
  prompt: string;
  loading?: boolean;
  saving?: boolean;
  generationSource?: string;
  generationModel?: string;
  generationProvider?: string | null;
  onConfigChange: (config: GameConfig) => void;
  onRegenerate: () => void;
  onSave: () => void;
  publishLabel?: string;
}

function formatSettingValue(value: unknown): string {
  if (typeof value === "boolean") return value ? "on" : "off";
  if (typeof value === "number") return String(value);
  if (typeof value === "string") return value;
  return "";
}

function GamePreviewLiveCanvas({ config }: { config: GameConfig }) {
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [replayKey, setReplayKey] = useState(0);

  const displayEmoji = getDisplayEmoji(config) || GAME_TYPE_EMOJI[config.type] || "🎮";

  const configSignature = useMemo(
    () =>
      JSON.stringify({
        type: config.type,
        mode: config.mode,
        settings: config.settings,
        emoji: config.emoji,
        theme: config.theme,
      }),
    [config]
  );

  const handleGameOver = useCallback((endedScore: number) => {
    setFinalScore(endedScore);
    setGameOver(true);
  }, []);

  const handleReplay = useCallback(() => {
    setGameOver(false);
    setScore(0);
    setFinalScore(0);
    setReplayKey((key) => key + 1);
  }, []);

  useEffect(() => {
    setGameOver(false);
    setScore(0);
    setFinalScore(0);
    setReplayKey((key) => key + 1);
  }, [configSignature]);

  return (
    <div
      className="relative min-h-[280px] flex-1 overflow-hidden rounded-2xl border border-white/10"
      style={{ background: config.theme.background }}
    >
      <GameCanvas
        key={replayKey}
        config={config}
        active
        onScoreChange={setScore}
        onGameOver={handleGameOver}
      />
      <div
        className="pointer-events-none absolute left-3 top-3 rounded-lg px-2.5 py-1 text-lg"
        style={{ background: `${config.theme.primary}33` }}
      >
        {displayEmoji}
      </div>
      <div className="absolute right-3 top-3 z-10 flex items-center gap-2">
        <span className="rounded-lg bg-black/50 px-2.5 py-1 text-sm font-medium text-white backdrop-blur-sm">
          {score}
        </span>
        <button
          type="button"
          onClick={handleReplay}
          className="rounded-lg bg-black/50 px-2.5 py-1 text-xs font-medium text-zinc-200 backdrop-blur-sm transition hover:bg-black/70 hover:text-white"
        >
          Replay
        </button>
      </div>

      {gameOver && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-[#0a0a12]/85 px-4 backdrop-blur-sm">
          <div className="text-center">
            <p className="mb-1 text-xs font-medium uppercase tracking-wider text-pink-400">
              Game over
            </p>
            <p className="text-sm text-zinc-400">
              Score: <span className="font-semibold text-white">{finalScore}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={handleReplay}
            className="rounded-xl bg-gradient-to-r from-indigo-500 to-pink-500 px-6 py-2 text-sm font-medium text-white transition hover:opacity-90"
          >
            Play again
          </button>
        </div>
      )}
    </div>
  );
}

export default function GamePreviewPanel({
  config,
  prompt,
  loading = false,
  saving = false,
  generationSource,
  generationModel,
  generationProvider,
  onConfigChange,
  onRegenerate,
  onSave,
  publishLabel = "Publish & play",
}: GamePreviewPanelProps) {
  if (loading) {
    return (
      <div className="flex h-full min-h-[480px] flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02] p-8">
        <div className="mb-4 h-10 w-10 animate-spin rounded-full border-2 border-indigo-500/30 border-t-indigo-500" />
        <p className="text-sm text-zinc-400">Building your game...</p>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="flex h-full min-h-[480px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center">
        <div className="mb-4 text-5xl opacity-40">🎮</div>
        <h2 className="mb-2 text-lg font-semibold text-zinc-300">Preview</h2>
        <p className="max-w-xs text-sm text-zinc-500">
          Describe a game on the left and hit Generate. Preview it here, edit the details, then
          publish to add it to My games.
        </p>
      </div>
    );
  }

  const settingEntries = Object.entries(config.settings).filter(
    ([key, value]) =>
      key !== "playerEmoji" &&
      value !== undefined &&
      value !== null &&
      value !== ""
  );

  const whatYouAreBuilding = describeGameConfig(config);

  return (
    <div className="flex h-full flex-col gap-4">
      <GamePreviewLiveCanvas config={config} />

      <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-4">
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-indigo-300">
          What you&apos;re building
        </p>
        <div className="space-y-1 text-sm text-zinc-300 whitespace-pre-line">
          {whatYouAreBuilding}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span
            className="rounded-full px-2.5 py-0.5 text-xs font-medium"
            style={{
              background: `${config.theme.primary}33`,
              color: config.theme.primary,
            }}
          >
            {GAME_TYPE_LABELS[config.type] ?? config.type}
          </span>
          <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-xs text-zinc-400">
            {GAME_MODE_LABELS[config.mode] ?? config.mode}
          </span>
          {generationSource && (
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs ${
                generationSource === "llm"
                  ? "bg-indigo-500/20 text-indigo-300"
                  : "bg-amber-500/15 text-amber-400"
              }`}
              title={
                generationSource === "llm"
                  ? `Designed by ${generationProvider ?? "AI"}${generationModel ? ` (${generationModel})` : ""}`
                  : "Keyword-based parser, not AI"
              }
            >
              {generationSource === "llm"
                ? `AI · ${generationModel ?? generationProvider ?? "llm"}`
                : "built-in parser"}
            </span>
          )}
        </div>

        <label className="mb-3 block">
          <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-zinc-500">
            Player emoji
          </span>
          <input
            type="text"
            value={config.emoji ?? ""}
            onChange={(e) =>
              onConfigChange({
                ...config,
                emoji: e.target.value,
                settings: { ...config.settings, playerEmoji: e.target.value },
              })
            }
            placeholder="🚗"
            className="w-20 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-center text-lg outline-none focus:border-indigo-500/50"
          />
        </label>

        <label className="mb-3 block">
          <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-zinc-500">
            Title
          </span>
          <input
            type="text"
            value={config.title}
            onChange={(e) => onConfigChange({ ...config, title: e.target.value })}
            className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500/50"
          />
        </label>

        <label className="mb-4 block">
          <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-zinc-500">
            Description
          </span>
          <textarea
            value={config.description}
            onChange={(e) => onConfigChange({ ...config, description: e.target.value })}
            rows={2}
            className="w-full resize-none rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500/50"
          />
        </label>

        {settingEntries.length > 0 && (
          <div className="mb-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
              Game settings
            </p>
            <div className="flex flex-wrap gap-1.5">
              {settingEntries.map(([key, value]) => (
                <span
                  key={key}
                  className="rounded-md bg-white/5 px-2 py-1 text-xs text-zinc-400"
                >
                  {key}: {formatSettingValue(value)}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="mb-4 rounded-lg bg-white/[0.03] p-3">
          <p className="mb-1 text-xs font-medium uppercase tracking-wider text-zinc-500">
            Chat summary
          </p>
          <p className="text-sm text-zinc-400">
            {prompt ? `"${prompt}"` : "Your conversation will appear here after the first message."}
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={onRegenerate}
            disabled={saving}
            className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm font-medium text-zinc-300 transition hover:border-white/20 hover:text-white disabled:opacity-50"
          >
            Regenerate
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saving || !config.title.trim()}
            className="flex-1 rounded-xl bg-gradient-to-r from-indigo-500 to-pink-500 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving ? "Publishing..." : publishLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
