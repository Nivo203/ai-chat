import type {
  ChatApi,
  SendMessageRequest,
  SendMessageResponse,
  StreamMessageEvent,
} from "./types";

const API_URL = "http://localhost:3001";

export const chatApi: ChatApi = {
  async sendMessage(
    request: SendMessageRequest,
  ): Promise<SendMessageResponse> {
    const response = await fetch(`${API_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error("Failed to send message");
    }

    const data = await response.json();

    return {
      conversationId: data.conversationId,
      message: {
        id:
          data.message?.id ??
          data.messageId ??
          crypto.randomUUID(),
        role: "assistant",
        content:
          data.message?.content ??
          data.response ??
          "",
        createdAt:
          data.message?.createdAt ??
          new Date().toISOString(),
        citations: data.message?.citations ?? [],
      },
    };
  },

  async streamMessage(
    request: SendMessageRequest,
    onEvent: (event: StreamMessageEvent) => void,
  ): Promise<void> {
    const response = await fetch(`${API_URL}/api/chat/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      let errorMessage = "Failed to stream message";

      try {
        const data = await response.json();

        if (typeof data.error === "string") {
          errorMessage = data.error;
        }
      } catch {
        // Keep the default error message.
      }

      throw new Error(errorMessage);
    }

    if (!response.body) {
      throw new Error("Streaming is not supported");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    let buffer = "";

    function processEvent(event: string) {
      const line = event
        .split("\n")
        .find((item) => item.startsWith("data: "));

      if (!line) return;

      const json = line.slice(6).trim();

      if (!json) return;

      try {
        const data = JSON.parse(json) as StreamMessageEvent;

        if (data.error) {
          throw new Error(data.error);
        }

        onEvent(data);
      } catch (error) {
        if (error instanceof Error) {
          throw error;
        }

        // Ignore malformed SSE payloads.
      }
    }

    while (true) {
      const { value, done } = await reader.read();

      if (done) break;

      buffer += decoder.decode(value, {
        stream: true,
      });

      const events = buffer.split("\n\n");

      buffer = events.pop() ?? "";

      for (const event of events) {
        processEvent(event);
      }
    }

    buffer += decoder.decode();

    if (buffer.trim()) {
      processEvent(buffer);
    }
  },
};
