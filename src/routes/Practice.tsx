import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { questions, questionKey } from "../lib/data.js";
import { drawTest, scoreTest, shuffleOptions, PASS_THRESHOLD, TEST_SIZE } from "../lib/test-draw.js";
import { useAppStore } from "../lib/store.js";
import { QuestionCard } from "../components/QuestionCard.js";
import { QuizNav } from "../components/QuizNav.js";

type Phase = "running" | "result" | "review";

// Practice is a repeatable mock exam: the same 33-question format as the real
// LID test (30 general + 3 state, pass at 17), scored only at the end. Unlike
// the official Test, practice runs are not saved to the result history.
export function Practice() {
  const bundesland = useAppStore((s) => s.bundesland);

  const [round, setRound] = useState(0);
  // Redraw a fresh set of 33 questions each round, with each question's options
  // shuffled too, so nothing about position is memorizable.
  const drawn = useMemo(
    () => (bundesland ? drawTest(questions, bundesland).map((q) => shuffleOptions(q)) : []),
    [bundesland, round],
  );
  const [phase, setPhase] = useState<Phase>("running");
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<{ correct: number; total: number; passed: boolean } | null>(null);

  if (!bundesland) {
    return (
      <div className="mx-auto max-w-md space-y-4 p-6">
        <p>Bitte zuerst ein Bundesland wählen.</p>
        <Link to="/" className="text-stone-700 underline">Zur Startseite</Link>
      </div>
    );
  }

  const submit = () => {
    setResult(scoreTest(drawn, answers));
    setPhase("result");
  };

  const restart = () => {
    setAnswers({});
    setResult(null);
    setI(0);
    setPhase("running");
    setRound((n) => n + 1);
  };

  if (phase === "result" && result) {
    return (
      <div className="mx-auto max-w-md space-y-5 p-6 text-center">
        <h1 className="text-2xl font-bold">{result.passed ? "Bestanden! 🎉" : "Nicht bestanden"}</h1>
        <p className="text-4xl font-bold">{result.correct} / {result.total}</p>
        <p className="text-stone-500">Bestehensgrenze: {PASS_THRESHOLD} richtige Antworten</p>
        <div className="flex flex-col gap-2">
          <button type="button" onClick={() => { setPhase("review"); setI(0); }} className="rounded-lg bg-stone-800 py-3 text-white">Antworten ansehen</button>
          <button type="button" onClick={restart} className="rounded-lg border py-3">Neuer Übungstest</button>
          <Link to="/" className="rounded-lg border py-3">Zur Startseite</Link>
        </div>
      </div>
    );
  }

  const q = drawn[i];
  const key = questionKey(q);
  const reviewing = phase === "review";

  return (
    <div className="mx-auto max-w-md space-y-4 p-4">
      <div className="flex items-center justify-between">
        <Link to="/" className="text-stone-500">← Abbrechen</Link>
        <span className="text-sm text-stone-500">{reviewing ? "Überprüfung " : ""}{i + 1} / {TEST_SIZE}</span>
      </div>
      <QuestionCard
        question={q}
        interactive={reviewing}
        selected={answers[key] ?? null}
        onSelect={(idx) => !reviewing && setAnswers((a) => ({ ...a, [key]: idx }))}
        reveal={reviewing}
      />
      <QuizNav
        onPrev={() => setI((n) => n - 1)}
        onNext={() => setI((n) => n + 1)}
        prevDisabled={i === 0}
        nextDisabled={i === TEST_SIZE - 1}
        onSubmit={!reviewing && i === TEST_SIZE - 1 ? submit : undefined}
        submitLabel="Auswerten"
        secondaryLabel={!reviewing ? "Jetzt auswerten" : undefined}
        onSecondary={!reviewing ? submit : undefined}
      />
    </div>
  );
}
