import { useEffect, useState } from "react";
import { X, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";

const TOUR_KEY = "ai-chat-guided-tour-completed";

const steps = [
  {
    title: "Welcome to AI Assistant",
    description:
      "This is your AI chat workspace. You can ask questions, generate content, and continue conversations across sessions.",
    target: "chat",
  },
  {
    title: "Your conversations",
    description:
      "Use the conversation panel to resume previous threads or start a completely new conversation.",
    target: "conversations",
  },
  {
    title: "Streamed AI responses",
    description:
      "Responses appear progressively as they are generated. You can also copy, regenerate, rate, and inspect response details.",
    target: "response",
  },
  {
    title: "You're ready",
    description:
      "Send your first message and explore the assistant. You can restart this tour anytime from the help button.",
    target: "input",
  },
];

interface GuidedTourProps {
  forceOpen?: boolean;
  onClose?: () => void;
}

export function GuidedTour({
  forceOpen = false,
  onClose,
}: GuidedTourProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (forceOpen) {
      setStep(0);
      setOpen(true);
      return;
    }

    const completed =
      window.localStorage.getItem(TOUR_KEY);

    if (!completed) {
      const timer = window.setTimeout(() => {
        setOpen(true);
      }, 500);

      return () => window.clearTimeout(timer);
    }
  }, [forceOpen]);

  function closeTour() {
    setOpen(false);
    window.localStorage.setItem(TOUR_KEY, "true");
    onClose?.();
  }

  function nextStep() {
    if (step >= steps.length - 1) {
      closeTour();
      return;
    }

    setStep((current) => current + 1);
  }

  function previousStep() {
    setStep((current) => Math.max(0, current - 1));
  }

  if (!open) return null;

  const current = steps[step];
  const progress = ((step + 1) / steps.length) * 100;

  return (
    <div className="fixed inset-0 z-[100]">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
        onClick={closeTour}
      />

      <div className="absolute left-1/2 top-1/2 w-[calc(100%-32px)] max-w-md -translate-x-1/2 -translate-y-1/2">
        <div className="overflow-hidden rounded-2xl border border-zinc-700/80 bg-[#111117] shadow-2xl shadow-black/60">
          <div className="h-1 bg-zinc-800">
            <div
              className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center justify-between px-5 pt-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/15 text-violet-400">
              <Sparkles size={19} />
            </div>

            <button
              type="button"
              onClick={closeTour}
              className="rounded-lg p-2 text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-200"
              title="Close tour"
            >
              <X size={18} />
            </button>
          </div>

          <div className="px-5 pb-5 pt-4">
            <div className="mb-2 text-xs font-medium uppercase tracking-wider text-violet-400">
              Step {step + 1} of {steps.length}
            </div>

            <h2 className="text-xl font-semibold tracking-tight text-white">
              {current.title}
            </h2>

            <p className="mt-3 leading-7 text-zinc-400">
              {current.description}
            </p>
          </div>

          <div className="flex items-center justify-between border-t border-zinc-800 bg-zinc-950/50 px-5 py-4">
            <button
              type="button"
              onClick={previousStep}
              disabled={step === 0}
              className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-200 disabled:pointer-events-none disabled:opacity-30"
            >
              <ChevronLeft size={16} />
              Back
            </button>

            <button
              type="button"
              onClick={nextStep}
              className="flex items-center gap-1 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-violet-600/20 transition hover:bg-violet-500"
            >
              {step === steps.length - 1
                ? "Get started"
                : "Next"}
              {step < steps.length - 1 && (
                <ChevronRight size={16} />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
