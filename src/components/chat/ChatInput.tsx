import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ChatInputProps {
  onSend: (message: string) => Promise<void>;
  disabled?: boolean;
}

export function ChatInput({
  onSend,
  disabled = false,
}: ChatInputProps) {
  const [value, setValue] = useState("");

  async function handleSubmit() {
    const message = value.trim();

    if (!message || disabled) {
      return;
    }

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
    <div className="border-t p-4">
      <div className="mx-auto flex max-w-4xl gap-2">
        <Textarea
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything..."
          className="min-h-[52px] resize-none"
          disabled={disabled}
        />

        <Button
          onClick={() => void handleSubmit()}
          disabled={disabled || !value.trim()}
          className="self-end"
        >
          Send
        </Button>
      </div>
    </div>
  );
}