export type OnlineRole = "host" | "guest";

export type OnlineRoomStatus =
  | "idle"
  | "connecting"
  | "waiting"
  | "connected"
  | "unsupported"
  | "error";

export interface PongSyncState {
  ball: { x: number; y: number; vx: number; vy: number; r: number };
  p1: { y: number; h: number; w: number; score: number };
  p2: { y: number; h: number; w: number; score: number };
}

export interface OnlineGameSessionRef {
  role: OnlineRole | null;
  connected: boolean;
  remoteP2Y: number | null;
  remoteState: PongSyncState | null;
  broadcastState: ((state: PongSyncState) => void) | null;
  sendPaddleY: ((y: number) => void) | null;
  sendGameOver: ((score: number) => void) | null;
}

export function createOnlineGameSessionRef(): OnlineGameSessionRef {
  return {
    role: null,
    connected: false,
    remoteP2Y: null,
    remoteState: null,
    broadcastState: null,
    sendPaddleY: null,
    sendGameOver: null,
  };
}
