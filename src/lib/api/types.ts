export type Role = "user" | "assistant";

export interface Citation {
  index: number;
  title: string;
  url: string;
}

export interface ChatMessage {
  id: string;
  role: Role;
  content: string;
  createdAt: string;
  citations?: Citation[];
}

export interface SendMessageRequest {
  message: string;
  conversationId?: string;
}

export interface SendMessageResponse {
  message: ChatMessage;
  conversationId: string;
}

export interface StreamMessageEvent {
  text?: string;
  done?: boolean;
  messageId?: string;
  citations?: Citation[];
  error?: string;
}

export interface ChatApi {
  sendMessage(
    request: SendMessageRequest,
  ): Promise<SendMessageResponse>;

  streamMessage(
    request: SendMessageRequest,
    onEvent: (event: StreamMessageEvent) => void,
  ): Promise<void>;
}
