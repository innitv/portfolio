import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, within } from "storybook/test"

import { MetricStrip } from "./metric-strip"
import { PortfolioStoryCanvas } from "./story-canvas"

import { caseMetrics, companies } from "@/views/portfolio.data"

/**
 * Строка метрик собирается из реальных кейсов, а не из выдуманного массива:
 * весь смысл компонента в том, ЧТО он смог поднять из текста, и подставные
 * данные скрыли бы главный риск — «чисел не нашлось».
 */
const meta = {
  title: "Portfolio/MetricStrip",
} satisfies Meta

export default meta

type Story = StoryObj

const a3 = companies[0]
const smlt = companies[2]

/**
 * Ряд метрик кейса «Редизайн главной».
 *
 * Проверка держит две вещи разом — они связаны одной причиной.
 *
 * 1. Единица одна на весь ряд. У этого кейса в разделе «Метрики успеха» есть
 *    четвёртое число — «рост CES на 10–15 пунктов», и до правки 2026-08-03
 *    оно поднималось сюда наравне с процентами. Голое число в чужой единице
 *    рядом с процентами читается как проценты, а это неверно.
 * 2. Числа стоят на одной линии. Слово «пунктов» не помещалось в колонку
 *    230 px, переносилось второй строкой и поднимало своё число на 40 px над
 *    соседями — ряд из четырёх чисел стоял на двух разных линиях. Заметил
 *    оркестратор замером; ни один тест этого не видел.
 *
 * Проверяется ровность ВЫЧИСЛЕННАЯ, а не пересчёт «должно быть три»: правило
 * в `caseMetrics` общее, и тест обязан ловить его нарушение на любом кейсе, а
 * не совпадение с сегодняшним числом метрик.
 */
export const SameUnitRow: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    // Числа подняты дословно из раздела «Метрики успеха» кейса.
    await expect(canvas.getByText("15–25%")).toBeVisible()
    await expect(canvas.getByText("Activation")).toBeVisible()

    // Величина в чужой единице в шапку не поднимается.
    await expect(canvas.queryByText(/пунктов/)).toBeNull()

    /* Все числа стоят на одной линии внутри своей строки сетки.
       Сравнивается СМЕЩЕНИЕ числа от верха его ячейки, а не абсолютный `top`:
       ниже `xl` сетка встаёт в две колонки, и разный `top` там означает
       законную вторую строку, а не дефект. Ровность ломалась иначе —
       двухстрочное значение выравнивалось по низу ячейки и уезжало вверх,
       из-за чего смещение у него отличалось от соседей. */
    const strip = canvasElement.querySelector('[data-testid="pf-metric-strip"]')
    const offsets = [...strip!.children].map((cell) =>
      Math.round(
        cell.firstElementChild!.getBoundingClientRect().top - cell.getBoundingClientRect().top
      )
    )
    await expect(new Set(offsets).size).toBe(1)
  },
  render: () => (
    <PortfolioStoryCanvas width={1160}>
      <MetricStrip metrics={caseMetrics(a3.cases[0])} />
    </PortfolioStoryCanvas>
  ),
}

/**
 * Значения вида «до → после»: связка мельче чисел.
 *
 * У кейса «Услуги Web» все три значения имеют вид «3% → 7%», и до правки
 * 2026-08-03 каждое ломалось надвое: «3% →» / «7%». Ячейка ряда 158 px, а
 * значению для одной строки нужно было 164 — не хватало шести пикселей,
 * которые съедала стрелка, набранная кеглем 36 наравне с числами.
 *
 * Проверка держит результат, а не приём: значение занимает ОДНУ строку, и все
 * значения ряда стоят на одной линии. Если однажды кегль, зазор или число
 * колонок изменят баланс, тест упадёт независимо от того, как сделана стрелка.
 */
export const RangeValues: Story = {
  play: async ({ canvasElement }) => {
    const cells = [...canvasElement.querySelector('[data-testid="pf-metric-strip"]')!.children]
    const values = cells.map((cell) => cell.firstElementChild!)

    // Одна строка: высота значения не выше своего межстрочного.
    for (const value of values) {
      const lineHeight = parseFloat(getComputedStyle(value).lineHeight)
      await expect(value.getBoundingClientRect().height).toBeLessThanOrEqual(lineHeight + 1)
    }

    // И все значения ряда — на одной линии.
    const offsets = cells.map((cell) =>
      Math.round(cell.firstElementChild!.getBoundingClientRect().top - cell.getBoundingClientRect().top)
    )
    await expect(new Set(offsets).size).toBe(1)
  },
  render: () => (
    <PortfolioStoryCanvas width={1160}>
      <MetricStrip metrics={caseMetrics(companies[1].cases[1])} />
    </PortfolioStoryCanvas>
  ),
}

/** Кейс без раздела метрик: числа берутся из `result[]`. */
export const FromResult: Story = {
  render: () => (
    <PortfolioStoryCanvas width={1160}>
      <MetricStrip metrics={caseMetrics(smlt.cases[0])} />
    </PortfolioStoryCanvas>
  ),
}

/**
 * Пустое состояние: чисел в кейсе не нашлось — строки нет вовсе.
 * Правило образца «нет значения, нет строки»: пустая рамка с прочерками
 * выглядела бы как отсутствующие данные, а не как их отсутствие в тексте.
 */
export const Empty: Story = {
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('[data-testid="pf-metric-strip"]')).toBeNull()
  },
  render: () => (
    <PortfolioStoryCanvas width={1160}>
      <p className="pf-caption pf-ink-soft">Ниже должно быть пусто:</p>
      <MetricStrip metrics={[]} />
    </PortfolioStoryCanvas>
  ),
}
