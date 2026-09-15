/**
 * Сторож единого слоя значений.
 *
 * ─── ЗАЧЕМ ОН ЕСТЬ ──────────────────────────────────────────────────────────
 * 🔴 Заведён 2026-08-15 по разбору разнобоя. К тому дню белый стоял значением
 * `#fff` семнадцать раз, чернила в трёх местах были записаны числами
 * `rgba(11,11,11,…)` мимо собственного токена, `#1e1e1e` и `#1E1E1E` жили в
 * одном файле, кривая `[0.16, 1, 0.3, 1]` — в трёх местах, длительность 0.72 —
 * тремя отдельными константами, а `--pa-ink-invert` использовался, ни разу не
 * будучи объявленным: работал фолбэк. Владелец: «почему так много расхождений».
 *
 * Этот класс не видит ни глаз, ни остальная приёмка: каждое место по отдельности
 * выглядит верно. Расходятся они позже — когда правят одно из трёх.
 *
 * Проверяется три вещи:
 *   1. цвет и время не пишутся значением мимо слоя токенов;
 *   2. каждая переменная, на которую ссылаются, объявлена;
 *   3. две записи значений движения — CSS и TS — совпадают между собой.
 *
 * ─── ЗАПУСК ─────────────────────────────────────────────────────────────────
 *   yarn tokens:check
 *
 *   Коды выхода: 0 — пройдено; 1 — есть расхождение.
 */

import { readFileSync } from "node:fs"

/*
 * Слой значений — два файла: тиеры примитивов и семантики и общий слой
 * портфолио поверх них. Оба объявляют значения, поэтому запрет на литералы
 * сюда не распространяется, а объявления отсюда читаются при сверке ссылок.
 */
const TOKEN_FILES = ["src/styles/portfolio-tokens.css", "src/styles/portfolio-ink.css"]
const TOKENS_CSS = TOKEN_FILES[1]
const MOTION_TS = "src/components/portfolio/motion.ts"

/**
 * Файлы, где значения писать НЕЛЬЗЯ: они обязаны ссылаться на токены.
 *
 * Слой токенов и рисованные компоненты сюда не входят: первый эти значения и
 * объявляет, второй (`pixel-car`) — растровая картинка болида, где каждый цвет
 * принадлежит одному пикселю и в палитру интерфейса не входит.
 */
const GUARDED = [
  "src/styles/portfolio-archive.css",
  "src/styles/portfolio-case.css",
  "src/views/PortfolioArchiveView.tsx",
  "src/views/PortfolioCaseView.tsx",
  "src/views/PortfolioRoute.tsx",
  "src/components/portfolio/archive/archive-sheet.tsx",
  "src/components/portfolio/archive/sheet-curtain.tsx",
]

/*
 * Файлы, где проверяется шкала кеглей: к охраняемым добавлен сам слой значений —
 * шкала обязана быть кратной прежде всего в нём.
 */
const TYPE_GUARDED = [...TOKEN_FILES, ...GUARDED.filter((file) => file.endsWith(".css"))]

const problems = []
let checkedPrimitives = 0

/** Строки комментариев: там значения — часть объяснения, а не стиль. */
function stripComments(text) {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, (block) => block.replace(/[^\n]/g, " "))
    .replace(/^\s*\/\/.*$/gm, "")
}

// ─── 1. Значения мимо токенов ────────────────────────────────────────────────
for (const file of GUARDED) {
  /*
   * 🔴 Объявление роли сворачивается в ОДНУ строку перед разбором. Значение
   * может занимать несколько строк — так записан многострочный
   * `linear-gradient`, — и построчная проверка видела его стопы как «цвет по
   * месту», хотя они стоят внутри законного объявления (2026-08-16).
   */
  const source = stripComments(readFileSync(file, "utf8")).replace(
    /^[ \t]*--[\w-]+[ \t]*:[^;]*;/gm,
    (declaration) => declaration.replace(/\s*\n\s*/g, " "),
  )
  const lines = source.split("\n")

  lines.forEach((line, index) => {
    const at = `${file}:${index + 1}`

    /*
     * Объявление роли — единственное место, где значение писать и положено:
     * `--pc-muted: rgba(...)`. Проверка ловит значения в СВОЙСТВАХ.
     */
    if (/^\s*--[\w-]+\s*:/.test(line)) return

    /*
     * Цвет значением. В компонентах ищем только там, где это и есть стиль:
     * рядом стоят строки подписей, где «#044AB3» — ТЕКСТ на экране (служебная
     * строка внизу главной документирует кобальт), а не оформление.
     */
    const colors = file.endsWith(".css")
      ? (line.match(/#[0-9a-fA-F]{3,8}\b|rgba?\([\d\s.,%]+\)/g) ?? [])
      : // В компоненте цвет должен быть ЗНАЧЕНИЕМ свойства: иначе под проверку
        // попадают подписи вроде `COLOR_SPEC = "#044AB3 · контраст…"`, где это
        // текст на экране, а не оформление.
        (line.match(
          /(?:background|backgroundColor|color|fill|stroke)\s*[:=]\s*["'`]?(#[0-9a-fA-F]{3,8}|rgba?\([^)]*\))/g,
        ) ?? [])
    for (const color of colors) {
      problems.push(`${at}  цвет значением: ${color.trim()} — заведите роль в ${TOKENS_CSS}`)
    }

    // Время значением в CSS-переходах и анимациях.
    if (file.endsWith(".css") && /(transition|animation)[^;]*\b\d*\.?\d+m?s\b/.test(line)) {
      problems.push(`${at}  время значением: ${line.trim()} — заведите роль в ${TOKENS_CSS}`)
    }

    // Кривая значением: и в CSS, и массивом в компоненте.
    if (/cubic-bezier\(/.test(line) || /\[\s*0?\.\d+\s*,[\d\s.,]+\]\s*as const/.test(line)) {
      problems.push(`${at}  кривая значением: ${line.trim()} — заведите роль в ${TOKENS_CSS}`)
    }
  })
}

// ─── 1.1 Отступы кратны четырём ─────────────────────────────────────────────
/*
 * 🔴 Шкала пространства — кратная четырём, и это проверяется, а не подразумевается.
 *
 * Инвентаризация 2026-09-13 нашла шестнадцать уникальных значений отступов, шесть
 * из них вне четвёрки: 6, 9, 10, 13, 14, 18. Каждое по отдельности выглядело
 * осмысленным — подбиралось под конкретное место, — и вместе они складывались в
 * шкалу, которой не существует.
 *
 * Правило округления при переводе: ближайшая ступень, при равном расстоянии
 * вверх (6→8, 9→8, 10→12, 13→12, 14→16, 18→20).
 *
 * Под проверку попадают только отступы: `margin`, `padding`, `gap`, `inset`.
 * Кегли, толщина линий, меры строк и радиусы живут по своим шкалам — 13 px
 * метаданных и 1191 px меры не обязаны делиться на четыре.
 */
for (const file of GUARDED.filter((name) => name.endsWith(".css"))) {
  const source = stripComments(readFileSync(file, "utf8"))
  source.split(/\r?\n/).forEach((line, index) => {
    const rule = line.match(/^\s*([a-z-]*(?:margin|padding|gap|inset)[a-z-]*)\s*:\s*([^;]+);/i)
    if (!rule) return

    for (const piece of rule[2].split(/\s+/)) {
      const px = piece.match(/^(-?\d+(?:\.\d+)?)px$/)
      if (!px) continue
      const size = Math.abs(Number(px[1]))
      if (size === 0 || size % 4 === 0) continue
      problems.push(
        `${file}:${index + 1}  отступ ${piece} не кратен четырём — возьмите ступень шкалы (--p-space-*)`,
      )
    }
  })
}

// ─── 1.2 Кегли кратны четырём ───────────────────────────────────────────────
/*
 * 🔴 Та же шкала, что у отступов, действует и на размер шрифта.
 *
 * До 13 сентября 2026 кеглей было 33 штуки, и восемнадцать из них не делились
 * на четыре: 10, 11, 13, 14, 15, 15.5, 18, 19, 22, 26, 34, 82, 130, 215. Рядом
 * стояли 13 и 14, 15 и 16, 18 и 19 — различия, которых никто не закладывал.
 *
 * 🔴 У ФОРМУЛЫ ПРОВЕРЯЮТСЯ ТОЛЬКО КРАЯ. В `clamp(A, B, C)` кеглем становятся A
 * и C — нижняя и верхняя границы; B это правило роста, и внутри него живут
 * числа другой природы: делитель, вычитаемая ширина. Скажем, у имени компании
 * стоит `(var(--pa-inner) - 398px) / 6.8`, где 398 — место под соседей в ряду,
 * а не размер шрифта.
 */
for (const file of TYPE_GUARDED) {
  const source = stripComments(readFileSync(file, "utf8"))
  source.split(/\r?\n/).forEach((line, index) => {
    const rule = line.match(/^\s*(--[\w-]*size[\w-]*|font-size)\s*:\s*([^;]+);/i)
    if (!rule) return

    const value = rule[2].trim()
    const clamp = value.match(/^clamp\(([^,]+),([\s\S]+),([^,]+)\)$/)
    const parts = clamp ? [clamp[1], clamp[3]] : [value]

    for (const part of parts) {
      const px = part.trim().match(/^(-?\d+(?:\.\d+)?)px$/)
      if (!px) continue
      const size = Math.abs(Number(px[1]))
      if (size === 0 || size % 4 === 0) continue
      problems.push(
        `${file}:${index + 1}  кегль ${px[0]} не кратен четырём — возьмите ступень шкалы`,
      )
    }
  })
}

// ─── 1.3 Точки перелома из шкалы ───
/*
 * ТОЧКА ПЕРЕЛОМА — ТОКЕН, ХОТЬ И НАПИСАННЫЙ ЧИСЛОМ.
 *
 * `@media (max-width: var(--p-bp-mobile))` в CSS не работает: переменная
 * внутри условия медиазапроса не читается. Поэтому число пишется руками, а
 * совпадение со шкалой держит эта проверка — иначе шкала существует только
 * на бумаге.
 *
 * Инвентаризация 14.09.2026 нашла пять несогласованных границ: 599 и 639 (две
 * разные мобильные — главная переключалась на одной, страница кейса на
 * другой), 899/900, 1024 и 1199. Владелец выбрал три: 640 / 900 / 1200.
 *
 * Границу можно писать двумя способами, и оба верны: `min-width: 900px` —
 * «от точки и шире», `max-width: 899px` — «до точки». Отсюда допустимы и
 * само значение, и значение минус единица.
 *
 * Проверяется только ширина. Высота — другая ось: `min-height: 1000px` у
 * полноэкранной главной снят замером содержимого, шкалы высот в системе нет.
 */
const BREAKPOINTS = [640, 900, 1200]
const ALLOWED_WIDTHS = new Set(BREAKPOINTS.flatMap((value) => [value, value - 1]))
const MEDIA_WIDTH = new RegExp("[(](?:min|max)-width:[ ]*([0-9]+(?:[.][0-9]+)?)px[)]", "g")

for (const file of TYPE_GUARDED) {
  const source = stripComments(readFileSync(file, "utf8"))
  source.split(String.fromCharCode(10)).forEach((line, index) => {
    if (!line.includes("@media")) return
    for (const hit of line.matchAll(MEDIA_WIDTH)) {
      const width = Number(hit[1])
      if (ALLOWED_WIDTHS.has(width)) continue
      problems.push(
        `${file}:${index + 1}  точка перелома ${width}px вне шкалы — возьмите ${BREAKPOINTS.join(" / ")} (--p-bp-*)`,
      )
    }
  })
}

// ─── 2. Ссылки на несуществующие переменные ─────────────────────────────────
const cssFiles = [...TOKEN_FILES, ...GUARDED.filter((file) => file.endsWith(".css"))]
const declared = new Set()
const used = new Map()

for (const file of cssFiles) {
  const source = readFileSync(file, "utf8")
  for (const match of source.matchAll(/^\s*(--[\w-]+)\s*:/gm)) declared.add(match[1])
  // Комментарии выброшены: там переменные УПОМИНАЮТСЯ — в том числе снятые.
  for (const match of stripComments(source).matchAll(/var\(\s*(--[\w-]+)\s*(?:,|\))/g)) {
    if (!used.has(match[1])) used.set(match[1], file)
  }
}

for (const [name, file] of used) {
  if (!declared.has(name)) {
    problems.push(`${file}  ссылка на необъявленную переменную ${name}`)
  }
}

// ─── 3. CSS и TS не разошлись ────────────────────────────────────────────────
/*
 * Источник значений при сверке — ОБА файла слоя: роль может быть объявлена
 * ссылкой на примитив, и развернуть её до числа можно, только видя тиеры
 * целиком. Пока читался один файл, ссылка --pa-ease-item → --p-ease-item
 * выглядела как отсутствующая переменная.
 */
const tokensSource = TOKEN_FILES.map((file) => readFileSync(file, "utf8")).join(String.fromCharCode(10))
const motionSource = readFileSync(MOTION_TS, "utf8")

const cssValue = (name) => {
  const match = tokensSource.match(new RegExp(`--${name}:\\s*([^;]+);`))
  if (!match) return null
  const value = match[1].trim()
  // Роль может быть объявлена ссылкой на другую роль — разворачиваем до числа.
  const alias = value.match(/^var\(\s*--([\w-]+)\s*\)$/)
  return alias ? cssValue(alias[1]) : value
}

/**
 * Значение поля внутри нужного объекта модуля.
 *
 * 🔴 Объект указывается обязательно: поле `item` есть и у `DURATION`, и у
 * `EASE`, и поиск по одному имени приносил длительность вместо кривой —
 * проверка сравнивала 0.52 с четырьмя контрольными точками и «находила»
 * расхождение там, где его не было.
 */
const tsValue = (group, name) => {
  const block = motionSource.match(new RegExp(`export const ${group} = \\{([\\s\\S]*?)\\n\\} as const`))
  if (!block) return null
  // Кривая записана массивом и сама содержит запятые — берём массив целиком.
  const match = block[1].match(new RegExp(`\\b${name}:\\s*(\\[[^\\]]*\\]|[^,\\n]+)`))
  return match ? match[1].trim().replace(/,$/, "") : null
}

/** Пары «переменная CSS ↔ поле модуля»: одно значение в двух записях. */
const PAIRS = [
  ["pa-dur-sheet-in", "DURATION", "sheetIn", "s"],
  ["pa-dur-sheet-out", "DURATION", "sheetOut", "s"],
  ["pa-dur-curtain", "DURATION", "curtain", "s"],
  ["pa-dur-item", "DURATION", "item", "s"],
  ["pa-dur-reveal", "DURATION", "reveal", "s"],
  ["pa-delay-items", "TIMING", "itemsDelay", "s"],
  ["pa-stagger-items", "TIMING", "itemsStagger", "s"],
  ["pa-stagger-reveal", "TIMING", "revealStagger", "s"],
  ["pa-ease-in-sheet", "EASE", "inSheet", "ease"],
  ["pa-ease-out-sheet", "EASE", "outSheet", "ease"],
  ["pa-ease-curtain-out", "EASE", "curtainOut", "ease"],
  ["pa-ease-item", "EASE", "item", "ease"],
]

for (const [cssName, group, tsName, kind] of PAIRS) {
  const css = cssValue(cssName)
  const ts = tsValue(group, tsName)

  if (css === null) {
    problems.push(`${TOKENS_CSS}  нет переменной --${cssName}`)
    continue
  }
  if (ts === null) {
    problems.push(`${MOTION_TS}  нет поля ${group}.${tsName}`)
    continue
  }

  if (kind === "s") {
    const cssNumber = Number(css.replace("s", ""))
    if (cssNumber !== Number(ts)) {
      problems.push(`--${cssName} = ${css}, а ${tsName} = ${ts} — записи разошлись`)
    }
  } else {
    const cssPoints = css.replace(/cubic-bezier\(|\)/g, "").split(",").map((n) => Number(n.trim()))
    const tsPoints = ts.replace(/[[\]]/g, "").split(",").map((n) => Number(n.trim()))
    const same =
      cssPoints.length === tsPoints.length && cssPoints.every((n, i) => n === tsPoints[i])
    if (!same) {
      problems.push(`--${cssName} = ${css}, а ${tsName} = ${ts} — кривые разошлись`)
    }
  }
}

/* ─── 5. Источник значений: JSON против CSS ─────────────────────────────────
 *
 * `design/tokens/portfolio/primitives.json` — источник правды, `portfolio-tokens.css`
 * — ручной перенос. Правило проекта требует править оба; до 15.09.2026 его
 * никто не проверял, и два примитива, заведённых ради контраста, в источник не
 * попали.
 *
 * 🔴 Сверяются ЗНАЧЕНИЯ, а не имена: имя не выводится из пути механически
 * (`color/alpha-paper/850` → `--p-paper-a850`, `color/signal/red-500` →
 * `--p-red-500`). Сверка по именам потребовала бы словаря соответствий — ещё
 * одного места, которое разойдётся.
 *
 * Запись нормализуется с обеих сторон: `#ffffff` и `#fff` — одно значение,
 * `[0.4, 0, 0.15, 1]` и `cubic-bezier(0.4, 0, 0.15, 1)` — одно, список
 * гарнитур в массиве и в строке — одно.
 */
const PRIMITIVES_JSON = "design/tokens/portfolio/primitives.json"
const PRIMITIVES_CSS = TOKEN_FILES[0]

function normalizeValue(value) {
  if (Array.isArray(value)) {
    /* Кривая — четыре числа; гарнитура — список имён. */
    return value.every((item) => typeof item === "number")
      ? `cubic-bezier(${value.join(",")})`
      : value
          .map((item) => String(item).replace(/["']/g, "").trim().toLowerCase().replace(/\s+/g, " "))
          .join(",")
  }

  /*
   * Пробелы схлопываются, но НЕ вырезаются: внутри имени гарнитуры пробел
   * значим («Manrope Variable»), а вокруг запятых и скобок — нет.
   */
  let text = String(value).trim().toLowerCase().replace(/\s+/g, " ")
  text = text.replace(/["']/g, "").replace(/\s*([,()])\s*/g, "$1")
  /* #ffffff и #fff — одно и то же. */
  const short = text.match(/^#([0-9a-f])\1([0-9a-f])\2([0-9a-f])\3$/)
  if (short) text = `#${short[1]}${short[2]}${short[3]}`
  return text
}

function jsonLeaves(node, path = []) {
  const rows = []
  for (const [key, value] of Object.entries(node)) {
    if (key.startsWith("$")) continue
    if (value && typeof value === "object" && !Array.isArray(value)) {
      if ("$value" in value) rows.push([path.concat(key).join("/"), value.$value])
      else rows.push(...jsonLeaves(value, path.concat(key)))
    }
  }
  return rows
}

try {
  const source = jsonLeaves(JSON.parse(readFileSync(PRIMITIVES_JSON, "utf8")))
    .filter(([, value]) => !(typeof value === "string" && value.startsWith("{")))

  /* Значения --p-* из переноса: только сырые, алиасы сверять не с чем. */
  const cssPrimitives = new Map()
  for (const line of readFileSync(PRIMITIVES_CSS, "utf8").split("\n")) {
    const match = line.match(/^\s*(--p-[\w-]+)\s*:\s*([^;]+);/)
    if (match && !match[2].includes("var(")) cssPrimitives.set(match[1], normalizeValue(match[2]))
  }

  const cssValues = new Set(cssPrimitives.values())
  const jsonValues = new Set(source.map(([, value]) => normalizeValue(value)))

  for (const [name, value] of source) {
    if (!cssValues.has(normalizeValue(value))) {
      problems.push(
        `${PRIMITIVES_JSON} → ${name} = ${JSON.stringify(value)}: такого значения нет ни у одной ` +
          `--p-* в ${PRIMITIVES_CSS} — источник и перенос разошлись`,
      )
    }
  }

  for (const [name, value] of cssPrimitives) {
    if (!jsonValues.has(value)) {
      problems.push(
        `${PRIMITIVES_CSS} → ${name} = ${value}: значения нет в ${PRIMITIVES_JSON} — примитив завели ` +
          `в переносе, а в источник не внесли`,
      )
    }
  }

  checkedPrimitives = source.length
} catch (error) {
  problems.push(`${PRIMITIVES_JSON} не прочитался: ${error.message}`)
}

// ─── Итог ────────────────────────────────────────────────────────────────────
if (problems.length) {
  console.error(`fail · расхождений: ${problems.length}\n`)
  for (const problem of problems) console.error(`  ${problem}`)
  console.error(
    `\nЗначения цвета и времени живут в ${TOKENS_CSS} и ${MOTION_TS}. Новый оттенок — это` +
      ` роль в слое токенов, а не число по месту.`,
  )
  process.exit(1)
}

console.log(
  `pass · значения не пишутся по месту · ${declared.size} переменных объявлено ·` +
    ` ${PAIRS.length} пар CSS↔TS совпадают · ${checkedPrimitives} примитивов сверены с JSON`,
)
