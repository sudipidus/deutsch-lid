import { lookupWord } from "../lib/data.js";

interface Props {
  surface: string;
  onClose: () => void;
}

export function WordPopover({ surface, onClose }: Props) {
  const result = lookupWord(surface);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button type="button" aria-label="Schließen" onClick={onClose} className="absolute inset-0 bg-black/40" />
      <div className="relative z-10 m-3 w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
        {result ? (
          <div className="space-y-2">
            <div className="flex items-baseline gap-2">
              <h2 className="text-xl font-semibold">
                {result.entry.article ? `${result.entry.article} ` : ""}
                {result.lemma}
              </h2>
              <span className="text-sm text-stone-500">{result.entry.pos}</span>
            </div>
            <p><span className="font-medium">Bedeutung:</span> {result.entry.meaning}</p>
            <p><span className="font-medium">Herkunft:</span> {result.entry.etymology}</p>
            <p><span className="font-medium">Kontext:</span> {result.entry.context}</p>
          </div>
        ) : (
          <p className="text-stone-600">Kein Eintrag für „{surface}".</p>
        )}
        <button type="button" onClick={onClose} className="mt-4 w-full rounded-lg bg-stone-800 py-2 text-white">
          Schließen
        </button>
      </div>
    </div>
  );
}
