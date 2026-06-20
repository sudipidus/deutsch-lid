import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface TestResult {
  at: number;
  correct: number;
  total: number;
  passed: boolean;
}

interface AppState {
  bundesland: string | null;
  practiceAnswers: Record<string, number>;
  testHistory: TestResult[];
  setBundesland: (name: string) => void;
  recordPractice: (key: string, choice: number) => void;
  resetPractice: () => void;
  addTestResult: (r: TestResult) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      bundesland: null,
      practiceAnswers: {},
      testHistory: [],
      setBundesland: (name) => set({ bundesland: name }),
      recordPractice: (key, choice) =>
        set((s) => ({ practiceAnswers: { ...s.practiceAnswers, [key]: choice } })),
      resetPractice: () => set({ practiceAnswers: {} }),
      addTestResult: (r) => set((s) => ({ testHistory: [r, ...s.testHistory] })),
    }),
    { name: "lid-store" },
  ),
);
