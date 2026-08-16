import { useState } from "react";
import { ChatHeader } from "./ChatHeader";
import { ChatInput } from "./ChatInput";
import { MessageList } from "./MessageList";
import { chatApi } from "@/lib/api/client";
import type { ChatMessage } from "@/lib/api/types";

const initialMessages: ChatMessage[] = [
  {
    id: "1",
    role: "assistant",
    content: "Hi! How can I help you today?",
    createdAt: new Date().toISOString(),
  },
  {
    id: "2",
    role: "user",
    content: "Show me what you can do.",
    createdAt: new Date().toISOString(),
  },
  {
    id: "3",
    role: "assistant",
    content:
      "I can answer questions, explain concepts, and help you work through problems.",
    createdAt: new Date().toISOString(),
  },
];

export function Chat() {
  const [messages, setMessages] =
    useState<ChatMessage[]>(initialMessages);

  const [conversationId, setConversationId] =
    useState<string>();

  const [isLoading, setIsLoading] = useState(false);

  async function handleSend(content: string) {
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      createdAt: new Date().toISOString(),
    };

    setMessages((current) => [...current, userMessage]);
    setIsLoading(true);

    try {
      const response = await chatApi.sendMessage({
        message: content,
        conversationId,
      });

      setConversationId(response.conversationId);

      setMessages((current) => [...current, response.message]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Sorry, something went wrong. Please try again.",
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 p-4">
      <section className="flex h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl border bg-white shadow-sm">
        <ChatHeader />

        <MessageList messages={messages} />

        <ChatInput
          onSend={handleSend}
          disabled={isLoading}
        />
      </section>
    </main>
  );
}