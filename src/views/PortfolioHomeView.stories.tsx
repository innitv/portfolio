import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, fn, userEvent, within } from "storybook/test"

import { PortfolioHomeView } from "./PortfolioHomeView"

/**
 * Главная — разводящая по компаниям.
 *
 * История рендерит ТОТ ЖЕ компонент, что роут `#portfolio`: расхождение
 * витрины и приложения здесь невозможно по построению.
 */
const meta = {
  component: PortfolioHomeView,
  parameters: { layout: "fullscreen" },
  title: "Pages/PortfolioHome",
} satisfies Meta<typeof PortfolioHomeView>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { onContact: fn(), onOpenCompany: fn() },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)

    const heading = canvas.getAllByRole("heading", { level: 1 })
    await expect(heading).toHaveLength(1)
    /* Группа кружков вшита в заголовок, но СЛОВ в него не добавляет: знаки —
     * `aria-hidden`, имя кнопки живёт в `aria-label`. Пробелы схлопываются:
     * знаки вставлены как разметка SVG, и между её тегами есть переводы
     * строк, которые попадают в `textContent`, но не в отрисовку. */
    const title = heading[0].textContent?.replace(/\s+/g, " ").trim()
    await expect(title).toBe("Дизайнер сложных продуктов")

    // Три одинаковые карточки компаний; карточек кейсов на разводящей нет.
    const cards = [...canvasElement.querySelectorAll('[data-testid^="pf-company-"]')]
    await expect(cards).toHaveLength(3)
    await expect(canvasElement.querySelectorAll('[data-testid^="pf-case-"]')).toHaveLength(0)
    const widths = cards.map((node) => Math.round(node.getBoundingClientRect().width))
    await expect(new Set(widths).size).toBe(1)

    // Сводного счётчика нет: «8 кейсов» читалось как «больше ничего нет»,
    // хотя показано только то, что можно показывать.
    await expect(canvas.queryByText(/8 кейсов/)).toBeNull()
    await expect(canvas.queryByText(/3 компании/)).toBeNull()

    /* ─── Контакт ровно в одном месте страницы ────────────────────────────
     * До правки 2026-08-03 шапка и подвал несли один и тот же набор ссылок,
     * и это прошло всю приёмку: каждая строка по отдельности корректна, а их
     * совпадение не проверял никто. Теперь контакт живёт только в подвале, и
     * проверка держит именно это — отсутствие в шапке наравне с наличием
     * внизу. */
    await expect(canvas.getByTestId("pf-header")).toBeVisible()
    await expect(canvas.queryByTestId("pf-contact-tg")).toBeNull()
    await expect(canvas.getByTestId("pf-footer-tg")).toBeVisible()
    // На самой главной имя не кликабельно.
    await expect(canvas.queryByTestId("pf-header-home")).toBeNull()

    /* ─── Первый экран: в заголовке только текст ──────────────────────────
     * Здесь стояла группа круглых знаков компаний (приём hero248). Убрана
     * владельцем 2026-08-03: из трёх знаков в 49 px опознавался один, а те же
     * компании показаны ниже полными логотипами со словами. Проверка держит
     * отсутствие — чтобы приём не вернулся молча вместе с чужой правкой. */
    await expect(canvas.queryByTestId("pf-marks")).toBeNull()
    await expect(heading[0].querySelector("button")).toBeNull()

    // Переход в компанию ведёт карточка, а не знак в заголовке.
    await userEvent.click(canvas.getByTestId("pf-company-rtk"))
    await expect(args.onOpenCompany).toHaveBeenCalledWith("rtk")

    /* ─── Первый экран: фон ───────────────────────────────────────────────
     * Обе подложки декоративные и не должны попадать ни в дерево
     * доступности, ни под курсор. */
    for (const id of ["pf-grid-pattern", "pf-hero-glow"]) {
      const layer = canvas.getByTestId(id)
      await expect(layer).toHaveAttribute("aria-hidden", "true")
      await expect(getComputedStyle(layer).pointerEvents).toBe("none")
    }
  },
  tags: ["vr-page"],
}
