import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, fn, userEvent, waitFor, within } from "storybook/test"

import { PortfolioArchiveView } from "./PortfolioArchiveView"

/**
 * `/archive` — экран с полосой Archive.
 *
 * История рендерит ТОТ ЖЕ компонент, что роут: расхождение витрины и
 * приложения здесь невозможно по построению.
 *
 * ─── ЧЕГО ЗДЕСЬ БОЛЬШЕ НЕ ЖДУТ ──────────────────────────────────────────────
 * До 2026-08-13 экран открывался заездом, и проверки ждали его финиша — 4.5 с
 * проезда плюс лампы старта. Заезд стал пасхалкой на финишном флаге, при заходе
 * он не идёт, и содержимое проявляется сразу после гарнитур. Ожидание осталось,
 * но короткое: оно про шрифты, а не про заезд.
 */
const meta = {
  component: PortfolioArchiveView,
  parameters: { layout: "fullscreen" },
  title: "Pages/PortfolioArchive",
} satisfies Meta<typeof PortfolioArchiveView>

export default meta

type Story = StoryObj<typeof meta>

/** Потолок ожидания проявления: гарнитуры до 0.6 с плюс лесенка 0.8 с. */
const BOOT_TIMEOUT = 5000

export const Default: Story = {
  args: { onHome: fn(), onOpenCase: fn() },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // Полоса Archive существует С НАЧАЛА: она и есть трасса, а не элемент,
    // который появится после загрузки.
    await expect(canvas.getByTestId("pa-stripe")).toBeVisible()

    // Болид стоит на старте: заезда при заходе нет, он ждёт нажатия на флаг.
    await expect(canvas.getByTestId("pa-car")).toBeInTheDocument()
    await expect(canvas.getByTestId("pa-car-wrap")).toHaveAttribute("data-drive", "false")

    // Кнопки «↻ заезд» больше нет — запуск только с шахматки.
    await expect(canvas.queryByTestId("pa-replay")).toBeNull()
    await expect(canvas.getByTestId("pa-flag")).toBeVisible()

    // Содержимое проявилось, не дожидаясь никакого заезда.
    await waitFor(
      () => expect(getComputedStyle(canvas.getByTestId("pa-word")).opacity).toBe("1"),
      { timeout: BOOT_TIMEOUT },
    )

    // Три имени и два разделителя между ними — ряд стоит по содержимому.
    const cells = canvasElement.querySelectorAll('[data-testid^="pa-company-"]')
    await expect(cells).toHaveLength(3)
    await expect(canvasElement.querySelectorAll(".pa-sep")).toHaveLength(2)

    // Синего экрана до нажатия нет: он приходит по клику, а не по наведению.
    await userEvent.hover(canvas.getByTestId("pa-company-a3"))
    await expect(canvas.queryByTestId("pa-sheet")).toBeNull()

    /*
     * Крупные слова несут зафиксированное сглаживание.
     *
     * Сам дефект машина не видит: в headless композитинг идёт иначе, и кадры
     * текста в композитном слое и вне его совпадают побайтово. Но объявление
     * свойства проверить можно — и это ловит его случайное снятие, из-за
     * которого буквы снова начнут менять толщину по ходу анимации.
     * Разбор — `/ui-craft:build` §7.1.
     */
    for (const selector of [".pa-word", ".pa-name"]) {
      const node = canvasElement.querySelector(selector)
      if (!node) throw new Error(`Не найдено ${selector}`)
      await expect(
        getComputedStyle(node).getPropertyValue("-webkit-font-smoothing"),
        `${selector}: сглаживание не зафиксировано`,
      ).toBe("antialiased")
    }
  },
  tags: ["vr-page"],
}

/**
 * Ничто не выходит за правое поле.
 *
 * Проверка заведена 2026-08-13 по следам разбора адаптива: кегли были
 * константами, и на всём диапазоне 721-1400 ряд имён не помещался — на планшете
 * «RTK» не было видно вовсе, а «SAMOLET» обрезался посреди слова. Дефект жил
 * молча: `overflow: hidden` на корне убирал горизонтальную полосу прокрутки, и
 * ни один прогон его не видел.
 *
 * Кегли теперь считаются от ширины поля, но в формуле ряда есть слагаемое,
 * зависящее от СОДЕРЖИМОГО (ширина двух самых длинных мет — 398 px). Добавится
 * компания или удлинится подпись — ряд снова полезет за край. Эта история
 * поймает: она меряет правый край текста, а не бокса.
 */
export const FitsWithinField: Story = {
  args: { onHome: fn(), onOpenCase: fn() },
  name: "Ряд имён не выходит за поле",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await waitFor(
      () => expect(getComputedStyle(canvas.getByTestId("pa-word")).opacity).toBe("1"),
      { timeout: BOOT_TIMEOUT },
    )
    await document.fonts.ready

    const root = canvasElement.querySelector<HTMLElement>(".pa-root")
    if (!root) throw new Error("Корень экрана не найден")

    const field = parseFloat(getComputedStyle(root).getPropertyValue("--pa-field")) || 60
    const limit = root.getBoundingClientRect().right - field

    /** Правый край САМОГО ТЕКСТА: бокс элемента шире и переполнения не выдаёт. */
    const textRight = (node: Element) => {
      const range = document.createRange()
      range.selectNodeContents(node)
      return range.getBoundingClientRect().right
    }

    for (const node of canvasElement.querySelectorAll(".pa-name, .pa-word, .pa-cursive")) {
      const overflow = Math.round(textRight(node) - limit)
      await expect(
        overflow,
        `«${node.textContent}» выходит за правое поле на ${overflow} px`,
      ).toBeLessThanOrEqual(0)
    }

    // Курсив «Archive» не заезжает под шахматку: она кнопка, и перекрытый текст
    // читался как «Archi_e» на 320 и на 721.
    const cursive = canvasElement.querySelector(".pa-cursive")
    const flag = canvas.getByTestId("pa-flag")
    if (cursive) {
      const gap = Math.round(flag.getBoundingClientRect().left - textRight(cursive))
      await expect(gap, `Зазор от «Archive» до шахматки ${gap} px`).toBeGreaterThan(0)
    }
  },
}

/**
 * Синий экран компании: кейсы посередине, величины внизу.
 *
 * Величины подняты из тел кейсов (`caseMetrics`), а не из их итогов: итог уже
 * стоит в строке кейса справа, и второй раз тем же текстом экран его не
 * повторяет.
 */
export const CompanySheet: Story = {
  args: { onHome: fn(), onOpenCase: fn() },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)

    await waitFor(
      () => expect(getComputedStyle(canvas.getByTestId("pa-word")).opacity).toBe("1"),
      { timeout: BOOT_TIMEOUT },
    )

    await userEvent.click(canvas.getByTestId("pa-company-a3"))
    const sheet = await canvas.findByTestId("pa-sheet")
    await expect(sheet).toBeVisible()

    // Три кейса А3 из данных сайта, а не вписанные в разметку.
    await expect(canvasElement.querySelectorAll(".pa-case")).toHaveLength(3)

    // Строка кейса ведёт на настоящую страницу кейса.
    await userEvent.click(canvas.getByTestId("pa-case-dashboard-redesign"))
    await expect(args.onOpenCase).toHaveBeenCalledWith("a3", "dashboard-redesign")

    // Возврат по «все работы»; Esc делает то же самое.
    await userEvent.click(canvas.getByTestId("pa-back"))
    await waitFor(() => expect(canvas.queryByTestId("pa-sheet")).toBeNull())
  },
}
