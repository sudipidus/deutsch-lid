// @vitest-environment jsdom
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, afterEach } from "vitest";
import { TokenizedText } from "./TokenizedText.js";

afterEach(cleanup);

describe("TokenizedText", () => {
  it("renders words as buttons and fires onWordTap when interactive", async () => {
    const onTap = vi.fn();
    render(<TokenizedText text="Das Grundgesetz." interactive onWordTap={onTap} />);
    const btn = screen.getByRole("button", { name: "Grundgesetz" });
    await userEvent.click(btn);
    expect(onTap).toHaveBeenCalledWith("Grundgesetz");
  });

  it("renders no buttons when not interactive (locked, e.g. during a test)", () => {
    render(<TokenizedText text="Das Grundgesetz." interactive={false} />);
    expect(screen.queryAllByRole("button")).toHaveLength(0);
    expect(screen.getByText(/Grundgesetz/)).toBeTruthy();
  });
});
