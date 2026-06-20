import { describe, it, expect, beforeEach } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runWithManifest } from "./run-with-manifest.js";

let dir: string;
beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "manifest-"));
});

describe("runWithManifest", () => {
  it("runs all items once and records them", async () => {
    const calls: string[] = [];
    const out = await runWithManifest({
      items: ["a", "b"],
      keyOf: (x) => x,
      manifestPath: join(dir, "m.jsonl"),
      run: async (x) => {
        calls.push(x);
        return x.toUpperCase();
      },
    });
    expect(calls.sort()).toEqual(["a", "b"]);
    expect(out.find((r) => r.key === "a")?.result).toBe("A");
    await rm(dir, { recursive: true, force: true });
  });

  it("skips items already in the manifest on re-run", async () => {
    const path = join(dir, "m.jsonl");
    await runWithManifest({
      items: ["a"],
      keyOf: (x) => x,
      manifestPath: path,
      run: async (x) => x.toUpperCase(),
    });
    const calls: string[] = [];
    const out = await runWithManifest({
      items: ["a", "b"],
      keyOf: (x) => x,
      manifestPath: path,
      run: async (x) => {
        calls.push(x);
        return x.toUpperCase();
      },
    });
    expect(calls).toEqual(["b"]); // "a" came from the manifest
    expect(out).toHaveLength(2);
    await rm(dir, { recursive: true, force: true });
  });
});
