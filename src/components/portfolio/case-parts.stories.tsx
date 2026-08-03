import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, fn, within } from "storybook/test"

import { CaseArticle, CaseAside, CaseIntro } from "./case-parts"
import { PortfolioStoryCanvas } from "./story-canvas"

import { caseSections, companies } from "@/views/portfolio.data"

/**
 * Блоки страницы кейса.
 *
 * Страница кейса выше 5000 px и в кадр регрессии 1280×2000 целиком не
 * помещается. Поэтому её пиксельная регрессия ведётся ЗДЕСЬ, по блокам, а
 * `Pages/PortfolioCaseFull` исключена из скриншот-покрытия явной записью с
 * причиной. Блоки — тот же код, что стоит в роуте.
 *
 * Ширина полотна у блоков левой колонки — 692: ровно та, в которой они стоят
 * на странице (`lg:max-w-[692px]`). Снимать их во всю ширину контейнера
 * значило бы проверять раскладку, которой на сайте не существует.
 */
const meta = {
  title: "Pages/PortfolioCase",
} satisfies Meta

export default meta

type Story = StoryObj

const a3 = companies[0]
const rtk = companies[1]
const dashboard = a3.cases[0]
const sections = caseSections(dashboard)

/** Голова левой колонки: категория, заголовок, лид, кадр и сетка метрик. */
export const Intro: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getAllByRole("heading", { level: 1 })).toHaveLength(1)
    // Числа обязаны быть ВЫШЕ первого раздела: в данных они лежат в
    // предпоследних разделах, до которых дочитывает не каждый.
    await expect(canvas.getByTestId("pf-metric-strip")).toBeVisible()
    // Сводка наверху не заменяет раздел: значение поднято дословно, метка —
    // имя метрики до двоеточия.
    await expect(canvas.getByText("15–25%")).toBeVisible()
    await expect(canvas.getByText("Activation")).toBeVisible()
    // Кадр шапки показывает НОВЫЙ дашборд — предмет кейса. Кадр со старым
    // промо-экраном, стоявший здесь под подписью «Редизайн главной», снят.
    await expect(
      canvasElement.querySelector('[data-testid="pf-figure-a3-dashboard-redesign-figma-hero-BMeVnBgb"]'),
    ).toBeNull()
    await expect(canvas.getByText("Новый дашборд")).toBeVisible()
  },
  render: () => (
    <PortfolioStoryCanvas width={692}>
      <CaseIntro caseStudy={dashboard} />
    </PortfolioStoryCanvas>
  ),
  tags: ["vr-page"],
}

/**
 * Раздел со списком и парой кадров: маркеры от `prose`, термин в начале пункта
 * полужирным, кадры без вертикальных отступов плагина.
 */
export const ArticleWithList: Story = {
  play: async ({ canvasElement }) => {
    // «Быстрые действия. Если вынести…» — акцент на термине, фраза целая.
    const strong = [...canvasElement.querySelectorAll("li strong")].map((node) => node.textContent)
    await expect(strong).toContain("Быстрые действия.")
    // Маркер списка приходит от плагина типографики: без него пункты
    // рендерятся голым столбцом строк, и сборка при этом молчит.
    const list = canvasElement.querySelector(".pf-article ul")
    await expect(list && getComputedStyle(list).listStyleType).toBe("disc")
    // Плагин навешивает на `img` собственные отступы 2em; внутри рамки кадра
    // они дали бы серую полосу сверху и снизу — снято обёрткой `not-prose`.
    const image = canvasElement.querySelector(".pf-frame img")
    await expect(image && getComputedStyle(image).marginTop).toBe("0px")
  },
  render: () => (
    <PortfolioStoryCanvas width={692}>
      <CaseArticle sections={[sections[3]]} />
    </PortfolioStoryCanvas>
  ),
  tags: ["vr-page"],
}

/** Раздел с прозой: абзацы без акцентов, колонка 640. */
export const ArticleWithProse: Story = {
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelectorAll("strong")).toHaveLength(0)
    // Цвет текста — токен темы, а не серый плагина: `colors.gray` Tailwind
    // задан в oklch с тоном, то есть хроматичен, а страница монохромна.
    const paragraph = canvasElement.querySelector(".pf-article p")
    await expect(paragraph && getComputedStyle(paragraph).color).toBe("rgb(115, 115, 115)")
  },
  render: () => (
    <PortfolioStoryCanvas width={692}>
      <CaseArticle sections={[sections[7]]} />
    </PortfolioStoryCanvas>
  ),
  tags: ["vr-page"],
}

/**
 * Раздел «Метрики успеха»: пункты вида «Activation: рост доли…» — те самые, из
 * которых собрана сетка чисел наверху. Полное предложение остаётся здесь:
 * наверху сводка, в разделе — описание действия.
 */
export const ArticleWithMetrics: Story = {
  play: async ({ canvasElement }) => {
    // Проверяется именно ЦЕЛОСТНОСТЬ предложения: наверху страницы из него
    // подняты «15–25%» и «Activation», но здесь оно обязано стоять полностью.
    // `getByText` тут не годится — пункт разбит тегом `strong` на два узла.
    const items = [...canvasElement.querySelectorAll(".pf-article li")].map(
      (node) => node.textContent,
    )
    await expect(items[0]).toBe(
      "Activation: рост доли пользователей, которые выполнили целевое действие после входа в кабинет, на 15–25%.",
    )
  },
  render: () => (
    <PortfolioStoryCanvas width={692}>
      <CaseArticle sections={[sections[5]]} />
    </PortfolioStoryCanvas>
  ),
  tags: ["vr-page"],
}

/**
 * Раздел с видео. Файлы живут на внешнем домене портфолио и в репозитории
 * отсутствуют — в витрине это пустые плееры с подписями. Состояние снято
 * историей намеренно: «пустой плеер» должен быть видимым решением, а не
 * сюрпризом на живой странице.
 */
export const ArticleWithVideos: Story = {
  render: () => (
    <PortfolioStoryCanvas width={692}>
      <CaseArticle sections={[caseSections(rtk.cases[2])[5]]} />
    </PortfolioStoryCanvas>
  ),
  tags: ["vr-page"],
}

/** Правая колонка: знак компании, справка о ней, переход и контакты. */
export const Aside: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByTestId("pf-logo-a3")).toBeVisible()
    await expect(canvas.getByText("B2B-платежи")).toBeVisible()
    await expect(canvas.getByTestId("pf-aside-company")).toBeVisible()
    await expect(canvas.getByTestId("pf-aside-tg")).toBeVisible()
  },
  render: () => (
    <PortfolioStoryCanvas width={320}>
      <CaseAside company={a3} onContact={fn()} onOpenCompany={fn()} />
    </PortfolioStoryCanvas>
  ),
  tags: ["vr-page"],
}
