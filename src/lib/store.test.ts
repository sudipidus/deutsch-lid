// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { useAppStore } from "./store.js";

beforeEach(() => {
  localStorage.clear();
  useAppStore.setState({ bundesland: null, practiceAnswers: {}, testHistory: [] });
});

describe("useAppStore", () => {
  it("sets the bundesland", () => {
    useAppStore.getState().setBundesland("Bayern");
    expect(useAppStore.getState().bundesland).toBe("Bayern");
  });
  it("records and resets practice answers", () => {
    useAppStore.getState().recordPractice("general:1:", 3);
    expect(useAppStore.getState().practiceAnswers["general:1:"]).toBe(3);
    useAppStore.getState().resetPractice();
    expect(useAppStore.getState().practiceAnswers).toEqual({});
  });
  it("appends test results", () => {
    useAppStore.getState().addTestResult({ at: 1, correct: 20, total: 33, passed: true });
    expect(useAppStore.getState().testHistory).toHaveLength(1);
    expect(useAppStore.getState().testHistory[0].passed).toBe(true);
  });
});
