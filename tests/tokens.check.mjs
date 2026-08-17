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

const TOKENS_CSS = "src/styles/portfolio-ink.css"
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

const problems = []

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

// ─── 2. Ссылки на несуществующие переменные ─────────────────────────────────
const cssFiles = [TOKENS_CSS, ...GUARDED.filter((file) => file.endsWith(".css"))]
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
const tokensSource = readFileSync(TOKENS_CSS, "utf8")
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
    ` ${PAIRS.length} пар CSS↔TS совпадают`,
)
