// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { QuestionCard } from "./QuestionCard.js";
import type { Question } from "../lib/schemas.js";

const q: Question = {
  id: 1, category: "general", state: null,
  question: "Was ist das Grundgesetz?", image: null,
  options: ["Ein Gesetz", "Die Verfassung", "Ein Vertrag", "Eine Regel"],
  answerIndex: 1, explanation: "Das Grundgesetz ist die Verfassung.",
};

describe("QuestionCard", () => {
  it("calls onSelect when an option's select control is tapped", async () => {
    const onSelect = vi.fn();
    render(<QuestionCard question={q} interactive selected={null} onSelect={onSelect} reveal={false} />);
    // The select control is a dedicated button (aria-label "Auswählen B"),
    // distinct from the tappable option-text words.
    await userEvent.click(screen.getByRole("button", { name: "Auswählen B" }));
    expect(onSelect).toHaveBeenCalledWith(1);
  });
  it("shows the explanation only when reveal is true", () => {
    const { rerender } = render(<QuestionCard question={q} interactive selected={1} onSelect={vi.fn()} reveal={false} />);
    expect(screen.queryByTestId("explanation")).toBeNull();
    rerender(<QuestionCard question={q} interactive selected={1} onSelect={vi.fn()} reveal />);
    expect(screen.getByTestId("explanation").textContent).toMatch(/ist die Verfassung/);
  });
  it("opens a word popover when a question word is tapped (interactive)", async () => {
    render(<QuestionCard question={q} interactive selected={null} onSelect={vi.fn()} reveal={false} />);
    await userEvent.click(screen.getByRole("button", { name: "Grundgesetz" }));
    expect(screen.getByText(/Bedeutung|Kein Eintrag/i)).toBeTruthy();
  });

  it("does not make option-text words tappable buttons in non-interactive (test) mode", () => {
    render(<QuestionCard question={q} interactive={false} selected={null} onSelect={vi.fn()} reveal={false} />);
    // The only buttons are the four select controls — no word-lookup buttons.
    expect(screen.queryByRole("button", { name: "Verfassung" })).toBeNull();
    expect(screen.getByRole("button", { name: "Auswählen B" })).toBeTruthy();
  });
});
