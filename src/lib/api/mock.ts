import type {
  ChatApi,
  SendMessageRequest,
  SendMessageResponse,
} from "./types";

const wait = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const mockChatApi: ChatApi = {
  async sendMessage(
    request: SendMessageRequest,
  ): Promise<SendMessageResponse> {
    await wait(700);

    return {
      conversationId:
        request.conversationId ?? "mock-conversation",
      message: {
        id: crypto.randomUUID(),
        role: "assistant",
        content:
          "This is a mock response. We'll connect the real backend later.",
        createdAt: new Date().toISOString(),
      },
    };
  },
};