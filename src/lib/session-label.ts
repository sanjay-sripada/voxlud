import type { CreationSession } from "@/types/game";

export function getSessionLabel(session: CreationSession): string {
  const userMsg = session.messages.find((m) => m.role === "user");
  if (userMsg?.content) {
    const text = userMsg.content.trim();
    return text.length > 72 ? `${text.slice(0, 72)}…` : text;
  }
  if (session.currentConfig?.title) return session.currentConfig.title;
  return "Untitled draft";
}
