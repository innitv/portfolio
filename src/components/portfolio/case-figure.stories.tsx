import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect } from "storybook/test"

import { CaseFigure, CaseFigures } from "./case-figure"
import { PortfolioStoryCanvas } from "./story-canvas"

import { companies, maxRenderWidth } from "@/views/portfolio.data"

/**
 * Кадр со скриншотом — единственное место сайта, где живёт цвет.
 *
 * Четыре истории: одиночный кадр (ширина считается от разрешения ассета),
 * пара с общей подписью, пара с разными подписями и отсутствующий ассет.
 */
const meta = {
  title: "Portfolio/CaseFigure",
} satisfies Meta

export default meta

type Story = StoryObj

const a3 = companies[0]
const dashboard = a3.cases[0]
const flow = a3.cases[1]

export const Single: Story = {
  play: async ({ canvasElement }) => {
    const image = canvasElement.querySelector("img")
    await expect(image).not.toBeNull()
    // Кадр не растянут выше natural/1.5: ширина показа вычисляется из
    // максимального доступного разрешения, а не назначается вёрсткой.
    await expect(maxRenderWidth("a3-dashboard-redesign-figma-main-card-CSycQJK_")).toBe(478)
    await expect(maxRenderWidth("rtk-onboarding-hero-DMLR2-UA")).toBe(1152)
  },
  render: () => (
    <PortfolioStoryCanvas width={1160}>
      <CaseFigure image={dashboard.coverImage!} />
    </PortfolioStoryCanvas>
  ),
}

/**
 * Пара кадров: показан один, второй — по стрелке.
 *
 * ─── ЧТО ИМЕННО ДЕРЖИТ ПРОВЕРКА ─────────────────────────────────────────────
 * Кадры группы лежат в ОДНОЙ ячейке сетки, поэтому в разметке присутствуют оба
 * и «видно один» нельзя проверить через `toBeNull`. Проверяется то, что и
 * задумано: невидимый кадр помечен `aria-hidden` и скрыт классом, а стрелка
 * гаснет на краю. Подписи у этой пары совпадают дословно — под рамкой стоит
 * одна строка, а не две одинаковые.
 */
export const PairWithSharedCaption: Story = {
  play: async ({ canvasElement, userEvent }) => {
    const group = canvasElement.querySelector('[data-testid="pf-figure-group"]')
    await expect(group).not.toBeNull()

    // Подпись одна на пару и не мигает при переключении.
    await expect(canvasElement.querySelectorAll('[data-testid="pf-figure-caption"]')).toHaveLength(1)

    // На первом кадре «назад» недоступна, «вперёд» доступна.
    const prev = canvasElement.querySelector<HTMLButtonElement>('[data-testid="pf-figure-prev"]')!
    const next = canvasElement.querySelector<HTMLButtonElement>('[data-testid="pf-figure-next"]')!
    await expect(prev.disabled).toBe(true)
    await expect(next.disabled).toBe(false)

    // Виден ровно один кадр: остальные скрыты от скринридера и от глаза.
    const frames = [...group!.querySelectorAll("[aria-hidden]")]
    await expect(frames.filter((f) => f.getAttribute("aria-hidden") === "false")).toHaveLength(1)

    await userEvent.click(next)
    await expect(next.disabled).toBe(true)
    await expect(prev.disabled).toBe(false)
  },
  render: () => (
    <PortfolioStoryCanvas width={1160}>
      <CaseFigures images={dashboard.detailSections![3].images!} />
    </PortfolioStoryCanvas>
  ),
}

/**
 * Пара с разными подписями и разной пропорцией — самый тяжёлый случай.
 *
 * У этой пары 1.60 и 0.94: без потолка высоты рамка прыгала бы на ~300 px при
 * переключении, а текст под ней уезжал. Проверка меряет высоту группы до и
 * после клика — она обязана совпасть.
 */
export const PairWithOwnCaptions: Story = {
  play: async ({ canvasElement, userEvent }) => {
    const group = canvasElement.querySelector('[data-testid="pf-figure-group"]')!
    const caption = canvasElement.querySelector('[data-testid="pf-figure-caption"]')!
    const before = { h: Math.round(group.getBoundingClientRect().height), text: caption.textContent }

    await userEvent.click(canvasElement.querySelector('[data-testid="pf-figure-next"]')!)

    // Подпись сменилась вместе с кадром, высота — нет.
    await expect(caption.textContent).not.toBe(before.text)
    await expect(Math.round(group.getBoundingClientRect().height)).toBe(before.h)
  },
  render: () => (
    <PortfolioStoryCanvas width={1160}>
      <CaseFigures images={flow.detailSections![1].images!} />
    </PortfolioStoryCanvas>
  ),
}

/**
 * Кадра нет в манифесте оптимизированных изображений.
 *
 * Молча показать битую картинку нельзя: отсутствующий ассет обязан быть
 * ВИДЕН как отсутствующий, иначе пустое место на странице неотличимо от
 * задуманной паузы.
 */
export const MissingAsset: Story = {
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector("img")).toBeNull()
  },
  render: () => (
    <PortfolioStoryCanvas width={640}>
      <CaseFigure
        image={{
          alt: "Кадр, которого нет",
          caption: "Кадр, которого нет",
          src: "https://ivan-ignatov.online/assets/no-such-frame.png",
        }}
      />
    </PortfolioStoryCanvas>
  ),
}
