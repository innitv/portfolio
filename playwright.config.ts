import { defineConfig, devices } from "@playwright/test";

/**
 * Порт превью настраивается переменной `PORTFOLIO_PREVIEW_PORT`.
 *
 * Причина не гипотетическая: `reuseExistingServer` переиспользует ЛЮБОЙ живой
 * сервер на этом порту, а 4173 — дефолт `vite preview`, поэтому запущенное
 * рядом превью другого проекта молча принимает прогон на себя. Тесты при этом
 * не падают с ошибкой соединения, а проверяют чужой сайт и дают осмысленно
 * выглядящий результат. Поймано при переносе 2026-08-03: на 4173 висел
 * верстак студии, и первый прогон отрапортовал бы по его страницам.
 */
const PORT = process.env.PORTFOLIO_PREVIEW_PORT ?? "4173";
const BASE_URL = `http://127.0.0.1:${PORT}`;

const webServer = process.env.PLAYWRIGHT_NO_WEBSERVER === "1"
  ? undefined
  : {
      command: `yarn preview --port ${PORT}`,
      url: BASE_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    };

export default defineConfig({
  testDir: "tests",
  timeout: 30_000,
  fullyParallel: true,
  reporter: [["list"], ["html", { open: "never", outputFolder: "reports/playwright" }]],
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer,
  projects: [
    {
      name: "chromium-desktop",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "chromium-mobile",
      use: { ...devices["Pixel 7"] },
    },
  ],
});
