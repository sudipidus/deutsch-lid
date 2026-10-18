import { useEffect } from "react";

interface Props {
  onPrev: () => void;
  onNext: () => void;
  prevDisabled: boolean;
  nextDisabled: boolean;
  // When set, the right-hand button is a submit action (last question) instead
  // of "Weiter". Practice/Test use this for "Auswerten".
  onSubmit?: () => void;
  submitLabel?: string;
  // Optional full-width action below the row (e.g. "Jetzt auswerten").
  secondaryLabel?: string;
  onSecondary?: () => void;
}

// Bottom navigation for the quiz modes. On mobile it is pinned to the bottom of
// the viewport (sticky) so "Weiter" is always reachable without scrolling to the
// end of a long, revealed card; it falls back to its natural inline position on
// short cards. ← / → advance on desktop. The negative margins let its backdrop
// span the full width inside the routes' padded containers.
export function QuizNav({
  onPrev,
  onNext,
  prevDisabled,
  nextDisabled,
  onSubmit,
  submitLabel = "Auswerten",
  secondaryLabel,
  onSecondary,
}: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && /^(INPUT|SELECT|TEXTAREA)$/.test(el.tagName)) return;
      if (e.key === "ArrowLeft" && !prevDisabled) onPrev();
      if (e.key === "ArrowRight") {
        if (onSubmit) onSubmit();
        else if (!nextDisabled) onNext();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onPrev, onNext, prevDisabled, nextDisabled, onSubmit]);

  return (
    <div className="sticky bottom-0 z-10 -mx-4 -mb-4 border-t border-stone-200 bg-white/90 px-4 pt-3 backdrop-blur [padding-bottom:calc(0.75rem+env(safe-area-inset-bottom))]">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          disabled={prevDisabled}
          onClick={onPrev}
          className="rounded-lg border px-4 py-2 disabled:opacity-40"
        >
          Zurück
        </button>
        {onSubmit ? (
          <button type="button" onClick={onSubmit} className="rounded-lg bg-stone-800 px-6 py-2 font-medium text-white">
            {submitLabel}
          </button>
        ) : (
          <button
            type="button"
            disabled={nextDisabled}
            onClick={onNext}
            className="rounded-lg bg-stone-800 px-6 py-2 font-medium text-white disabled:opacity-40"
          >
            Weiter
          </button>
        )}
      </div>
      {secondaryLabel && onSecondary && (
        <button
          type="button"
          onClick={onSecondary}
          className="mt-2 w-full rounded-lg border border-stone-300 py-2 text-sm text-stone-600"
        >
          {secondaryLabel}
        </button>
      )}
    </div>
  );
}
