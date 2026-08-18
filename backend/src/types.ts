export interface ChatMessage {
  conversationId: string;
  userMessage: string;
  assistantMessage: string;
  createdAt: Date;
}