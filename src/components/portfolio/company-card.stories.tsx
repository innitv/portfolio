import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, fn, within } from "storybook/test"

import { CardRow, CompanyCard } from "./company-card"
import { PortfolioStoryCanvas } from "./story-canvas"

import { companies } from "@/views/portfolio.data"

/**
 * Карточка компании — ячейка ряда: знак и название сверху, отрасль надзаголовком,
 * описание двухцветной фразой, переход со стрелкой снизу. Кликабельна целиком.
 *
 * Карточка всегда живёт внутри `CardRow`: своей рамки по периметру у неё нет,
 * внешний контур рисует ряд. Поэтому истории тоже рендерят её в ряду, а не
 * голой — иначе витрина показывала бы состояние, которого в приложении не
 * существует.
 */
const meta = {
  title: "Portfolio/CompanyCard",
} satisfies Meta

export default meta

type Story = StoryObj

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // Действие — не отдельная кнопка внутри карточки, а подпись: кликабельна
    // вся ячейка. Вложенных интерактивных элементов быть не должно.
    const card = canvasElement.querySelector<HTMLElement>('[data-testid="pf-company-a3"]')!
    await expect(card.tagName).toBe("BUTTON")
    await expect(card.querySelectorAll("button, a")).toHaveLength(0)
    await expect(canvas.getByText("Смотреть кейсы")).toBeVisible()

    /* ─── ИМЯ КОМПАНИИ СНЯТО С ЭКРАНА, НО НЕ ИЗ ДОСТУПНОГО ИМЕНИ ──────────
     * Знаки словесные, и подпись рядом повторяла сама себя («Ростелеком
     * РТК»). Подпись убрана, но знак — `aria-hidden`, поэтому без `sr-only`
     * карточка потеряла бы ответ на вопрос «чья это компания».
     *
     * Проверяется ровно эта пара: имя есть в доступном имени кнопки и
     * отсутствует в геометрии страницы. */
    await expect(canvas.getByRole("button", { name: /^А3\b/ })).toBe(card)

    const label = card.querySelector<HTMLElement>(".sr-only")!
    await expect(label.textContent).toBe("А3")
    await expect(Math.round(label.getBoundingClientRect().width)).toBeLessThanOrEqual(1)

    /* Надзаголовок собирает отрасль и период. Счётчик кейсов снят владельцем
       2026-08-03: на разводящей он читается как исчерпывающий список работ. */
    await expect(canvas.getByText("B2B-платежи · 2025—н.в.")).toBeVisible()
    await expect(canvas.queryByText(/\d+ кейс/)).toBeNull()

    /* Двухцветная фраза режется по двоеточию, а не по числу символов:
       приглушённой становится ровно вторая половина описания.

       Источник фразы — , короткая версия описания. Заведена
       владельцем 2026-08-03: полное описание занимало в карточке четыре-пять
       строк. Обрезку многоточием он отверг прямо — «это значит, что его надо
       переписать», поэтому текст сокращён, а не спрятан. Полная версия живёт
       в  и показывается на странице компании. */
    const tail = canvasElement.querySelector('[data-testid="pf-lede-tail"]')
    await expect(tail?.textContent).toBe("рабочий кабинет.")

    // Карточка укладывается максимум в три строки — требование владельца.
    const lede = canvasElement.querySelector<HTMLElement>(".pf-h2")!
    const lines = Math.round(
      lede.getBoundingClientRect().height / parseFloat(getComputedStyle(lede).lineHeight),
    )
    await expect(lines).toBeLessThanOrEqual(3)
  },
  /* 318, а не 420: ровно такова колонка карточки в ряду из трёх на 1440
     (замер в браузере). Прежние 420 давали 32 знака в строке вместо реальных
     24, и проверка на три строки была зелёной, когда в интерфейсе фраза
     занимала четыре. Витрина обязана мерить в той же ширине, что и страница,
     иначе она проверяет не то. */
  render: () => (
    <PortfolioStoryCanvas width={318}>
      <CardRow columns={1}>
        <CompanyCard company={companies[0]} onOpen={fn()} />
      </CardRow>
    </PortfolioStoryCanvas>
  ),
}

/**
 * Три карточки в ряду — единственный способ увидеть, что они одинаковые:
 * по отдельности разная длина описания незаметна, а в ряду видно, ровно ли
 * стоят надзаголовок и строка перехода при разной высоте текста.
 *
 * Здесь же проверяется контракт разделителей: линии рисуются соседям, а не
 * периметром каждой ячейки, иначе на стыках получается двойная граница.
 * Проверка опирается на вьюпорт ≥1024 — у браузерного прогона он 1280.
 */
export const Row: Story = {
  play: async ({ canvasElement }) => {
    const cards = [...canvasElement.querySelectorAll<HTMLElement>('[data-testid^="pf-company-"]')]
    await expect(cards).toHaveLength(3)

    const heights = cards.map((node) => Math.round(node.getBoundingClientRect().height))
    await expect(new Set(heights).size).toBe(1)

    /* ─── ЗНАКИ СТОЯТ НА ОДНОЙ ОПТИЧЕСКОЙ ОСИ ──────────────────────────────
     * Найдено просмотром полностраничного снимка: после снятия подписи высоту
     * верхней строки стал задавать сам знак, и «Самолет» (20 px) поднялся на
     * 12 px выше «Ростелекома» (32 px). Раньше строку держал текст подписи, а
     * его больше нет. Проверяется центр, а не верх: знаки разной высоты
     * выравниваются по середине. */
    const centers = cards.map((node) => {
      const logo = node.querySelector(".pf-logo")!.getBoundingClientRect()
      return Math.round(logo.top + logo.height / 2)
    })
    await expect(new Set(centers).size).toBe(1)

    await expect(getComputedStyle(cards[0]).borderLeftWidth).toBe("0px")
    await expect(getComputedStyle(cards[1]).borderLeftWidth).toBe("1px")
    await expect(getComputedStyle(cards[2]).borderLeftWidth).toBe("1px")
    // Верхних границ в ряду нет: они принадлежат вертикальной раскладке.
    for (const card of cards) {
      await expect(getComputedStyle(card).borderTopWidth).toBe("0px")
    }
  },
  render: () => (
    <PortfolioStoryCanvas width={1152}>
      <CardRow columns={3}>
        {companies.map((company) => (
          <CompanyCard company={company} key={company.id} onOpen={fn()} />
        ))}
      </CardRow>
    </PortfolioStoryCanvas>
  ),
}
