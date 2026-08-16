export function ChatHeader() {
  return (
    <header className="flex items-center justify-between border-b px-6 py-4">
      <div>
        <h1 className="font-semibold">AI Assistant</h1>
        <p className="text-xs text-zinc-500">
          Your AI workspace
        </p>
      </div>

      <div className="flex items-center gap-2 text-xs text-zinc-500">
        <span className="h-2 w-2 rounded-full bg-green-500" />
        Ready
      </div>
    </header>
  );
}