import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ChatInputProps {
  onSend: (message: string) => void | Promise<void>;
  disabled?: boolean;
}

export function ChatInput({
  onSend,
  disabled = false,
}: ChatInputProps) {
  const [value, setValue] = useState("");

  async function handleSubmit() {
    const message = value.trim();

    if (!message || disabled) return;

    setValue("");
    await onSend(message);
  }

  function handleKeyDown(
    event: React.KeyboardEvent<HTMLTextAreaElement>,
  ) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSubmit();
    }
  }

  return (
    <div className="border-t border-zinc-800 bg-zinc-950 p-4">
      <div className="mx-auto flex max-w-4xl items-end gap-3">
        <Textarea
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message your AI assistant..."
          disabled={disabled}
          rows={1}
          className="min-h-[48px] resize-none rounded-xl border-zinc-800 bg-zinc-900 text-zinc-100 placeholder:text-zinc-600 focus-visible:border-violet-500 focus-visible:ring-violet-500/20"
        />

        <Button
          onClick={() => void handleSubmit()}
          disabled={disabled || !value.trim()}
          className="h-12 rounded-xl bg-violet-600 px-5 font-medium text-white shadow-lg shadow-violet-600/20 transition hover:bg-violet-500 disabled:bg-zinc-800 disabled:text-zinc-500"
        >
          {disabled ? "..." : "Send"}
        </Button>
      </div>

      <p className="mt-2 text-center text-[11px] text-zinc-600">
        Enter to send · Shift + Enter for a new line
      </p>
    </div>
  );
}
