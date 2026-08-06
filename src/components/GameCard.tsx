import Link from "next/link";
import type { Game } from "@/types/game";

const TYPE_LABELS: Record<string, string> = {
  pong: "Pong",
  snake: "Snake",
  breakout: "Arcade",
  runner: "Runner",
  clicker: "Clicker",
  flappy: "Flappy",
  shooter: "Shooter",
  tetris: "Tetris",
  memory: "Memory",
  whack: "Whack",
  dodge: "Dodge",
  slide: "2048",
  catch: "Catch",
  cross: "Cross",
  stack: "Stack",
  simon: "Simon",
  reaction: "Reflex",
};

const MODE_LABELS: Record<string, string> = {
  solo: "Solo",
  "local-multiplayer": "Local MP",
  online: "Online",
};

interface GameCardProps {
  game: Game;
}

export default function GameCard({ game }: GameCardProps) {
  const { config } = game;

  return (
    <Link
      href={`/play/${game.id}`}
      className="group relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.03] transition hover:border-indigo-500/30 hover:bg-white/[0.06]"
    >
      <div
        className="flex h-40 items-center justify-center"
        style={{
          background: `linear-gradient(135deg, ${config.theme.background}, ${config.theme.primary}22)`,
        }}
      >
        <div className="text-5xl opacity-80 transition group-hover:scale-110">
          {config.type === "pong" && "🏓"}
          {config.type === "snake" && "🐍"}
          {config.type === "breakout" && "🧱"}
          {config.type === "runner" && "🏃"}
          {config.type === "clicker" && "☕"}
          {config.type === "flappy" && "🐦"}
          {config.type === "shooter" && "🚀"}
          {config.type === "tetris" && "🧩"}
          {config.type === "memory" && "🃏"}
          {config.type === "whack" && "🔨"}
          {config.type === "dodge" && "💨"}
          {config.type === "slide" && "🔢"}
          {config.type === "catch" && "🧺"}
          {config.type === "cross" && "🐸"}
          {config.type === "stack" && "🗼"}
          {config.type === "simon" && "🎨"}
          {config.type === "reaction" && "⚡"}
        </div>
      </div>
      <div className="p-4">
        <div className="mb-2 flex items-center gap-2">
          <span
            className="rounded-full px-2 py-0.5 text-xs font-medium"
            style={{ background: config.theme.primary + "33", color: config.theme.primary }}
          >
            {TYPE_LABELS[config.type]}
          </span>
          <span className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-zinc-400">
            {MODE_LABELS[config.mode]}
          </span>
        </div>
        <h3 className="mb-1 line-clamp-1 font-semibold text-white">{config.title}</h3>
        <p className="mb-3 line-clamp-2 text-sm text-zinc-500">{config.description}</p>
        <div className="flex items-center justify-between text-xs text-zinc-500">
          <span>by {game.author}</span>
          <span>{game.plays} plays · {game.likes} likes</span>
        </div>
      </div>
    </Link>
  );
}
