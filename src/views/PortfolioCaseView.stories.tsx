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

    /*
      ─── РАЗМЕТКА РАЗДЕЛА: МЕТКА → ТЕЗИС → АБЗАЦЫ ───────────────────────────
      Правка владельца 2026-08-14 по макету 88:248: под служебной меткой стоит
      не название раздела, а ПЕРВОЕ ПРЕДЛОЖЕНИЕ его содержания, набранное
      крупно. Проверяются обе половины и их различие — иначе разметка тихо
      выродится обратно в один заголовок, повторяющий метку.

      Сторож на лиды пунктов (`.pc-item-lead`) снят вместе с самими лидами:
      час назад у каждого пункта был мини-заголовок, владелец их отменил.
    */
    const kickers = [...canvasElement.querySelectorAll(".pc-kicker")]
    await expect(kickers.length, "Меток разделов нет").toBeGreaterThan(3)

    for (const kicker of kickers) {
      const part = kicker.nextElementSibling
      await expect(part?.classList.contains("pc-part")).toBe(true)
      const label = kicker.textContent?.trim() ?? ""
      const title = part?.textContent?.trim() ?? ""
      await expect(title.length, `Раздел «${label}» без тезиса`).toBeGreaterThan(0)
      await expect(title, `Тезис раздела «${label}» повторяет метку`).not.toBe(label)
    }

    /*
      ─── ТЕЛО НАБРАНО ОСНОВНОЙ ГАРНИТУРОЙ, А НЕ СЛУЖЕБНОЙ ──────────────────
      Моноширинную здесь пробовали по макету 88:248 и владелец её отменил в тот
      же день: «оставь тогда как было с манропе». Моноширинная остаётся языком
      служебных строк — меток, шапки, подписей, — а тело кейса читают длинно.

      Проверяется РЕЗУЛЬТАТ у абзаца, а не значение переменной: подмена
      `--pc-text-font` и гарнитура по месту одинаково видны здесь.
    */
    const paragraph = canvasElement.querySelector(".pc-section-text")
    const family = paragraph ? getComputedStyle(paragraph).fontFamily : ""
    await expect(family, `Тело набрано не основной гарнитурой: ${family}`).toContain("Manrope")

    /*
      ─── ПУНКТЫ БЕЗ МАРКЕРОВ ───────────────────────────────────────────────
      Кобальтовые квадраты прожили час и сняты владельцем по макету. Маркер
      рисовался псевдоэлементом, поэтому и проверяется он: `list-style` его
      отсутствие не покажет.
    */
    const item = canvasElement.querySelector("ul.pc-section-text li")
    if (item) {
      const marker = getComputedStyle(item, "::before").content
      await expect(marker, `У пункта вернулся маркер: ${marker}`).toBe("none")
    }
  },
}

/**
 * Текстовые блоки чередуются: треть ширины → левое поле → треть.
 *
 * Приём владельца по макету 88:248 (2026-08-14). Он заменил силовую линию, на
 * которой ВЕСЬ текст стоял одной вертикалью 34 % (приём `wemakefab.ru`, принят
 * 13 августа и прожил сутки; путь до него занял день и четыре промаха).
 *
 * Сторожатся три вещи разом, потому что сломать приём можно тремя способами:
 *
 * 1. Вертикалей ровно ДВЕ. Разъедься блоки по трём-четырём — страница
 *    развалится, и на восьми тысячах пикселей это не поймать глазами.
 * 2. Одна из них — левое поле, с которого начинаются кадры. Сдвинь кадр вместе
 *    с текстом, и разницы между блоками не станет, а с ней и приёма.
 * 3. Чередование идёт через один. Пропущенный или лишний блок сдвигает всю
 *    последовательность, и соседние блоки встают на одну вертикаль.
 */
export const Alternation: Story = {
  args: {
    caseStudy: study,
    company: a3,
    onHome: fn(),
    onOpenCase: fn(),
    onOpenCompany: fn(),
  },
  name: "Текстовые блоки чередуются",
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector<HTMLElement>(".pc-root")
    if (!root) throw new Error("Страница кейса не собралась")

    const origin = root.getBoundingClientRect().left
    const width = root.getBoundingClientRect().width
    const at = (node: Element) => Math.round(node.getBoundingClientRect().left - origin)

    const blocks = [...canvasElement.querySelectorAll(".pc-flow > .pc-section")]
    await expect(blocks.length, "Текстовых блоков на странице нет").toBeGreaterThan(4)

    const lines = [...new Set(blocks.map(at))].sort((first, second) => first - second)
    await expect(
      lines,
      `Блоки разъехались по вертикалям: ${lines.join(", ")}`,
    ).toHaveLength(2)

    // Ближняя вертикаль — левое поле: с него же начинаются кадры.
    const shots = canvasElement.querySelector(".pc-flow .pc-shots")
    if (!shots) throw new Error("Кадров в потоке нет — сравнивать поле не с чем")
    await expect(lines[0], `Ближняя вертикаль ${lines[0]} ≠ поле ${at(shots)}`).toBe(at(shots))

    // Дальняя — на трети ширины: в макете 671 из 1920, то есть 35 %.
    const share = lines[1] / width
    await expect(share, `Дальняя вертикаль на ${Math.round(share * 100)} % ширины`).toBeGreaterThan(0.3)
    await expect(share).toBeLessThan(0.42)

    // Чередование не сбилось: нечётные блоки на трети, чётные у поля.
    for (const [index, block] of blocks.entries()) {
      const onThird = at(block) === lines[1]
      await expect(onThird, `Блок ${index + 1} сбил чередование`).toBe(index % 2 === 0)
    }

    // Сетки-подложки на светлой странице нет: она спорит со строками текста.
    await expect(canvasElement.querySelector(".pc-grid")).toBeNull()
  },
}
