// Import defineConfig from vitest/config so the `test` field is typed.
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "/deutsch-lid/",
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icon.svg", "images/*.png"],
      workbox: { globPatterns: ["**/*.{js,css,html,svg,png,json}"], maximumFileSizeToCacheInBytes: 5_000_000 },
      manifest: {
        name: "Leben in Deutschland — Quiz",
        short_name: "LiD Quiz",
        start_url: "/deutsch-lid/",
        scope: "/deutsch-lid/",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#1c1917",
        icons: [
          { src: "icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any maskable" },
        ],
      },
    }),
  ],
  test: {
    include: ["src/**/*.test.{ts,tsx}", "scripts/**/*.test.ts"],
    passWithNoTests: true,
    globals: true,
    setupFiles: ["./src/test-setup.ts"],
  },
});
