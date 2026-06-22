import { Link } from "react-router-dom";
import { useAppStore } from "../lib/store.js";
import { STATES } from "../lib/data.js";

export function Home() {
  const bundesland = useAppStore((s) => s.bundesland);
  const setBundesland = useAppStore((s) => s.setBundesland);

  return (
    <div className="mx-auto max-w-md space-y-6 p-6">
      <h1 className="text-2xl font-bold">Leben in Deutschland</h1>

      <label className="block">
        <span className="text-sm text-stone-600">Bundesland</span>
        <select
          className="mt-1 w-full rounded-lg border border-stone-300 p-3"
          value={bundesland ?? ""}
          onChange={(e) => setBundesland(e.target.value)}
        >
          <option value="" disabled>Bitte wählen…</option>
          {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </label>

      <nav className="space-y-3">
        <Link to="/study" className="block rounded-xl border-2 border-stone-200 p-4 text-lg">📖 Lernen (Study)</Link>
        {bundesland ? (
          <Link to="/practice" className="block rounded-xl border-2 border-stone-200 p-4 text-lg">✍️ Üben (33 Fragen)</Link>
        ) : (
          <span className="block rounded-xl border-2 border-stone-200 p-4 text-lg text-stone-400">✍️ Üben — erst Bundesland wählen</span>
        )}
        {bundesland ? (
          <Link to="/test" className="block rounded-xl border-2 border-stone-800 bg-stone-800 p-4 text-lg text-white">🎯 Test (33 Fragen)</Link>
        ) : (
          <span className="block rounded-xl border-2 border-stone-200 p-4 text-lg text-stone-400">🎯 Test — erst Bundesland wählen</span>
        )}
      </nav>
    </div>
  );
}
