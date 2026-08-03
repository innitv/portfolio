import type { Preview } from "@storybook/react-vite";

// Единственный источник визуального слоя: Tailwind + сгенерированные токены
// (design/tokens/shadcn -> yarn tokens:build -> src/styles/shadcn/tokens.generated.css).
// Без этого импорта компоненты рендерятся без стилей.
import "../src/styles.css";
import "./canvas.css";

const preview: Preview = {
  parameters: {
    a11y: {
      // Режим предупреждений: нарушения видны в панели Accessibility,
      // но сборку и тесты не валят. Ужесточать до "error" — отдельным шагом,
      // когда объём проблем разобран.
      test: "todo",
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    layout: "centered",
  },
  // autodocs намеренно не включён: он требует отдельного пакета
  // @storybook/addon-docs, а задача этапа — витрина состояний, не doc-сайт.
};

export default preview;
