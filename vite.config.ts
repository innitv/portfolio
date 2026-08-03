import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(rootDir, "dist");

function portfolioProductionHints() {
  return {
    name: "portfolio-production-hints",
    transformIndexHtml() {
      return [
        {
          tag: "link",
          attrs: { rel: "dns-prefetch", href: "https://framerusercontent.com" },
          injectTo: "head-prepend" as const,
        },
        {
          tag: "link",
          attrs: { rel: "preconnect", href: "https://framerusercontent.com", crossorigin: "" },
          injectTo: "head-prepend" as const,
        },
      ];
    },
    closeBundle() {
      const htaccessSource = path.join(rootDir, "public", ".htaccess");
      if (existsSync(htaccessSource)) {
        mkdirSync(outDir, { recursive: true });
        copyFileSync(htaccessSource, path.join(outDir, ".htaccess"));
      }
    },
  };
}

export default defineConfig({
  root: rootDir,
  plugins: [react(), tailwindcss(), portfolioProductionHints()],
  resolve: {
    // Тот же алиас, что в верстаке студии: код переносится без правки импортов.
    alias: { "@": path.resolve(rootDir, "src") },
  },
  define: {
    "import.meta.env.VITE_PORTFOLIO_BASE_PATH": JSON.stringify("/"),
  },
  build: {
    outDir,
    emptyOutDir: true,
  },
});
