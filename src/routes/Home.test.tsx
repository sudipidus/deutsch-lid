// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, beforeEach } from "vitest";
import { Home } from "./Home.js";
import { useAppStore } from "../lib/store.js";

beforeEach(() => {
  localStorage.clear();
  useAppStore.setState({ bundesland: null, practiceAnswers: {}, testHistory: [] });
});

describe("Home", () => {
  it("renders the three modes and a Bundesland selector", () => {
    render(<MemoryRouter><Home /></MemoryRouter>);
    expect(screen.getByText(/Lernen|Study/i)).toBeTruthy();
    expect(screen.getByText(/Üben|Practice/i)).toBeTruthy();
    expect(screen.getByText(/Test/i)).toBeTruthy();
    expect(screen.getByRole("combobox")).toBeTruthy();
  });
});
