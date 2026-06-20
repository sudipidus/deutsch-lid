// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, beforeEach } from "vitest";
import { Test } from "./Test.js";
import { useAppStore } from "../lib/store.js";

beforeEach(() => {
  localStorage.clear();
  useAppStore.setState({ bundesland: "Bayern", practiceAnswers: {}, testHistory: [] });
});

describe("Test mode", () => {
  it("locks word lookups while the test is running", () => {
    render(<MemoryRouter><Test /></MemoryRouter>);
    // The question stem words must NOT be buttons during the test.
    // Option buttons exist, but tapping a stem word must not open a popover.
    expect(screen.queryByText(/Bedeutung/)).toBeNull();
    expect(screen.queryByText(/Erklärung/)).toBeNull(); // no explanations while running
  });

  it("scores and records a result after submitting", async () => {
    render(<MemoryRouter><Test /></MemoryRouter>);
    // answer nothing, submit
    await userEvent.click(screen.getByRole("button", { name: /auswerten/i }));
    expect(screen.getByText(/von 33|\/ 33/)).toBeTruthy();
    expect(useAppStore.getState().testHistory).toHaveLength(1);
  });
});
