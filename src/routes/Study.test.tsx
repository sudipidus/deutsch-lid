// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect } from "vitest";
import { Study } from "./Study.js";

describe("Study", () => {
  it("does not reveal until the user chooses, then reveals; advancing starts fresh", async () => {
    render(<MemoryRouter><Study /></MemoryRouter>);
    // The correct answer is NOT pre-selected/graded — nothing revealed yet.
    expect(screen.queryByText(/Erklärung/)).toBeNull();
    // User chooses an answer → reveal (correct answer + explanation).
    await userEvent.click(screen.getByRole("button", { name: "Auswählen A" }));
    expect(screen.getByText(/Erklärung/)).toBeTruthy();
    // Next question starts unrevealed again.
    await userEvent.click(screen.getByRole("button", { name: /Weiter|Next/i }));
    expect(screen.queryByText(/Erklärung/)).toBeNull();
  });
});
