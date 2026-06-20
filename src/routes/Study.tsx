import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { questions, questionKey, shuffle } from "../lib/data.js";
import { useAppStore } from "../lib/store.js";
import { QuestionCard } from "../components/QuestionCard.js";

export function Study() {
  const bundesland = useAppStore((s) => s.bundesland);
  // Shuffle once per visit so the session starts on a different question each time.
  const list = useMemo(
    () => shuffle(questions.filter((q) => q.category === "general" || q.state === bundesland)),
    [bundesland],
  );
  const [i, setI] = useState(0);
  // Local, non-persisted choices: the learner picks an answer themselves and
  // only then sees the correct one + explanation. (Practice mode is the
  // persisted/graded variant.)
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const q = list[i];
  const key = questionKey(q);
  const selected = answers[key] ?? null;

  return (
    <div className="mx-auto max-w-md space-y-4 p-4">
      <div className="flex items-center justify-between">
        <Link to="/" className="text-stone-500">← Zurück</Link>
        <span className="text-sm text-stone-500">{i + 1} / {list.length}</span>
      </div>
      {!bundesland && (
        <p className="rounded-lg bg-amber-50 p-2 text-sm text-amber-800">
          300 allgemeine Fragen. Wähle auf der <Link to="/" className="underline">Startseite</Link> dein Bundesland für die 10 landesbezogenen Fragen (insgesamt 310).
        </p>
      )}
      <QuestionCard
        question={q}
        interactive
        selected={selected}
        onSelect={(idx) => setAnswers((a) => ({ ...a, [key]: idx }))}
        reveal={selected !== null}
      />
      <div className="flex justify-between">
        <button type="button" disabled={i === 0} onClick={() => setI((n) => n - 1)} className="rounded-lg border px-4 py-2 disabled:opacity-40">Zurück</button>
        <button type="button" disabled={i === list.length - 1} onClick={() => setI((n) => n + 1)} className="rounded-lg border px-4 py-2 disabled:opacity-40">Weiter</button>
      </div>
    </div>
  );
}
