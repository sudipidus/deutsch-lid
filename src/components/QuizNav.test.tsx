// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { QuizNav } from "./QuizNav.js";

describe("QuizNav", () => {
  it("advances with the Weiter button and the Right arrow key", async () => {
    const onNext = vi.fn();
    render(<QuizNav onPrev={vi.fn()} onNext={onNext} prevDisabled={false} nextDisabled={false} />);
    await userEvent.click(screen.getByRole("button", { name: "Weiter" }));
    await userEvent.keyboard("{ArrowRight}");
    expect(onNext).toHaveBeenCalledTimes(2);
  });

  it("goes back with the Left arrow key unless disabled", async () => {
    const onPrev = vi.fn();
    const { rerender } = render(<QuizNav onPrev={onPrev} onNext={vi.fn()} prevDisabled nextDisabled={false} />);
    await userEvent.keyboard("{ArrowLeft}");
    expect(onPrev).not.toHaveBeenCalled();
    rerender(<QuizNav onPrev={onPrev} onNext={vi.fn()} prevDisabled={false} nextDisabled={false} />);
    await userEvent.keyboard("{ArrowLeft}");
    expect(onPrev).toHaveBeenCalledTimes(1);
  });

  it("shows a submit button instead of Weiter and fires it on Right arrow", async () => {
    const onSubmit = vi.fn();
    const onNext = vi.fn();
    render(
      <QuizNav onPrev={vi.fn()} onNext={onNext} prevDisabled={false} nextDisabled onSubmit={onSubmit} submitLabel="Auswerten" />,
    );
    expect(screen.queryByRole("button", { name: "Weiter" })).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "Auswerten" }));
    await userEvent.keyboard("{ArrowRight}");
    expect(onSubmit).toHaveBeenCalledTimes(2);
    expect(onNext).not.toHaveBeenCalled();
  });
});
