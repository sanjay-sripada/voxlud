"use client";

import { useState } from "react";
import type { OnlineRoomStatus } from "@/types/online-game";

interface OnlineRoomPanelProps {
  status: OnlineRoomStatus;
  roomId: string | null;
  opponentConnected: boolean;
  error: string | null;
  supported: boolean;
  onCreateRoom: () => void;
  onCopyLink: (roomId: string) => Promise<string>;
}

const STATUS_COPY: Record<OnlineRoomStatus, string> = {
  idle: "Create a room and share the link with a friend.",
  connecting: "Connecting to the room…",
  waiting: "Waiting for your opponent to join…",
  connected: "Opponent connected — start the match when ready.",
  unsupported: "Online multiplayer is only available for Pong games right now.",
  error: "Could not connect to the online room.",
};

export default function OnlineRoomPanel({
  status,
  roomId,
  opponentConnected,
  error,
  supported,
  onCreateRoom,
  onCopyLink,
}: OnlineRoomPanelProps) {
  const [copied, setCopied] = useState(false);

  if (!supported) {
    return (
      <div className="mb-4 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
        {STATUS_COPY.unsupported}
      </div>
    );
  }

  const handleCopy = async () => {
    if (!roomId) return;
    await onCopyLink(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mb-4 rounded-xl border border-indigo-500/20 bg-indigo-500/10 px-4 py-4">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-indigo-200">Online multiplayer</p>
        {roomId && (
          <span className="rounded-full bg-black/30 px-2 py-0.5 font-mono text-xs text-indigo-300">
            {roomId}
          </span>
        )}
      </div>

      <p className="mb-3 text-sm text-indigo-100/80">
        {error ?? STATUS_COPY[status]}
      </p>

      <div className="flex flex-wrap gap-2">
        {!roomId ? (
          <button
            type="button"
            onClick={onCreateRoom}
            className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-400"
          >
            Create room
          </button>
        ) : (
          <button
            type="button"
            onClick={handleCopy}
            className="rounded-lg border border-indigo-400/30 bg-black/20 px-4 py-2 text-sm text-indigo-200 transition hover:border-indigo-400/50"
          >
            {copied ? "Link copied!" : "Copy invite link"}
          </button>
        )}
      </div>

      {roomId && (
        <p className="mt-3 text-xs text-indigo-200/70">
          Host uses W/S · Guest uses I/K
          {opponentConnected ? " · Both players are in the room" : ""}
        </p>
      )}
    </div>
  );
}
