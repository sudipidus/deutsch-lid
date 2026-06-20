// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { WordPopover } from "./WordPopover.js";

// data.ts imports the real JSON; "Deutschland" is guaranteed present.
describe("WordPopover", () => {
  it("shows the resolved entry fields for a known word", () => {
    render(<WordPopover surface="Deutschland" onClose={vi.fn()} />);
    expect(screen.getByText(/Deutschland/)).toBeTruthy();
    expect(screen.getByText(/Bedeutung|Meaning/i)).toBeTruthy();
  });
  it("shows a fallback for an unknown word", () => {
    render(<WordPopover surface="zzzznotaword" onClose={vi.fn()} />);
    expect(screen.getByText(/Kein Eintrag/i)).toBeTruthy();
  });
});
