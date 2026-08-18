import type { ChatMessage } from "@/lib/api/types";
import { MessageBubble } from "./MessageBubble";

interface MessageListProps {
  messages: ChatMessage[];
  onRegenerate?: (messageId: string) => void;
  onFeedback?: (
    messageId: string,
    feedback: "up" | "down",
  ) => void;
  feedback?: Record<string, "up" | "down">;
  messageVersions?: Record<string, ChatMessage[]>;
  selectedVersions?: Record<string, number>;
  onSwitchVersion?: (
    messageId: string,
    direction: "previous" | "next",
  ) => void;
}

export function MessageList({
  messages,
  onRegenerate,
  onFeedback,
  feedback = {},
  messageVersions = {},
  selectedVersions = {},
  onSwitchVersion,
}: MessageListProps) {
  return (
    <div className="h-full overflow-y-auto bg-zinc-950 p-6">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            onRegenerate={
              onRegenerate
                ? (messageId) => onRegenerate(messageId)
                : undefined
            }
            onFeedback={
              onFeedback
                ? (messageId, value) =>
                    onFeedback(messageId, value)
                : undefined
            }
            feedback={feedback[message.id]}
            versions={messageVersions[message.id] ?? []}
            selectedVersion={selectedVersions[message.id]}
            onSwitchVersion={onSwitchVersion}
          />
        ))}
      </div>
    </div>
  );
}
