import type { ChatMessage, GameConfig } from "@/types/game";

export function buildGenerationPrompt(
  messages: ChatMessage[],
  currentConfig?: GameConfig | null
): string {
  if (messages.length === 0) return "";

  if (messages.length === 1 && messages[0].role === "user") {
    return messages[0].content;
  }

  const lines = messages.map((m) => {
    const label = m.role === "user" ? "User" : "Assistant";
    return `${label}: ${m.content}`;
  });

  let prompt = `Conversation:\n${lines.join("\n")}`;

  if (currentConfig) {
    prompt += `\n\nCurrent game config to refine:\n${JSON.stringify(currentConfig)}`;
  }

  prompt += "\n\nGenerate an updated game config based on the latest user message.";
  return prompt;
}

export function primaryPromptFromMessages(messages: ChatMessage[]): string {
  const firstUser = messages.find((m) => m.role === "user");
  return firstUser?.content ?? messages[messages.length - 1]?.content ?? "";
}
