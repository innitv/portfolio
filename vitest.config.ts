import path from "node:path";
import { fileURLToPath } from "node:url";

import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const storybookConfigDir = path.resolve(rootDir, ".storybook");

// storybookTest() асинхронный, а defineConfig в vitest 4 не принимает
// async-фабрику конфига — плагины резолвятся top-level await.
const storybookPlugins = await storybookTest({ configDir: storybookConfigDir });

/**
 * Прогон Storybook-историй как тестов (play-функции + smoke-рендер).
 *
 * Браузерный режим — Chromium через уже установленный в проекте Playwright,
 * отдельный движок не добавляется.
 *
 * Конфиг сайта подключается через `extends`: оттуда приходят плагин React,
 * Tailwind и алиас `@/`. Без него истории не соберутся.
 *
 * Отдельный setup-файл с `setProjectAnnotations` не нужен: начиная с
 * Storybook 10.3 аннотации preview подключает сам аддон.
 */
export default defineConfig({
  test: {
    projects: [
      {
        extends: path.resolve(rootDir, "vite.config.ts"),
        plugins: storybookPlugins,
        root: rootDir,
        test: {
          browser: {
            enabled: true,
            headless: true,
            instances: [{ browser: "chromium" }],
            provider: playwright(),
          },
          dir: rootDir,
          name: "storybook",
        },
      },
    ],
  },
});
