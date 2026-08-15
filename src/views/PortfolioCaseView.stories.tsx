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

    // Первый блок макета — «О проекте» — на месте.
    await expect(canvas.getByTestId("pc-problem")).toBeVisible()

    /*
      Таблицы, плоскости «Итог», перехода на соседний кейс и блока фактов на
      странице БОЛЬШЕ НЕТ: в макете 95:1004 их нет, и владелец 2026-08-14
      попросил не держать на странице ничего сверх макета, пока не дорисует.
      Сторожится отсутствие — вернуть блок легко, заметить трудно.
    */
    for (const id of ["pc-facts", "pc-rows", "pc-impact", "pc-next"]) {
      await expect(canvasElement.querySelector(`[data-testid="${id}"]`)).toBeNull()
    }

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
    // Разделов ровно три — столько их в макете 95:1004.
    await expect(kickers.length, "Разделов не три").toBe(3)

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
      ─── НУМЕРАЦИЯ СЧИТАЕТСЯ, А НЕ ХРАНИТСЯ ────────────────────────────────
      Кобальтовые маркеры прожили час и были сняты владельцем; вечером того же
      дня по второй редакции макета 88:248 пункты стали нумерованным списком.
      Проверяется, что номер приходит счётчиком: в макете у «Проблем» пятый
      пункт подписан «4», и ручная нумерация законсервировала бы эту опечатку.
    */
    const lists = [...canvasElement.querySelectorAll("ol.pc-items")]
    // Нумерованный список сейчас один — у «Проблем»; «Контекст» идёт абзацами.
    await expect(lists.length, "Нумерованных списков на странице нет").toBeGreaterThan(0)

    for (const list of lists) {
      const numbers = [...list.querySelectorAll(".pc-item-num")].map(
        (node) => node.textContent?.trim() ?? "",
      )
      const expected = numbers.map((_, order) => String(order + 1))
      await expect(
        numbers,
        `Нумерация раздела сбилась: ${numbers.join(", ")}`,
      ).toEqual(expected)
    }

    // Номер скрыт от диктора: сам `ol` объявляется нумерованным списком, и
    // видимая цифра прочиталась бы второй раз.
    for (const number of canvasElement.querySelectorAll(".pc-item-num")) {
      await expect(number.getAttribute("aria-hidden")).toBe("true")
    }
  },
}

/**
 * Вводный блок стоит на трети ширины, разделы идут от левого поля.
 *
 * Правило снято координатами макета 95:1004: все величины владельца ложатся
 * на 12 колонок при поле 60 — сдвиг 611 ≈ 4 колонки, «Контекст» 1191 ≈ 8,
 * тезис «Проблем» 1036 ≈ 7, описание и пункт 731 ≈ 5, строка пункта 1342 ≈ 9.
 *
 * До сетки каждая ширина задавалась своим процентом, и блоки не сходились между
 * собой ни на одной ширине окна — владелец назвал это «текст раскидан ужасно».
 *
 * Сторожатся три вещи, потому что сломать сетку можно тремя способами:
 *
 * 1. Блоки стоят на ГРАНИЦАХ колонок, а не где придётся.
 * 2. Чередование: смещённые блоки начинаются с 4-й колонки, остальные с нулевой.
 * 3. Кадры и линии списка идут во все 12 колонок — иначе теряется край страницы.
 */
export const IntroShift: Story = {
  args: {
    caseStudy: study,
    company: a3,
    onHome: fn(),
    onOpenCase: fn(),
    onOpenCompany: fn(),
  },
  name: "Блоки стоят на колонках сетки",
  play: async ({ canvasElement }) => {
    const screen = canvasElement.querySelector<HTMLElement>(".pc-screen")
    if (!screen) throw new Error("Страница кейса не собралась")

    const box = screen.getBoundingClientRect()
    const field = Number.parseFloat(getComputedStyle(screen).paddingLeft)
    const column = (box.width - field * 2) / 12

    /** Положение края в колонках сетки, с точностью до десятой. */
    const col = (value: number) =>
      Math.round(((value - box.left - field) / column) * 10) / 10

    const blocks = [...canvasElement.querySelectorAll(".pc-flow > .pc-section")]
    // Три текстовых блока: «О проекте», «Контекст», «Проблемы до редизайна».
    await expect(blocks.length, "Текстовых блоков не три").toBe(3)

    const starts = blocks.map((block) => {
      const lead = block.querySelector(".pc-part, .pc-lead, .pc-label")
      return col((lead ?? block).getBoundingClientRect().left)
    })

    // Каждый блок начинается на границе колонки: у поля или на четвёртой.
    for (const [index, start] of starts.entries()) {
      await expect(
        [0, 4],
        `Блок ${index + 1} начинается на ${start} колонке`,
      ).toContain(start)
    }

    /*
      Чередование строгое, с единственным исключением в начале: вводный блок и
      «Задача» образуют вводную группу и стоят на одной трети. В макете раздела
      «Задача» нет, и если считать её отдельным шагом, фаза сдвигается — тогда
      «Контекст» уезжает на треть, хотя в макете он от поля.

      Проверяется поэтому не «соседи разные», а длина серии: подряд на одной
      вертикали допустимы максимум два блока, и только в самом начале.
    */
    let run = 1
    for (let index = 1; index < starts.length; index += 1) {
      run = starts[index] === starts[index - 1] ? run + 1 : 1
      const allowed = index === 1 ? 2 : 1
      await expect(
        run,
        `Блоки со ${index} по ${index + 1} стоят подряд на ${starts[index]} колонке`,
      ).toBeLessThanOrEqual(allowed)
    }

    /*
      Два якоря макета: «О проекте» на трети, «Контекст» от поля. Ищутся по
      метке, а не по индексу — порядок разделов задаётся данными и меняется.
    */
    const columnOf = (label: string) => {
      const index = blocks.findIndex(
        (block) => block.querySelector(".pc-kicker")?.textContent?.trim() === label,
      )
      if (index < 0) throw new Error(`Раздела «${label}» на странице нет`)
      return starts[index]
    }

    await expect(columnOf("О проекте"), "«О проекте» не на трети").toBe(4)
    await expect(columnOf("Контекст"), "«Контекст» не от поля").toBe(0)

    // Кадры идут во все двенадцать колонок, от поля до поля.
    const shots = canvasElement.querySelector(".pc-flow .pc-shots")
    if (!shots) throw new Error("Кадров в потоке нет")
    const shotBox = shots.getBoundingClientRect()
    await expect(col(shotBox.left), "Кадр начинается не от поля").toBe(0)
    await expect(col(shotBox.right), "Кадр не доходит до правого поля").toBe(12)

    // Сетки-подложки на светлой странице нет: она спорит со строками текста.
    await expect(canvasElement.querySelector(".pc-grid")).toBeNull()
  },
}

/**
 * Нумерованный пункт: линия во всю ширину блока, номер у поля, текст на сдвиге.
 *
 * Устройство из второй редакции макета 88:248 (владелец, 2026-08-14, вечер).
 * Проверяется геометрия, а не наличие классов: пункт легко собрать «похоже» —
 * с линией по ширине текста вместо блока или с номером, приклеенным к тексту, —
 * и на восьми тысячах пикселей разница глазами не ловится.
 *
 * Зазоры сверяются по ДОЛЯМ, а не по пикселям макета: в макете 20 и 32 при
 * ширине 1920, страница же тянется от 320 до 1440+, и обе величины на ней
 * плавающие. Инвариант — их отношение 20 к 32 и порядок «линия ближе к своей
 * строке, чем к предыдущей».
 */
export const NumberedItem: Story = {
  args: {
    caseStudy: study,
    company: a3,
    onHome: fn(),
    onOpenCase: fn(),
    onOpenCompany: fn(),
  },
  name: "Пункт: линия, номер, текст",
  play: async ({ canvasElement }) => {
    const list = canvasElement.querySelector<HTMLElement>("ol.pc-items")
    if (!list) throw new Error("Нумерованных пунктов на странице нет")

    const items = [...list.querySelectorAll<HTMLElement>(".pc-item")]
    await expect(items.length, "В разделе меньше двух пунктов").toBeGreaterThan(1)

    const [first, second] = items
    const number = first.querySelector<HTMLElement>(".pc-item-num")
    const text = first.querySelector<HTMLElement>(".pc-item-text")
    if (!number || !text) throw new Error("У пункта нет номера или текста")

    // Линия — верхняя граница пункта, и она во всю ширину блока, а не текста.
    const style = getComputedStyle(first)
    await expect(style.borderTopStyle, "Над пунктом нет линии").toBe("solid")
    await expect(style.borderTopWidth, `Линия толщиной ${style.borderTopWidth}`).toBe("1px")

    /*
      Всё меряется КОЛОНКАМИ страницы: линия занимает все двенадцать, номер —
      первые четыре, текст — с пятой по девятую. Ровно эти доли стоят в макете
      95:1004 (1800, 611 и 731 при ширине 1920).
    */
    const screen = canvasElement.querySelector<HTMLElement>(".pc-screen")
    if (!screen) throw new Error("Страница кейса не собралась")
    const screenBox = screen.getBoundingClientRect()
    const field = Number.parseFloat(getComputedStyle(screen).paddingLeft)
    const column = (screenBox.width - field * 2) / 12
    const col = (value: number) =>
      Math.round(((value - screenBox.left - field) / column) * 10) / 10

    const itemBox = first.getBoundingClientRect()
    await expect(col(itemBox.left), "Линия начинается не от поля").toBe(0)
    await expect(col(itemBox.right), "Линия не доходит до правого поля").toBe(12)

    const numberBox = number.getBoundingClientRect()
    const textBox = text.getBoundingClientRect()
    await expect(col(numberBox.left), "Номер стоит не у поля").toBe(0)
    await expect(
      col(textBox.left),
      `Текст пункта начинается на ${col(textBox.left)} колонке вместо четвёртой`,
    ).toBe(4)
    await expect(
      col(textBox.right),
      `Текст пункта кончается на ${col(textBox.right)} колонке вместо девятой`,
    ).toBe(9)

    // Зазоры: линия → строка меньше, чем строка → следующая линия (20 к 32).
    const lead = Number.parseFloat(style.paddingTop)
    const gap = Number.parseFloat(getComputedStyle(second).marginTop)
    await expect(lead, "Между линией и строкой нет зазора").toBeGreaterThan(0)
    /*
      Допуск во втором знаке, а не в третьем: обе величины считаются из `clamp`
      по ширине окна и округляются браузером до сотых пикселя, поэтому точного
      0.625 не бывает — при 12.48 и 20.04 выходит 0.6228.
    */
    await expect(
      lead / gap,
      `Зазоры ${lead} и ${gap} — не в отношении 20 к 32`,
    ).toBeCloseTo(0.625, 2)
  },
}
