import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { questions } from "../lib/data.js";
import { useAppStore } from "../lib/store.js";
import { QuestionCard } from "../components/QuestionCard.js";

export function Study() {
  const bundesland = useAppStore((s) => s.bundesland);
  const list = useMemo(
    () => questions.filter((q) => q.category === "general" || q.state === bundesland),
    [bundesland],
  );
  const [i, setI] = useState(0);
  const q = list[i];

  return (
    <div className="mx-auto max-w-md space-y-4 p-4">
      <div className="flex items-center justify-between">
        <Link to="/" className="text-stone-500">← Zurück</Link>
        <span className="text-sm text-stone-500">{i + 1} / {list.length}</span>
      </div>
      <QuestionCard question={q} interactive selected={q.answerIndex} onSelect={() => {}} reveal />
      <div className="flex justify-between">
        <button type="button" disabled={i === 0} onClick={() => setI((n) => n - 1)} className="rounded-lg border px-4 py-2 disabled:opacity-40">Zurück</button>
        <button type="button" disabled={i === list.length - 1} onClick={() => setI((n) => n + 1)} className="rounded-lg border px-4 py-2 disabled:opacity-40">Weiter</button>
      </div>
    </div>
  );
}
