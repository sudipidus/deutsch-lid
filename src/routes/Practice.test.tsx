// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, beforeEach } from "vitest";
import { Practice } from "./Practice.js";
import { useAppStore } from "../lib/store.js";

beforeEach(() => {
  localStorage.clear();
  useAppStore.setState({ bundesland: null, practiceAnswers: {}, testHistory: [] });
});

describe("Practice", () => {
  it("reveals feedback only after an answer is chosen", async () => {
    render(<MemoryRouter><Practice /></MemoryRouter>);
    expect(screen.queryByText(/Erklärung/)).toBeNull();              // hidden before answering
    await userEvent.click(screen.getByRole("button", { name: "Auswählen A" })); // choose option A
    expect(screen.getByText(/Erklärung/)).toBeTruthy();             // shown after answering
  });
});
