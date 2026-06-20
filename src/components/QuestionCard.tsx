import { useState } from "react";
import type { Question } from "../lib/schemas.js";
import { imageUrl } from "../lib/data.js";
import { TokenizedText } from "./TokenizedText.js";
import { WordPopover } from "./WordPopover.js";

interface Props {
  question: Question;
  interactive: boolean;
  selected: number | null;
  onSelect: (index: number) => void;
  reveal: boolean;
  // Study-only: when revealed, show the literal English translation next to the
  // German question and each option.
  showTranslations?: boolean;
}

export function QuestionCard({ question, interactive, selected, onSelect, reveal, showTranslations = false }: Props) {
  const [popoverWord, setPopoverWord] = useState<string | null>(null);
  const onWordTap = interactive ? (w: string) => setPopoverWord(w) : undefined;
  const translate = reveal && showTranslations && !!question.translationEn;

  const optionClass = (i: number) => {
    if (!reveal) return selected === i ? "border-amber-500 bg-amber-50" : "border-stone-200";
    if (i === question.answerIndex) return "border-green-600 bg-green-50";
    if (i === selected) return "border-red-600 bg-red-50";
    return "border-stone-200 opacity-70";
  };

  return (
    <div className="space-y-4">
      <div className="text-lg font-medium">
        <TokenizedText text={question.question} interactive={interactive} onWordTap={onWordTap} />
        {translate && (
          <p className="mt-1 text-sm font-normal italic text-stone-500">{question.translationEn!.question}</p>
        )}
      </div>
      {question.image && (
        <img src={imageUrl(question.image)} alt="" className="max-h-64 w-auto rounded-lg border border-stone-200" />
      )}
      <ul className="space-y-2">
        {question.options.map((opt, i) => {
          const letter = String.fromCharCode(65 + i);
          // Select control is a dedicated button. When NOT interactive (test
          // mode) the whole row is also a select target — safe because there
          // are no nested word buttons then. When interactive, only the badge
          // selects, so option-text words stay tappable for lookups.
          return (
            <li
              key={i}
              onClick={!interactive && !reveal ? () => onSelect(i) : undefined}
              className={`flex gap-2 rounded-xl border-2 p-3 ${optionClass(i)} ${!interactive && !reveal ? "cursor-pointer" : ""}`}
            >
              <button
                type="button"
                aria-label={`Auswählen ${letter}`}
                onClick={(e) => { e.stopPropagation(); onSelect(i); }}
                disabled={reveal}
                className="h-7 w-7 shrink-0 rounded-full border border-stone-300 font-semibold text-stone-500"
              >
                {letter}
              </button>
              <div className="flex-1">
                <TokenizedText text={opt} interactive={interactive} onWordTap={onWordTap} />
                {translate && question.translationEn!.options[i] && (
                  <div className="text-xs italic text-stone-400">{question.translationEn!.options[i]}</div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      {reveal && (
        <div data-testid="explanation" className="space-y-2 rounded-xl bg-stone-50 p-3 text-stone-700">
          {question.explanationDe && (
            <p>
              <span className="font-medium">Erklärung: </span>
              <TokenizedText text={question.explanationDe} interactive={interactive} onWordTap={onWordTap} />
            </p>
          )}
          <p className={question.explanationDe ? "text-sm text-stone-500" : ""}>
            <span className="font-medium">{question.explanationDe ? "Explanation: " : "Erklärung: "}</span>
            <TokenizedText text={question.explanation} interactive={interactive} onWordTap={onWordTap} />
          </p>
        </div>
      )}
      {popoverWord && <WordPopover surface={popoverWord} onClose={() => setPopoverWord(null)} />}
    </div>
  );
}
