import { getMessagesCollection } from "./db.js";
import type { ChatMessage } from "./types.js";

export async function saveChatMessage(
  conversationId: string,
  userMessage: string,
  assistantMessage: string,
): Promise<void> {
  const collection = getMessagesCollection();

  const chatMessage: ChatMessage = {
    conversationId,
    userMessage,
    assistantMessage,
    createdAt: new Date(),
  };

  await collection.insertOne(chatMessage);
}

export async function getChatHistory(
  conversationId: string,
): Promise<ChatMessage[]> {
  const collection = getMessagesCollection();

  const messages = await collection
    .find({ conversationId })
    .sort({ createdAt: 1 })
    .toArray();

  return messages as unknown as ChatMessage[];
}