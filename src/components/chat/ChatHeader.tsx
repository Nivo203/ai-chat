import { useState } from "react";
import { HelpCircle } from "lucide-react";
import { GuidedTour } from "./GuidedTour";

export function ChatHeader() {
  const [tourOpen, setTourOpen] = useState(false);

  return (
    <>
      <header className="flex items-center justify-between border-b border-zinc-800 bg-zinc-950 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-sm font-bold text-white shadow-lg shadow-violet-500/20">
            AI
          </div>

          <div>
            <h1 className="font-semibold tracking-tight text-zinc-100">
              AI Assistant
            </h1>

            <div className="flex items-center gap-1.5 text-xs text-zinc-500">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Online
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setTourOpen(true)}
          title="Open guided tour"
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-zinc-500 transition hover:bg-zinc-900 hover:text-zinc-200"
        >
          <HelpCircle size={17} />
          <span className="hidden sm:inline">
            Tour
          </span>
        </button>
      </header>

      {tourOpen && (
        <GuidedTour
          forceOpen
          onClose={() => setTourOpen(false)}
        />
      )}
    </>
  );
}
