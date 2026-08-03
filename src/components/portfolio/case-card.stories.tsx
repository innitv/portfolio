import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, fn, within } from "storybook/test"

import { CaseCard } from "./case-card"
import { CardRow } from "./company-card"
import { PortfolioStoryCanvas } from "./story-canvas"

import { companies } from "@/views/portfolio.data"

/**
 * Карточка кейса — та же ячейка ряда, что и у компании. Сверху номер и
 * категория вместо знака и названия, снизу название с приглушённым
 * подзаголовком и переход со стрелкой.
 */
const meta = {
  title: "Portfolio/CaseCard",
} satisfies Meta

export default meta

type Story = StoryObj

const a3 = companies[0]
const rtk = companies[1]

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    const card = canvasElement.querySelector<HTMLElement>('[data-testid="pf-case-flow"]')!
    await expect(card.tagName).toBe("BUTTON")
    await expect(card.querySelectorAll("button, a")).toHaveLength(0)

    // Года на карточке нет намеренно: в данных у кейсов А3 стоит 2023 при
    // периоде компании 2025—н.в., и вывод поля показал бы расхождение,
    // которое принадлежит контенту, а не вёрстке.
    await expect(canvas.queryByText("2023")).toBeNull()

    // Верхняя строка: номер занимает место знака компании, рядом категория.
    await expect(canvas.getByText("II")).toBeVisible()
    await expect(canvas.getByText("UX · Conversion")).toBeVisible()

    // Подзаголовок — приглушённое продолжение названия, а не отдельный абзац.
    const tail = canvasElement.querySelector('[data-testid="pf-lede-tail"]')
    await expect(tail?.textContent).toBe("Самостоятельная регистрация поставщика")
    await expect(canvas.getByText("Читать кейс")).toBeVisible()
  },
  render: () => (
    <PortfolioStoryCanvas width={420}>
      <CardRow columns={1}>
        <CaseCard caseStudy={a3.cases[1]} onOpen={fn()} />
      </CardRow>
    </PortfolioStoryCanvas>
  ),
}

/**
 * Самая длинная пара «название плюс подзаголовок» рядом с самой короткой:
 * ячейки обязаны остаться одной высоты, а строки перехода — стоять на одной
 * линии, потому что низ прижат, а не следует за текстом.
 */
export const LongestAndShortest: Story = {
  play: async ({ canvasElement }) => {
    const cards = [...canvasElement.querySelectorAll<HTMLElement>('[data-testid^="pf-case-"]')]
    const heights = cards.map((node) => Math.round(node.getBoundingClientRect().height))
    await expect(new Set(heights).size).toBe(1)

    const links = [...canvasElement.querySelectorAll<HTMLElement>("svg")].map((node) =>
      Math.round(node.getBoundingClientRect().bottom),
    )
    await expect(new Set(links).size).toBe(1)
  },
  render: () => (
    <PortfolioStoryCanvas width={1152}>
      <CardRow columns={2}>
        <CaseCard caseStudy={rtk.cases[0]} onOpen={fn()} />
        <CaseCard caseStudy={a3.cases[2]} onOpen={fn()} />
      </CardRow>
    </PortfolioStoryCanvas>
  ),
}
