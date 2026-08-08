import type { ChatMessage, GameConfig } from "@/types/game";

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          name: string;
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          avatar_url?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      games: {
        Row: {
          id: string;
          user_id: string | null;
          prompt: string;
          config: GameConfig;
          author: string;
          plays: number;
          likes: number;
          featured: boolean;
          published: boolean;
          chat_history: ChatMessage[];
          created_at: string;
        };
        Insert: {
          id: string;
          user_id?: string | null;
          prompt: string;
          config: GameConfig;
          author: string;
          plays?: number;
          likes?: number;
          featured?: boolean;
          published?: boolean;
          chat_history?: ChatMessage[];
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          prompt?: string;
          config?: GameConfig;
          author?: string;
          plays?: number;
          likes?: number;
          featured?: boolean;
          published?: boolean;
          chat_history?: ChatMessage[];
          created_at?: string;
        };
        Relationships: [];
      };
      creation_sessions: {
        Row: {
          id: string;
          user_id: string;
          messages: ChatMessage[];
          current_config: GameConfig | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          user_id: string;
          messages?: ChatMessage[];
          current_config?: GameConfig | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          messages?: ChatMessage[];
          current_config?: GameConfig | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      increment_game_plays: {
        Args: { game_id: string };
        Returns: undefined;
      };
      increment_game_likes: {
        Args: { game_id: string };
        Returns: number;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
