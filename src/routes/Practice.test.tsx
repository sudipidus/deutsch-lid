// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, beforeEach } from "vitest";
import { Practice } from "./Practice.js";
import { useAppStore } from "../lib/store.js";

beforeEach(() => {
  localStorage.clear();
  useAppStore.setState({ bundesland: "Bayern", practiceAnswers: {}, testHistory: [] });
});

describe("Practice mode", () => {
  it("hides explanations while the mock exam is running", () => {
    render(<MemoryRouter><Practice /></MemoryRouter>);
    expect(screen.queryByText(/Erklärung/)).toBeNull();
  });

  it("grades 33 questions at the end without saving an official result", async () => {
    render(<MemoryRouter><Practice /></MemoryRouter>);
    await userEvent.click(screen.getByRole("button", { name: /auswerten/i }));
    expect(screen.getByText(/\/ 33/)).toBeTruthy();
    // practice runs are repeatable and must not pollute the official history
    expect(useAppStore.getState().testHistory).toHaveLength(0);
  });
});
