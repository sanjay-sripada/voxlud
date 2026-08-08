export type GameType =
  | "pong"
  | "snake"
  | "breakout"
  | "runner"
  | "clicker"
  | "flappy"
  | "shooter"
  | "tetris"
  | "memory"
  | "whack"
  | "dodge"
  | "slide"
  | "catch"
  | "cross"
  | "stack"
  | "simon"
  | "reaction";

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
  emoji?: string;
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
  published: boolean;
  chatHistory?: ChatMessage[];
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export interface CreationSession {
  id: string;
  userId: string;
  messages: ChatMessage[];
  currentConfig: GameConfig | null;
  createdAt: string;
  updatedAt: string;
}

export interface GenerateRequest {
  prompt?: string;
  message?: string;
  sessionId?: string;
  messages?: ChatMessage[];
  currentConfig?: GameConfig;
  author?: string;
  model?: string;
  provider?: string;
}

export interface PublishGameRequest {
  prompt: string;
  config: GameConfig;
  sessionId?: string;
  chatHistory?: ChatMessage[];
}

export interface UpdateGameRequest {
  prompt: string;
  config: GameConfig;
  chatHistory?: ChatMessage[];
}

export type GenerationSource = "llm" | "fallback";

export interface GenerateResponse {
  game: Game;
  generationTimeMs: number;
  generationSource?: GenerationSource;
}
