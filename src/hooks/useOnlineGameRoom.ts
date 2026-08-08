"use client";

import { useCallback, useEffect, useRef, useState, type MutableRefObject } from "react";
import { useRouter } from "next/navigation";
import { nanoid } from "nanoid";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/env";
import type { OnlineGameSessionRef, OnlineRole, OnlineRoomStatus } from "@/types/online-game";

interface UseOnlineGameRoomOptions {
  gameId: string;
  roomId: string | null;
  enabled: boolean;
  sessionRef: MutableRefObject<OnlineGameSessionRef>;
  onRemoteGameOver?: (score: number) => void;
}

export function useOnlineGameRoom({
  gameId,
  roomId,
  enabled,
  sessionRef,
  onRemoteGameOver,
}: UseOnlineGameRoomOptions) {
  const router = useRouter();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const [status, setStatus] = useState<OnlineRoomStatus>("idle");
  const [opponentConnected, setOpponentConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createRoom = useCallback(() => {
    const nextRoomId = nanoid(10);
    router.replace(`/play/${gameId}?room=${nextRoomId}`, { scroll: false });
    return nextRoomId;
  }, [gameId, router]);

  const copyInviteLink = useCallback(
    async (currentRoomId: string) => {
      const url = `${window.location.origin}/play/${gameId}?room=${currentRoomId}`;
      await navigator.clipboard.writeText(url);
      return url;
    },
    [gameId]
  );

  useEffect(() => {
    if (!enabled) {
      setStatus("unsupported");
      return;
    }

    if (!isSupabaseConfigured()) {
      setStatus("error");
      setError("Supabase is not configured. Online play needs Realtime enabled.");
      return;
    }

    if (!roomId) {
      setStatus("idle");
      setOpponentConnected(false);
      sessionRef.current.role = null;
      sessionRef.current.connected = false;
      return;
    }

    setStatus("connecting");
    setError(null);

    const supabase = createClient();
    const channel = supabase.channel(`game-room:${roomId}`, {
      config: { broadcast: { self: false }, presence: { key: nanoid(8) } },
    });

    const updatePresence = () => {
      const presence = channel.presenceState<{
        role?: OnlineRole;
      }>();
      const players = Object.values(presence).flat();
      const hasHost = players.some((player) => player.role === "host");
      const hasGuest = players.some((player) => player.role === "guest");
      setOpponentConnected(hasHost && hasGuest);
      sessionRef.current.connected = hasHost && hasGuest;
      if (sessionRef.current.role === "host") {
        setStatus(hasGuest ? "connected" : "waiting");
      } else if (sessionRef.current.role === "guest") {
        setStatus(hasHost ? "connected" : "connecting");
      }
    };

    channel.on("broadcast", { event: "state" }, ({ payload }) => {
      sessionRef.current.remoteState = payload as OnlineGameSessionRef["remoteState"];
    });

    channel.on("broadcast", { event: "paddle" }, ({ payload }) => {
      const data = payload as { player?: string; y?: number };
      if (data.player === "p2" && typeof data.y === "number") {
        sessionRef.current.remoteP2Y = data.y;
      }
    });

    channel.on("broadcast", { event: "game_over" }, ({ payload }) => {
      const data = payload as { score?: number };
      if (typeof data.score === "number") {
        onRemoteGameOver?.(data.score);
      }
    });

    channel.on("presence", { event: "sync" }, updatePresence);
    channel.on("presence", { event: "join" }, updatePresence);
    channel.on("presence", { event: "leave" }, updatePresence);

    sessionRef.current.broadcastState = (state) => {
      void channel.send({
        type: "broadcast",
        event: "state",
        payload: state,
      });
    };

    sessionRef.current.sendPaddleY = (y) => {
      void channel.send({
        type: "broadcast",
        event: "paddle",
        payload: { player: "p2", y },
      });
    };

    sessionRef.current.sendGameOver = (score) => {
      void channel.send({
        type: "broadcast",
        event: "game_over",
        payload: { score },
      });
    };

    channel.subscribe(async (subscribeStatus) => {
      if (subscribeStatus !== "SUBSCRIBED") return;

      const presence = channel.presenceState<{ role?: OnlineRole }>();
      const players = Object.values(presence).flat();
      const hasHost = players.some((player) => player.role === "host");
      const role: OnlineRole = hasHost ? "guest" : "host";
      sessionRef.current.role = role;

      await channel.track({ role, joined_at: Date.now() });
      updatePresence();
    });

    channelRef.current = channel;

    return () => {
      void channel.unsubscribe();
      channelRef.current = null;
      sessionRef.current.role = null;
      sessionRef.current.connected = false;
      sessionRef.current.remoteP2Y = null;
      sessionRef.current.remoteState = null;
      sessionRef.current.broadcastState = null;
      sessionRef.current.sendPaddleY = null;
      sessionRef.current.sendGameOver = null;
    };
  }, [enabled, onRemoteGameOver, roomId, sessionRef]);

  return {
    status,
    opponentConnected,
    error,
    createRoom,
    copyInviteLink,
  };
}
