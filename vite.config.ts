// Import defineConfig from vitest/config so the `test` field is typed.
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  base: "/deutsch-lid/",
  plugins: [react(), tailwindcss()],
  test: {
    include: ["src/**/*.test.{ts,tsx}", "scripts/**/*.test.ts"],
    passWithNoTests: true,
    globals: true,
    setupFiles: ["./src/test-setup.ts"],
  },
});
