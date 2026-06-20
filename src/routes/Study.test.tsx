// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect } from "vitest";
import { Study } from "./Study.js";

describe("Study", () => {
  it("shows a question with its correct answer revealed and advances", async () => {
    render(<MemoryRouter><Study /></MemoryRouter>);
    // first general question's explanation is visible (reveal always true in Study)
    expect(screen.getByText(/Erklärung/)).toBeTruthy();
    const next = screen.getByRole("button", { name: /Weiter|Next/i });
    await userEvent.click(next);
    expect(screen.getByText(/Erklärung/)).toBeTruthy();
  });
});
