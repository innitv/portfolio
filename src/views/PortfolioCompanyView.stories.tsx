import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, fn, within } from "storybook/test"

import { PortfolioCompanyView } from "./PortfolioCompanyView"

import { companies } from "./portfolio.data"

/**
 * Страница компании. Две истории — три кейса и два: сетка одна и та же, но
 * нечётное число оставляет последний ряд неполным, и это надо видеть.
 */
const meta = {
  component: PortfolioCompanyView,
  parameters: { layout: "fullscreen" },
  title: "Pages/PortfolioCompany",
} satisfies Meta<typeof PortfolioCompanyView>

export default meta

type Story = StoryObj<typeof meta>

export const ThreeCases: Story = {
  args: {
    company: companies[0],
    onContact: fn(),
    onHome: fn(),
    onOpenCase: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const cards = [...canvasElement.querySelectorAll('[data-testid^="pf-case-"]')]
    await expect(cards).toHaveLength(3)
    // Карточки одинаковые: разной ширины между ними нет.
    const widths = cards.map((node) => Math.round(node.getBoundingClientRect().width))
    await expect(new Set(widths).size).toBe(1)
    // Знака компании на этой странице нет: он повторял бы заголовок «А3».
    await expect(canvas.queryByTestId("pf-logo-a3")).toBeNull()
    await expect(canvas.getByRole("heading", { level: 1, name: "А3" })).toBeVisible()
    // Фон первого экрана принадлежит разводящей и сюда не приезжает: обе
    // подложки рендерит `PortfolioHomeView`, а не тема.
    await expect(canvas.queryByTestId("pf-grid-pattern")).toBeNull()
    await expect(canvas.queryByTestId("pf-hero-glow")).toBeNull()
  },
  tags: ["vr-page"],
}

export const TwoCases: Story = {
  args: {
    company: companies[2],
    onContact: fn(),
    onHome: fn(),
    onOpenCase: fn(),
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelectorAll('[data-testid^="pf-case-"]')).toHaveLength(2)
  },
  tags: ["vr-page"],
}
