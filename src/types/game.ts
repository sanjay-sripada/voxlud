export type GameType = "pong" | "snake" | "breakout" | "runner" | "clicker";

export type GameMode = "solo" | "local-multiplayer" | "online";

export interface GameConfig {
  type: GameType;
  mode: GameMode;
  title: string;
  description: string;
  theme: {
    primary: string;
    secondary: string;
    background: string;
    accent: string;
  };
  settings: Record<string, unknown>;
}

export interface Game {
  id: string;
  prompt: string;
  config: GameConfig;
  userId: string | null;
  author: string;
  plays: number;
  likes: number;
  createdAt: string;
  featured: boolean;
}

export interface GenerateRequest {
  prompt: string;
  author?: string;
}

export interface GenerateResponse {
  game: Game;
  generationTimeMs: number;
}
