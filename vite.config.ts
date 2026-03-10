import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { execSync } from "child_process";
import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

function getGitHash(): string {
  try {
    return execSync("git rev-parse --short HEAD").toString().trim();
  } catch {
    return Date.now().toString(36);
  }
}

function serviceWorkerPlugin() {
  return {
    name: "service-worker-version",
    writeBundle() {
      const gitHash = getGitHash();
      const timestamp = Date.now().toString(36);
      const buildVersion = `${gitHash}-${timestamp}`;

      const swPath = resolve(__dirname, "dist/sw.js");
      const swContent = readFileSync(swPath, "utf-8");
      const updatedContent = swContent.replace(/__BUILD_VERSION__/g, buildVersion);
      writeFileSync(swPath, updatedContent);

      console.log(`\n✓ Service worker version: ${buildVersion}\n`);
    },
  };
}

export default defineConfig(({ command }) => {
  const isProd = command === "build";

  return {
    plugins: [react(), serviceWorkerPlugin()],
    resolve: {
      alias: isProd
        ? {
            react: "preact/compat",
            "react-dom": "preact/compat",
            "react/jsx-runtime": "preact/jsx-runtime",
          }
        : undefined,
    },
    server: {
      port: 3000,
    },
    build: {
      target: "esnext",
    },
  };
});
