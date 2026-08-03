import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, fn, within } from "storybook/test"

import { PortfolioCaseView } from "./PortfolioCaseView"

import { caseSections, companies } from "./portfolio.data"

/**
 * Страница кейса целиком — для ручного просмотра и сверки с роутом.
 *
 * БЕЗ тега `vr-page` и с записью в `excludedStories`
 * (`tests/visual-regression/storybook-visual.spec.ts`): страница выше 5000 px и
 * в кадр 1280×2000 не помещается. Пиксельная регрессия блоков ведётся
 * историями `Pages/PortfolioCase/*` в `components/portfolio/case-parts.stories.tsx`.
 */
const meta = {
  component: PortfolioCaseView,
  parameters: { layout: "fullscreen" },
  title: "Pages/PortfolioCaseFull",
} satisfies Meta<typeof PortfolioCaseView>

export default meta

type Story = StoryObj<typeof meta>

const a3 = companies[0]

export const FullPage: Story = {
  args: {
    caseStudy: a3.cases[0],
    company: a3,
    onContact: fn(),
    onHome: fn(),
    onOpenCompany: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    // Восемь разделов кейса — ровно столько заголовков второго уровня:
    // отдельного финального блока «Обсудить задачу» на странице больше нет,
    // контакты стоят в правой колонке.
    const expected = caseSections(a3.cases[0]).length
    await expect(canvas.getAllByRole("heading", { level: 2 })).toHaveLength(expected)
    // Липкого оглавления на странице нет: она обычная, со скроллом.
    await expect(canvasElement.querySelectorAll('[data-testid^="pf-step-"]')).toHaveLength(0)
    await expect(canvas.getByTestId("pf-case-aside")).toBeVisible()
    await expect(canvas.getByTestId("pf-case-article")).toBeVisible()
  },
}
