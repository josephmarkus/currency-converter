import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/mock/**", "src/test/**", "src/index.tsx"],
      reporter: ["text", "html"],
    },
  },
  define: {
    "import.meta.env.VITE_API_URL": JSON.stringify(
      "https://currency-converter-worker.josephmarkus.workers.dev"
    ),
    "import.meta.env.VITE_API_KEY": JSON.stringify(""),
  },
});
