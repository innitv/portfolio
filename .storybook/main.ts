import path from "node:path";
import { fileURLToPath } from "node:url";

import type { StorybookConfig } from "@storybook/react-vite";

const configDir = path.dirname(fileURLToPath(import.meta.url));

/**
 * Конфигурация Storybook как витрины компонентов сайта (shadcn/ui).
 *
 * Vite-конфиг сайта (`vite.config.ts`) подключается явным `viteConfigPath`:
 * @storybook/react-vite сам НЕ добавляет @vitejs/plugin-react и
 * @tailwindcss/vite, поэтому без него не соберутся ни JSX, ни Tailwind-слой,
 * через который приходят токены `src/styles/shadcn/tokens.generated.css`. Он
 * же несёт алиас `@/` — без него не разрешится ни один импорт компонентов.
 *
 * `builder-vite` берёт projectRoot как `dirname(configDir)`, то есть корень
 * репозитория — он совпадает с `root` в vite.config.ts, поэтому конфликта
 * корней нет. Секция `build` пользовательского конфига билдером отбрасывается,
 * так что `outDir: dist` на сборку Storybook не влияет.
 */
const config: StorybookConfig = {
  addons: ["@storybook/addon-a11y", "@storybook/addon-vitest"],
  core: {
    // Данные не должны покидать локальную песочницу без approval.
    disableTelemetry: true,
  },
  framework: {
    name: "@storybook/react-vite",
    options: {
      builder: {
        viteConfigPath: path.resolve(configDir, "../vite.config.ts"),
      },
    },
  },
  stories: ["../src/**/*.stories.@(ts|tsx)"],
  typescript: {
    reactDocgen: "react-docgen-typescript",
  },
};

export default config;
