import { useEffect, useRef, useState } from "react";
import { ChatHeader } from "./ChatHeader";
import { ChatInput } from "./ChatInput";
import { MessageList } from "./MessageList";
import { chatApi } from "@/lib/api/client";
import type { ChatMessage } from "@/lib/api/types";
import { toast } from "sonner";

const API_URL = "http://localhost:3001";

interface Conversation {
  conversationId: string;
  lastMessage: string;
  lastUpdated: string;
}

export function Chat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string>();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [feedback, setFeedback] = useState<
    Record<string, "up" | "down">
  >({});

  const [feedbackModal, setFeedbackModal] = useState<{
    messageId: string;
    value: "up" | "down";
  } | null>(null);

  const [feedbackSubmitting, setFeedbackSubmitting] =
    useState(false);

  const [messageVersions, setMessageVersions] = useState<
    Record<string, ChatMessage[]>
  >({});

  const [selectedVersions, setSelectedVersions] = useState<
    Record<string, number>
  >({});

  const typewriterTimer = useRef<ReturnType<
    typeof setInterval
  > | null>(null);

  async function loadConversations() {
    try {
      const response = await fetch(
        `${API_URL}/api/conversations`,
      );

      if (!response.ok) {
        throw new Error("Failed to load conversations");
      }

      const data = await response.json();
      setConversations(data.conversations ?? []);
    } catch {
      toast.error("Could not load conversations.");
    }
  }

  async function loadConversation(id: string) {
    try {
      const response = await fetch(
        `${API_URL}/api/chat/${id}`,
      );

      if (!response.ok) {
        throw new Error("Failed to load conversation");
      }

      const data = await response.json();

      const loadedMessages: ChatMessage[] = [];
      const loadedFeedback: Record<
        string,
        "up" | "down"
      > = {};

      for (const item of data.messages ?? []) {
        loadedMessages.push({
          id: `${item._id}-user`,
          role: "user",
          content: item.userMessage,
          createdAt: item.createdAt,
        });

        const assistantId =
          item.assistantMessageId ??
          `${item._id}-assistant`;

        loadedMessages.push({
          id: assistantId,
          role: "assistant",
          content: item.assistantMessage,
          createdAt: item.createdAt,
          citations: item.citations ?? [],
        });

        if (item.feedback) {
          loadedFeedback[assistantId] = item.feedback;
        }
      }

      setConversationId(id);
      setMessages(loadedMessages);
      setFeedback(loadedFeedback);
    } catch {
      toast.error("Could not load this conversation.");
    }
  }

  function exportConversation(format: "markdown" | "pdf") {
    if (messages.length === 0) {
      toast.error("There is no conversation to export.");
      return;
    }

    const markdown = messages
      .map((message) => {
        const heading =
          message.role === "user" ? "## You" : "## AI";

        const citations =
          message.citations && message.citations.length > 0
            ? "\n\n### Sources\n" +
              message.citations
                .map(
                  (citation) =>
                    `${citation.index}. [${citation.title}](${citation.url})`,
                )
                .join("\n")
            : "";

        return `${heading}\n\n${message.content}${citations}`;
      })
      .join("\n\n---\n\n");

    const title = "AI Chat Conversation";

    if (format === "markdown") {
      const blob = new Blob(
        [`# ${title}\n\n${markdown}`],
        { type: "text/markdown;charset=utf-8" },
      );

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "ai-chat-conversation.md";
      link.click();
      URL.revokeObjectURL(url);

      toast.success("Conversation exported as Markdown.");
      return;
    }

    const printWindow = window.open("", "_blank");

    if (!printWindow) {
      toast.error("Please allow pop-ups to export as PDF.");
      return;
    }

    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>${title}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              max-width: 850px;
              margin: 40px auto;
              padding: 0 24px;
              color: #18181b;
              line-height: 1.6;
            }
            h1 {
              margin-bottom: 32px;
            }
            h2 {
              margin-top: 28px;
            }
            hr {
              margin: 28px 0;
              border: 0;
              border-top: 1px solid #ddd;
            }
            a {
              color: #4f46e5;
            }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          ${messages
            .map(
              (message) => `
                <h2>${message.role === "user" ? "You" : "AI"}</h2>
                <p>${message.content
                  .replace(/&/g, "&amp;")
                  .replace(/</g, "&lt;")
                  .replace(/>/g, "&gt;")
                  .replace(/\n/g, "<br />")}</p>
                ${
                  message.citations?.length
                    ? `<h3>Sources</h3><ul>${message.citations
                        .map(
                          (citation) =>
                            `<li><a href="${citation.url}">${citation.title}</a></li>`,
                        )
                        .join("")}</ul>`
                    : ""
                }
                <hr />
              `,
            )
            .join("")}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();

    toast.success("PDF export opened for printing.");
  }

  function createNewConversation() {
    if (typewriterTimer.current) {
      clearInterval(typewriterTimer.current);
      typewriterTimer.current = null;
    }

    setConversationId(undefined);
    setMessages([]);
    setFeedback({});
    setMessageVersions({});
    setSelectedVersions({});
  }

  function streamWithTypewriter(
    request: {
      message: string;
      conversationId?: string;
    },
    messageId: string,
  ): Promise<{
    messageId?: string;
    content: string;
    citations: NonNullable<ChatMessage["citations"]>;
  }> {
    return new Promise((resolve, reject) => {
      let queue = "";
      let streamFinished = false;
      let settled = false;
      let backendMessageId: string | undefined;
      let citations: NonNullable<ChatMessage["citations"]> = [];
      let generatedContent = "";

      const finish = () => {
        if (settled) return;

        settled = true;

        if (typewriterTimer.current) {
          clearInterval(typewriterTimer.current);
          typewriterTimer.current = null;
        }

        resolve({
          messageId: backendMessageId,
          content: generatedContent,
          citations,
        });
      };

      typewriterTimer.current = setInterval(() => {
        if (queue.length > 0) {
          const character = queue.slice(0, 1);
          queue = queue.slice(1);
          generatedContent += character;

          setMessages((current) =>
            current.map((message) =>
              message.id === messageId
                ? {
                    ...message,
                    content:
                      message.content + character,
                  }
                : message,
            ),
          );
        } else if (streamFinished) {
          finish();
        }
      }, 12);

      void chatApi
        .streamMessage(request, (event) => {
          if (event.text) {
            queue += event.text;
          }

          if (event.messageId) {
            backendMessageId = event.messageId;
          }

          if (event.citations) {
            citations = event.citations;
          }

          if (event.done) {
            streamFinished = true;
          }
        })
        .then(() => {
          streamFinished = true;

          if (queue.length === 0) {
            finish();
          }
        })
        .catch((error) => {
          if (typewriterTimer.current) {
            clearInterval(typewriterTimer.current);
            typewriterTimer.current = null;
          }

          reject(error);
        });
    });
  }

  async function handleSend(content: string) {
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      createdAt: new Date().toISOString(),
    };

    const assistantId = crypto.randomUUID();

    const assistantMessage: ChatMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
      createdAt: new Date().toISOString(),
    };

    setMessages((current) => [
      ...current,
      userMessage,
      assistantMessage,
    ]);

    setIsLoading(true);

    try {
      let activeConversationId = conversationId;

      if (!activeConversationId) {
        activeConversationId = crypto.randomUUID();
        setConversationId(activeConversationId);
      }

      const result = await streamWithTypewriter(
        {
          message: content,
          conversationId: activeConversationId,
        },
        assistantId,
      );

      setMessages((current) =>
        current.map((message) =>
          message.id === assistantId
            ? {
                ...message,
                id: result.messageId ?? message.id,
                citations: result.citations,
              }
            : message,
        ),
      );

      await loadConversations();
    } catch {
      setMessages((current) =>
        current.map((message) =>
          message.id === assistantId
            ? {
                ...message,
                content:
                  "Sorry, something went wrong. Please try again.",
              }
            : message,
        ),
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRegenerate(messageId: string) {
    const messageIndex = messages.findIndex(
      (item) => item.id === messageId,
    );

    if (messageIndex <= 0) return;

    const previousMessage = messages[messageIndex - 1];

    if (previousMessage.role !== "user") return;

    const currentMessage = messages[messageIndex];

    // Preserve the currently displayed answer as a version.
    setMessageVersions((current) => {
      const existing = current[messageId] ?? [];

      const alreadySaved = existing.some(
        (version) =>
          version.content === currentMessage.content &&
          JSON.stringify(version.citations ?? []) ===
            JSON.stringify(currentMessage.citations ?? []),
      );

      if (alreadySaved) {
        return current;
      }

      return {
        ...current,
        [messageId]: [
          ...existing,
          { ...currentMessage },
        ],
      };
    });

    setMessages((current) =>
      current.map((item) =>
        item.id === messageId
          ? {
              ...item,
              content: "",
              citations: [],
            }
          : item,
      ),
    );

    setIsLoading(true);

    try {
      const result = await streamWithTypewriter(
        {
          message: previousMessage.content,
          conversationId,
        },
        messageId,
      );

      const generatedVersion: ChatMessage = {
        ...currentMessage,
        id: messageId,
        content: result.content,
        citations: result.citations,
      };

      setMessages((current) =>
        current.map((item) =>
          item.id === messageId
            ? generatedVersion
            : item,
        ),
      );

      setMessageVersions((current) => {
        const existing = current[messageId] ?? [];

        const alreadySaved = existing.some(
          (version) =>
            version.content === generatedVersion.content &&
            JSON.stringify(version.citations ?? []) ===
              JSON.stringify(generatedVersion.citations ?? []),
        );

        if (alreadySaved) {
          return current;
        }

        return {
          ...current,
          [messageId]: [
            ...existing,
            generatedVersion,
          ],
        };
      });

      setSelectedVersions((current) => {
        const existingCount =
          messageVersions[messageId]?.length ?? 0;

        return {
          ...current,
          [messageId]: existingCount,
        };
      });

      await loadConversations();
    } catch {
      setMessages((current) =>
        current.map((item) =>
          item.id === messageId
            ? {
                ...item,
                content:
                  "Sorry, something went wrong while regenerating.",
              }
            : item,
        ),
      );
    } finally {
      setIsLoading(false);
    }
  }

  function switchMessageVersion(
    messageId: string,
    direction: "previous" | "next",
  ) {
    const versions = messageVersions[messageId];

    if (!versions || versions.length < 2) return;

    const currentIndex =
      selectedVersions[messageId] ?? versions.length - 1;

    const nextIndex =
      direction === "previous"
        ? Math.max(0, currentIndex - 1)
        : Math.min(
            versions.length - 1,
            currentIndex + 1,
          );

    if (nextIndex === currentIndex) return;

    const version = versions[nextIndex];

    setMessages((current) =>
      current.map((message) =>
        message.id === messageId
          ? { ...version }
          : message,
      ),
    );

    setSelectedVersions((current) => ({
      ...current,
      [messageId]: nextIndex,
    }));
  }


  function handleFeedback(
    messageId: string,
    value: "up" | "down",
  ) {
    if (!conversationId) return;

    setFeedbackModal({
      messageId,
      value,
    });
  }

  async function submitFeedback() {
    if (!conversationId || !feedbackModal) return;

    const { messageId, value } = feedbackModal;

    setFeedbackSubmitting(true);

    try {
      const response = await fetch(
        `${API_URL}/api/feedback`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            conversationId,
            messageId,
            feedback: value,
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to save feedback");
      }

      setFeedback((current) => ({
        ...current,
        [messageId]: value,
      }));

      setFeedbackModal(null);
    } catch {
      // Keep the modal open so the user can retry.
    } finally {
      setFeedbackSubmitting(false);
    }
  }

  function cancelFeedback() {
    if (feedbackSubmitting) return;
    setFeedbackModal(null);
  }

  useEffect(() => {
    void loadConversations();

    return () => {
      if (typewriterTimer.current) {
        clearInterval(typewriterTimer.current);
      }
    };
  }, []);

  return (
    <main className="relative flex min-h-screen overflow-hidden bg-[#07070a]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[-250px] h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-violet-500/10 blur-[120px]" />

        <div className="absolute bottom-[-200px] right-[-100px] h-[450px] w-[450px] rounded-full bg-blue-500/10 blur-[120px]" />
      </div>

      <section className="relative mx-auto flex h-screen w-full max-w-7xl overflow-hidden border border-zinc-800 bg-[#0b0b10] shadow-2xl shadow-black/40 sm:my-4 sm:h-[calc(100vh-32px)] sm:rounded-2xl">
        <aside className="hidden w-64 flex-col border-r border-zinc-800 bg-[#0c0c11] md:flex">
          <div className="border-b border-zinc-800 p-4">
            <button
              type="button"
              onClick={createNewConversation}
              className="w-full rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-violet-600/10 transition hover:bg-violet-500 active:scale-[0.98]"
            >
              + New conversation
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {conversations.length === 0 ? (
              <p className="p-3 text-center text-xs text-zinc-600">
                No conversations yet
              </p>
            ) : (
              <div className="space-y-1">
                {conversations.map((conversation) => (
                  <button
                    key={conversation.conversationId}
                    type="button"
                    onClick={() =>
                      void loadConversation(
                        conversation.conversationId,
                      )
                    }
                    className={`w-full rounded-xl p-3 text-left transition ${
                      conversation.conversationId ===
                      conversationId
                        ? "bg-violet-500/10 text-violet-300 ring-1 ring-violet-500/20"
                        : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
                    }`}
                  >
                    <p className="truncate text-sm font-medium">
                      {conversation.lastMessage ||
                        "New conversation"}
                    </p>

                    <p className="mt-1 text-xs text-zinc-600">
                      {new Date(
                        conversation.lastUpdated,
                      ).toLocaleDateString()}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <ChatHeader />

          <div className="flex items-center justify-end gap-2 border-b border-zinc-800 px-4 py-2">
            <button
              type="button"
              onClick={() => exportConversation("markdown")}
              disabled={messages.length === 0}
              className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-300 transition hover:bg-zinc-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              Export Markdown
            </button>

            <button
              type="button"
              onClick={() => exportConversation("pdf")}
              disabled={messages.length === 0}
              className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-300 transition hover:bg-zinc-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              Export PDF
            </button>
          </div>

          <div className="min-h-0 flex-1">
            <MessageList
              messages={messages}
              onRegenerate={
                isLoading
                  ? undefined
                  : (messageId) =>
                      void handleRegenerate(messageId)
              }
              onFeedback={(messageId, value) =>
                void handleFeedback(messageId, value)
              }
              feedback={feedback}
              messageVersions={messageVersions}
              selectedVersions={selectedVersions}
              onSwitchVersion={switchMessageVersion}
            />
          </div>

          <ChatInput
            onSend={handleSend}
            disabled={isLoading}
          />
        </div>
      </section>
    {feedbackModal && (
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="feedback-title"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) {
            cancelFeedback();
          }
        }}
      >
        <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl shadow-black/50">
          <div className="mb-5">
            <div
              id="feedback-title"
              className="mb-2 text-lg font-semibold text-white"
            >
              Rate this response
            </div>

            <p className="text-sm leading-6 text-zinc-400">
              Your feedback helps evaluate the quality of the
              AI assistant's responses.
            </p>
          </div>

          <div className="mb-6 flex items-center gap-3">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                feedbackModal.value === "up"
                  ? "bg-emerald-500/15 text-emerald-400"
                  : "bg-red-500/15 text-red-400"
              }`}
            >
              <span className="text-2xl">
                {feedbackModal.value === "up"
                  ? "👍"
                  : "👎"}
              </span>
            </div>

            <div>
              <div className="font-medium text-zinc-200">
                {feedbackModal.value === "up"
                  ? "Good response"
                  : "Needs improvement"}
              </div>

              <div className="text-xs text-zinc-500">
                Submit your rating below.
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={cancelFeedback}
              disabled={feedbackSubmitting}
              className="rounded-xl border border-zinc-800 px-4 py-2.5 text-sm text-zinc-400 transition hover:bg-zinc-900 hover:text-zinc-200 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={() => void submitFeedback()}
              disabled={feedbackSubmitting}
              className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-violet-600/20 transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {feedbackSubmitting
                ? "Submitting…"
                : "Submit feedback"}
            </button>
          </div>
        </div>
      </div>
    )}

    </main>
  );
}
