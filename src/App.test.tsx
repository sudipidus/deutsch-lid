// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import App from "./App.js";

describe("App", () => {
  it("renders the home heading", () => {
    render(<App />);
    expect(screen.getByText("Leben in Deutschland")).toBeTruthy();
  });
});
