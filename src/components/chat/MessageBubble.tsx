import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import type { ChatMessage } from "@/lib/api/types";

interface MessageBubbleProps {
  message: ChatMessage;
  onRegenerate?: (messageId: string) => void;
  onFeedback?: (
    messageId: string,
    feedback: "up" | "down",
  ) => void;
  feedback?: "up" | "down";
  versions?: ChatMessage[];
  selectedVersion?: number;
  onSwitchVersion?: (
    messageId: string,
    direction: "previous" | "next",
  ) => void;
}

function isCitationHref(href?: string) {
  if (!href) return false;

  return (
    href.startsWith("http://") ||
    href.startsWith("https://")
  );
}

function getDomain(href?: string) {
  if (!href) return "Source";

  try {
    return new URL(href).hostname.replace(/^www\./, "");
  } catch {
    return "Source";
  }
}

export function MessageBubble({
  message,
  onRegenerate,
  onFeedback,
  feedback,
  versions = [],
  selectedVersion,
  onSwitchVersion,
}: MessageBubbleProps) {
  const isUser = message.role === "user";
  const [metadataOpen, setMetadataOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
  const [pendingFeedback, setPendingFeedback] = useState<
    "up" | "down" | null
  >(null);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 1500);
    } catch {
      setCopied(false);
    }
  }

  const formattedTime = new Date(
    message.createdAt,
  ).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      className={`group flex w-full ${
        isUser ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`relative max-w-[88%] rounded-2xl px-4 py-3 ${
          isUser
            ? "rounded-br-md bg-violet-600 text-white shadow-lg shadow-violet-600/10"
            : "rounded-bl-md border border-zinc-800/80 bg-zinc-900/90 text-zinc-100 shadow-xl shadow-black/10"
        }`}
      >
        {message.content ? (
          <div className="min-w-0">
            <div className="max-w-none text-sm">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({ children }) => (
                    <h1 className="mb-3 mt-1 text-xl font-bold tracking-tight text-white">
                      {children}
                    </h1>
                  ),

                  h2: ({ children }) => (
                    <h2 className="mb-3 mt-6 text-lg font-semibold tracking-tight text-white">
                      {children}
                    </h2>
                  ),

                  h3: ({ children }) => (
                    <h3 className="mb-2 mt-5 text-base font-semibold text-white">
                      {children}
                    </h3>
                  ),

                  p: ({ children }) => (
                    <p className="mb-3 leading-7 text-zinc-200 last:mb-0">
                      {children}
                    </p>
                  ),

                  ul: ({ children }) => (
                    <ul className="mb-3 ml-5 list-disc space-y-1.5 text-zinc-200">
                      {children}
                    </ul>
                  ),

                  ol: ({ children }) => (
                    <ol className="mb-3 ml-5 list-decimal space-y-1.5 text-zinc-200">
                      {children}
                    </ol>
                  ),

                  li: ({ children }) => (
                    <li className="leading-7">{children}</li>
                  ),

                  strong: ({ children }) => (
                    <strong className="font-semibold text-white">
                      {children}
                    </strong>
                  ),

                  em: ({ children }) => (
                    <em className="text-zinc-300">{children}</em>
                  ),

                  del: ({ children }) => (
                    <del className="text-zinc-500">
                      {children}
                    </del>
                  ),

                  blockquote: ({ children }) => (
                    <blockquote className="my-4 border-l-2 border-violet-500/70 pl-4 text-zinc-400">
                      {children}
                    </blockquote>
                  ),

                  code: ({
                    className,
                    children,
                    ...props
                  }) => {
                    const languageMatch =
                      /language-(\\w+)/.exec(className ?? "");

                    const language =
                      languageMatch?.[1] ?? "text";

                    const code = String(children).replace(
                      /\\n$/,
                      "",
                    );

                    const isBlock = Boolean(
                      languageMatch || className,
                    );

                    if (isBlock) {
                      return (
                        <SyntaxHighlighter
                          language={language}
                          style={oneDark}
                          PreTag="div"
                          customStyle={{
                            margin: 0,
                            borderRadius: 0,
                            background: "transparent",
                            padding: "1rem",
                            fontSize: "0.75rem",
                            lineHeight: "1.5rem",
                          }}
                          codeTagProps={{
                            style: {
                              fontFamily:
                                "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                            },
                          }}
                        >
                          {code}
                        </SyntaxHighlighter>
                      );
                    }

                    return (
                      <code
                        className="rounded-md border border-zinc-700/60 bg-zinc-800 px-1.5 py-0.5 font-mono text-xs text-violet-300"
                        {...props}
                      >
                        {children}
                      </code>
                    );
                  },

                  pre: ({ children }) => (
                    <pre className="my-4 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-inner">
                      {children}
                    </pre>
                  ),

                  hr: () => (
                    <hr className="my-5 border-zinc-800" />
                  ),

                  a: ({ children, href }) => {
                    const citation = isCitationHref(href);

                    if (citation) {
                      return (
                        <span className="group/citation relative inline-flex align-baseline">
                          <a
                            href={href}
                            target="_blank"
                            rel="noreferrer"
                            className="mx-0.5 inline-flex items-center rounded-md border border-violet-500/25 bg-violet-500/10 px-1.5 py-0.5 align-baseline text-[11px] font-semibold text-violet-300 no-underline transition hover:border-violet-400/50 hover:bg-violet-500/20 hover:text-violet-200"
                          >
                            {children}
                          </a>

                          <span className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-max max-w-xs -translate-x-1/2 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs font-normal text-zinc-300 opacity-0 shadow-2xl transition-opacity group-hover/citation:opacity-100">
                            <span className="block font-medium text-zinc-100">
                              Source
                            </span>
                            <span className="mt-0.5 block text-zinc-500">
                              {getDomain(href)}
                            </span>
                          </span>
                        </span>
                      );
                    }

                    return (
                      <a
                        href={href}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium text-violet-400 underline decoration-violet-500/40 underline-offset-4 transition hover:text-violet-300 hover:decoration-violet-300"
                      >
                        {children}
                      </a>
                    );
                  },

                  table: ({ children }) => (
                    <div className="my-4 overflow-x-auto rounded-xl border border-zinc-800">
                      <table className="w-full text-left text-sm">
                        {children}
                      </table>
                    </div>
                  ),

                  thead: ({ children }) => (
                    <thead className="bg-zinc-950">
                      {children}
                    </thead>
                  ),

                  tbody: ({ children }) => (
                    <tbody>{children}</tbody>
                  ),

                  th: ({ children }) => (
                    <th className="border-b border-zinc-800 px-3 py-2.5 font-semibold text-zinc-200">
                      {children}
                    </th>
                  ),

                  td: ({ children }) => (
                    <td className="border-b border-zinc-800 px-3 py-2.5 text-zinc-300">
                      {children}
                    </td>
                  ),

                  br: () => <br />,
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>

            {message.citations && message.citations.length > 0 && (
              <div className="mt-4 border-t border-zinc-800 pt-3">
                <div className="mb-2 text-xs font-medium text-zinc-500">
                  Sources
                </div>

                <div className="flex flex-wrap gap-2">
                  {message.citations.map((citation) => (
                    <a
                      key={`${citation.index}-${citation.url}`}
                      href={citation.url}
                      target="_blank"
                      rel="noreferrer"
                      title={citation.title}
                      className="group/source relative inline-flex items-center gap-1.5 rounded-lg border border-violet-500/20 bg-violet-500/5 px-2.5 py-1.5 text-xs text-violet-300 transition hover:border-violet-400/40 hover:bg-violet-500/10 hover:text-violet-200"
                    >
                      <span className="flex h-4 min-w-4 items-center justify-center rounded bg-violet-500/15 px-1 text-[10px] font-bold text-violet-300">
                        {citation.index}
                      </span>

                      <span className="max-w-[220px] truncate">
                        {citation.title}
                      </span>

                      <span className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 hidden w-max max-w-xs -translate-x-1/2 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-left text-xs shadow-2xl group-hover/source:block">
                        <span className="block font-medium text-zinc-100">
                          {citation.title}
                        </span>
                        <span className="mt-0.5 block truncate text-zinc-500">
                          {getDomain(citation.url)}
                        </span>
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-1.5 py-1">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-violet-400" />
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-violet-400 [animation-delay:150ms]" />
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-violet-400 [animation-delay:300ms]" />
            <span className="ml-2 text-xs text-zinc-500">
              Generating response…
            </span>
          </div>
        )}

        {!isUser &&
          message.content &&
          message.citations &&
          message.citations.length > 0 && (
            <div className="mt-4 border-t border-zinc-800 pt-3">
              <div className="mb-2 text-xs font-semibold text-zinc-400">
                Sources
              </div>

              <div className="flex flex-col gap-1.5">
                {message.citations.map((citation) => (
                  <a
                    key={citation.url}
                    href={citation.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex min-w-0 items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-zinc-400 transition hover:bg-zinc-800 hover:text-violet-300"
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-violet-500/10 text-[10px] font-semibold text-violet-400">
                      {citation.index}
                    </span>

                    <span className="min-w-0 truncate">
                      {citation.title}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}

        {!isUser && message.content && (
          <>
            {versions.length > 1 && (
              <>
                <div className="mb-2 flex items-center justify-end gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setCompareOpen((open) => !open)}
                    className="rounded-md border border-zinc-700 px-2.5 py-1 text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-200"
                  >
                    {compareOpen ? "Close comparison" : "Compare responses"}
                  </button>
                </div>

                {compareOpen && (
                  <div className="mb-3 grid gap-3 md:grid-cols-2">
                    {versions.map((version, index) => (
                      <div
                        key={`${version.id}-${index}`}
                        className={`rounded-xl border p-3 ${
                          index === (selectedVersion ?? versions.length - 1)
                            ? "border-violet-500/50 bg-violet-500/5"
                            : "border-zinc-800 bg-zinc-950/60"
                        }`}
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-xs font-medium text-zinc-400">
                            Response {index + 1}
                          </span>

                          {index ===
                            (selectedVersion ?? versions.length - 1) && (
                            <span className="rounded-full bg-violet-500/10 px-2 py-0.5 text-[10px] text-violet-300">
                              Selected
                            </span>
                          )}
                        </div>

                        <div className="max-h-72 overflow-y-auto text-sm leading-6 text-zinc-300">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {version.content}
                          </ReactMarkdown>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mb-2 flex items-center justify-end gap-1 text-xs">
                  <button
                  type="button"
                  onClick={() =>
                    onSwitchVersion?.(message.id, "previous")
                  }
                  disabled={(selectedVersion ?? versions.length - 1) <= 0}
                  className="rounded-md px-2 py-1 text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-200 disabled:cursor-not-allowed disabled:opacity-30"
                  title="Previous response"
                >
                  ←
                </button>

                <span className="px-1 text-zinc-600">
                  {(selectedVersion ?? versions.length - 1) + 1}
                  {" / "}
                  {versions.length}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    onSwitchVersion?.(message.id, "next")
                  }
                  disabled={
                    (selectedVersion ?? versions.length - 1) >=
                    versions.length - 1
                  }
                  className="rounded-md px-2 py-1 text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-200 disabled:cursor-not-allowed disabled:opacity-30"
                  title="Next response"
                >
                  →
                </button>
                </div>
              </>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-1 border-t border-zinc-800 pt-2">
              <button
                type="button"
                onClick={() => setPendingFeedback("up")}
                title="Good response"
                className={`rounded-lg px-2 py-1.5 text-sm transition ${
                  feedback === "up"
                    ? "bg-emerald-500/15 text-emerald-400"
                    : "text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200"
                }`}
              >
                👍
              </button>

              <button
                type="button"
                onClick={() => setPendingFeedback("down")}
                title="Needs improvement"
                className={`rounded-lg px-2 py-1.5 text-sm transition ${
                  feedback === "down"
                    ? "bg-red-500/15 text-red-400"
                    : "text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200"
                }`}
              >
                👎
              </button>

              <button
                type="button"
                onClick={() => void handleCopy()}
                title="Copy response"
                className="rounded-lg px-2 py-1.5 text-xs text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-200"
              >
                {copied ? "✓ Copied" : "Copy"}
              </button>

              {onRegenerate && (
                <button
                  type="button"
                  onClick={() =>
                    onRegenerate(message.id)
                  }
                  title="Generate another response"
                  className="rounded-lg px-2 py-1.5 text-xs text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-200"
                >
                  ↻ Regenerate
                </button>
              )}

              <div className="ml-auto">
                <button
                  type="button"
                  onClick={() =>
                    setMetadataOpen((open) => !open)
                  }
                  className="rounded-lg px-2 py-1.5 text-xs text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-300"
                  aria-expanded={metadataOpen}
                >
                  {metadataOpen
                    ? "Hide details"
                    : "Details"}
                  <span className="ml-1">
                    {metadataOpen ? "⌃" : "⌄"}
                  </span>
                </button>
              </div>
            </div>

            {pendingFeedback && (
              <div
                className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
                role="dialog"
                aria-modal="true"
                aria-labelledby="feedback-title"
              >
                <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-5 shadow-2xl shadow-black/50">
                  <div className="mb-4">
                    <div
                      id="feedback-title"
                      className="text-base font-semibold text-white"
                    >
                      Rate this response
                    </div>

                    <p className="mt-1 text-sm text-zinc-400">
                      {pendingFeedback === "up"
                        ? "You found this response helpful."
                        : "This response could be improved."}
                    </p>
                  </div>

                  <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-4">
                    <div className="text-sm text-zinc-300">
                      Your feedback helps improve the assistant.
                    </div>

                    <div className="mt-3 flex items-center gap-2 text-sm">
                      <span className="text-zinc-500">Selected:</span>
                      <span
                        className={
                          pendingFeedback === "up"
                            ? "font-medium text-emerald-400"
                            : "font-medium text-red-400"
                        }
                      >
                        {pendingFeedback === "up"
                          ? "👍 Good response"
                          : "👎 Needs improvement"}
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setPendingFeedback(null)}
                      className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-300 transition hover:bg-zinc-800"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onFeedback?.(
                          message.id,
                          pendingFeedback,
                        );
                        setPendingFeedback(null);
                      }}
                      className="rounded-lg bg-violet-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-violet-500"
                    >
                      Submit feedback
                    </button>
                  </div>
                </div>
              </div>
            )}

            {metadataOpen && (
              <div className="mt-2 rounded-xl border border-zinc-800 bg-zinc-950/70 p-3">
                <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-3">
                  <div>
                    <div className="mb-1 text-zinc-600">
                      Model
                    </div>
                    <div className="font-medium text-zinc-300">
                      Gemini Flash
                    </div>
                  </div>

                  <div>
                    <div className="mb-1 text-zinc-600">
                      Role
                    </div>
                    <div className="font-medium text-zinc-300">
                      Assistant
                    </div>
                  </div>

                  <div>
                    <div className="mb-1 text-zinc-600">
                      Generated
                    </div>
                    <div className="font-medium text-zinc-300">
                      {formattedTime}
                    </div>
                  </div>
                </div>

                <div className="mt-3 border-t border-zinc-800 pt-3 text-xs text-zinc-600">
                  Response generated by the configured AI assistant.
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
