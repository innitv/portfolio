import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, fn, within } from "storybook/test"

import { PortfolioCaseView } from "./PortfolioCaseView"

import { companies } from "./portfolio.data"

/**
 * Страница кейса целиком — для ручного просмотра и сверки с роутом.
 *
 * БЕЗ тега `vr-page` и с записью в `excludedStories`
 * (`tests/visual-regression/storybook-visual.spec.ts`): страница выше 5000 px и
 * в кадр 1280×2000 не помещается.
 */
const meta = {
  component: PortfolioCaseView,
  parameters: { layout: "fullscreen" },
  title: "Pages/PortfolioCaseFull",
} satisfies Meta<typeof PortfolioCaseView>

export default meta

type Story = StoryObj<typeof meta>

const a3 = companies[0]
const study = a3.cases[0]

export const FullPage: Story = {
  args: {
    caseStudy: study,
    company: a3,
    onHome: fn(),
    onOpenCase: fn(),
    onOpenCompany: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByTestId("pc-title")).toHaveTextContent(study.title)

    // Каждый показ подписан. Это приём из кадра владельца и главное отличие от
    // девяти живых сайтов из десяти: скриншот интерфейса без подписи заставляет
    // читателя гадать, на что смотреть.
    const shots = canvasElement.querySelectorAll(".pc-shot")
    const captions = canvasElement.querySelectorAll(".pc-shot figcaption")
    await expect(captions).toHaveLength(shots.length)
    for (const caption of captions) {
      await expect(caption.textContent?.trim().length ?? 0).toBeGreaterThan(0)
    }

    // Задача, таблица «что сделал / результат» и кобальтовый итог — на месте.
    await expect(canvas.getByTestId("pc-problem")).toBeVisible()
    await expect(canvas.getByTestId("pc-rows")).toBeVisible()
    await expect(canvas.getByTestId("pc-impact")).toBeVisible()

    // Страница уводит дальше, а не обрывается: соседний кейс той же компании.
    await expect(canvas.getByTestId("pc-next")).toBeVisible()
  },
}

/**
 * Весь текст стоит на одной силовой линии чуть левее центра.
 *
 * История сторожит приём образца `wemakefab.ru`, где линия проходит по 35 %
 * ширины. Путь до него занял день и четыре промаха: две равные колонки ставили
 * текст ровно в середину («смотришь только в правую часть»), узкая колонка
 * увела на четверть, доля 37.5 % дала 40 %, снятие колонки фактов прижало текст
 * к полю («я разве просил прижать к левой стороне»).
 *
 * Проверяется не одно число, а то, что линия ОДНА: тезис, абзац, показы и
 * таблица начинаются с одной вертикали. Разъедься они — страница развалится, и
 * поймать это глазами на восьми тысячах пикселей трудно.
 */
export const ForceLine: Story = {
  args: {
    caseStudy: study,
    company: a3,
    onHome: fn(),
    onOpenCase: fn(),
    onOpenCompany: fn(),
  },
  name: "Текст стоит на силовой линии",
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector<HTMLElement>(".pc-root")
    if (!root) throw new Error("Страница кейса не собралась")

    const origin = root.getBoundingClientRect().left
    const width = root.getBoundingClientRect().width
    const at = (node: Element) => Math.round(node.getBoundingClientRect().left - origin)

    const parts = [".pc-lead", ".pc-section-text", ".pc-part", ".pc-rows", ".pc-flow .pc-shots"]
      .map((selector) => canvasElement.querySelector(selector))
      .filter((node): node is Element => Boolean(node))

    const lines = [...new Set(parts.map(at))]
    await expect(lines, `Содержимое разъехалось по вертикалям: ${lines.join(", ")}`).toHaveLength(1)

    // Линия чуть левее центра: у образца 35 % ширины, допуск 28-45 %.
    const share = lines[0] / width
    await expect(share, `Линия на ${Math.round(share * 100)} % ширины`).toBeGreaterThan(0.28)
    await expect(share).toBeLessThan(0.45)

    /*
     * Заголовок раздела стоит НАД своим текстом, а не сбоку от него. Выносить
     * его в левую колонку пробовали — владелец вернул в поток: оторванный от
     * текста, он читался отдельным столбцом оглавления.
     */
    const part = canvasElement.querySelector(".pc-part")
    const text = canvasElement.querySelector(".pc-section-text")
    if (part && text) {
      await expect(at(part)).toBe(at(text))
    }

    // Сетки-подложки на светлой странице нет: она спорит со строками текста.
    await expect(canvasElement.querySelector(".pc-grid")).toBeNull()
  },
}
