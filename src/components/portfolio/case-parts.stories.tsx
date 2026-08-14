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
/** Кейс со сплошными абзацами — для истории `ArticleWithProse`. */
const flowSections = caseSections(a3.cases[1])
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
    // «Платёжные KPI. Если показатели видны…» — акцент на термине, фраза целая.
    const strong = [...canvasElement.querySelectorAll("li strong")].map((node) => node.textContent)
    await expect(strong).toContain("Платёжные KPI.")
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

/**
 * Раздел с прозой: абзацы без акцентов, колонка 640.
 *
 * Источник — кейс «Оптимизация флоу», а не дашборд: у дашборда прозы больше
 * нет. Единственный его раздел со сплошным текстом («Итоги») снят владельцем
 * 2026-08-14 как пересказ соседних, и роль финала на странице держат
 * кобальтовая плоскость «Итог» и переход на соседний кейс.
 */
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
      <CaseArticle sections={[flowSections[0]]} />
    </PortfolioStoryCanvas>
  ),
  tags: ["vr-page"],
}

/**
 * Раздел «Метрики успеха»: пункты вида «Activation: доля… растёт на 15–25%» —
 * те самые, из которых собрана сетка чисел наверху страницы.
 *
 * 🔴 Проверяется ПОРЯДОК, а не только наличие. `caseMetrics` читает раздел
 * сверху вниз и первое найденное число уносит на синий экран `/archive` первой
 * величиной компании A3 — вместе с подписью «Activation». Уедет Activation
 * ниже или заедет цифра в тезис раздела — на плакате встанет чужая метрика, и
 * ни сборка, ни типы этого не заметят.
 */
export const ArticleWithMetrics: Story = {
  play: async ({ canvasElement }) => {
    /*
      Тезис раздела — без цифр: иначе подписью величины на `/archive` станет
      обрывок фразы вместо имени метрики. Номер раздела («01») в счёт не идёт —
      он живёт в своём `span` и в данные не входит, поэтому берётся последний
      текстовый узел заголовка, а не весь его текст.
    */
    const heading = canvasElement.querySelector(".pf-article h2")
    const thesis = [...(heading?.childNodes ?? [])]
      .filter((node) => node.nodeType === Node.TEXT_NODE)
      .map((node) => node.textContent)
      .join("")
    await expect(thesis).not.toMatch(/\d/)

    // Пункты целиком. `getByText` тут не годится: пункт разбит `strong` на два
    // узла, а проверяется именно целостность предложения.
    const items = [...canvasElement.querySelectorAll(".pf-article li")].map(
      (node) => node.textContent,
    )
    await expect(items[0]).toBe(
      "Activation: доля пользователей, выполнивших целевое действие после входа в кабинет, растёт на 15–25%.",
    )
    await expect(items[1]).toContain("Time to Action")
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
