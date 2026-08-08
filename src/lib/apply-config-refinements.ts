import type { ChatMessage, GameConfig, GenerationSource } from "@/types/game";
import { ensurePlayerEmoji, extractEmojiFromText } from "@/lib/infer-player-emoji";

const CAR_PATTERN = /car|racing|race|driv|vehicle|automobile|🏎|🚗|🚙/i;

function conversationText(messages: ChatMessage[]): string {
  return messages.map((m) => m.content).join(" ");
}

export function applyConfigRefinements(
  config: GameConfig,
  latestUserMessage: string,
  messages: ChatMessage[] = [],
  source: GenerationSource = "llm"
): GameConfig {
  const latest = latestUserMessage.trim();
  const fullText = conversationText(messages);
  const full = fullText.toLowerCase();
  const wantsCar = CAR_PATTERN.test(latest) || CAR_PATTERN.test(full);

  let next: GameConfig = {
    ...config,
    settings: { ...config.settings },
  };

  const explicitEmoji =
    extractEmojiFromText(latest) ??
    messages.map((m) => extractEmojiFromText(m.content)).find(Boolean);
  if (explicitEmoji) {
    next.emoji = explicitEmoji;
    next.settings.playerEmoji = explicitEmoji;
  }

  // Keep LLM-chosen type, title, theme, and settings — only fill gaps.
  if (source === "llm") {
    return ensurePlayerEmoji(next, fullText || latest);
  }

  if (wantsCar) {
    next.emoji = "🚗";
    next.settings.playerEmoji = "🚗";

    if (!extractEmojiFromText(latest) && (next.type === "dodge" || next.type === "runner")) {
      next.type = "runner";
      next.settings.obstacleSpeed = next.settings.obstacleSpeed ?? 1.3;
      next.settings.gravityFlip = false;
      if (!next.title.toLowerCase().includes("car")) {
        next.title = "Car Rush";
      }
      next.description = "Drive your car and dodge obstacles on the road.";
    }

    if (wantsCar && /cross|traffic|road|lane|highway|frogger/.test(full)) {
      next.type = "cross";
      next.title = next.title.toLowerCase().includes("car") ? next.title : "Road Crosser";
      next.description = "Guide your car across busy traffic lanes.";
    }
  }

  return ensurePlayerEmoji(next, fullText || latest);
}
