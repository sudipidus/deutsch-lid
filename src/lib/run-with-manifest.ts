import { appendFile, mkdir, readFile } from "node:fs/promises";
import { dirname } from "node:path";

interface Entry<O> {
  key: string;
  result: O;
}

async function readManifest<O>(path: string): Promise<Map<string, O>> {
  const map = new Map<string, O>();
  try {
    const text = await readFile(path, "utf8");
    for (const line of text.split("\n")) {
      if (!line.trim()) continue;
      const entry = JSON.parse(line) as Entry<O>;
      map.set(entry.key, entry.result);
    }
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
  }
  return map;
}

export async function runWithManifest<I, O>(opts: {
  items: I[];
  keyOf: (item: I) => string;
  manifestPath: string;
  concurrency?: number;
  run: (item: I) => Promise<O>;
}): Promise<Array<{ key: string; result: O }>> {
  const { items, keyOf, manifestPath, run, concurrency = 4 } = opts;
  await mkdir(dirname(manifestPath), { recursive: true });
  const done = await readManifest<O>(manifestPath);

  const pending = items.filter((it) => !done.has(keyOf(it)));
  let cursor = 0;
  async function worker() {
    while (cursor < pending.length) {
      const item = pending[cursor++];
      const key = keyOf(item);
      const result = await run(item);
      done.set(key, result);
      await appendFile(manifestPath, JSON.stringify({ key, result }) + "\n");
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(concurrency, pending.length || 1) }, worker),
  );

  return items.map((it) => {
    const key = keyOf(it);
    return { key, result: done.get(key)! };
  });
}
