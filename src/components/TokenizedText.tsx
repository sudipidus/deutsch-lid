import { tokenize } from "../lib/tokenizer.js";

interface Props {
  text: string;
  interactive: boolean;
  onWordTap?: (surface: string) => void;
  className?: string;
}

export function TokenizedText({ text, interactive, onWordTap, className }: Props) {
  const tokens = tokenize(text);
  return (
    <span className={className}>
      {tokens.map((t, i) => {
        if (t.isWord && interactive) {
          return (
            <button
              key={i}
              type="button"
              // stopPropagation so a word tap never also triggers a parent
              // selectable row (see QuestionCard option rows).
              onClick={(e) => { e.stopPropagation(); onWordTap?.(t.text); }}
              className="cursor-pointer rounded px-0.5 hover:bg-amber-100 active:bg-amber-200"
            >
              {t.text}
            </button>
          );
        }
        return <span key={i}>{t.text}</span>;
      })}
    </span>
  );
}
