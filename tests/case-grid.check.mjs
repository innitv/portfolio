/**
 * Сторож сетки страницы кейса против макета владельца `95:1004`.
 *
 * ─── ЗАЧЕМ ОН ЕСТЬ ──────────────────────────────────────────────────────────
 * Класс дефектов «страница разошлась с макетом» три раза подряд ловил человек
 * глазами, и ни одна из четырёх осей приёмки его не видела: сборка проверяет
 * типы, сквозные тесты — маршруты и наличие подписей, витрина — компоненты в
 * изоляции, межстраничная проверка — каркас сайта. Ширина блока в долях сетки
 * не принадлежит ни одной из них.
 *
 * Здесь эталон — числа макета, снятые `get_metadata` (опись:
 * `outputs/portfolio-swiss-shot/2026-08-11/reference/case-structure-88-248/macet-inventory.md`).
 * Позиции сверяются В КОЛОНКАХ 12-колоночной сетки при поле `--pa-field`, потому
 * что страница тянется за окном: пиксели на 1440 и на 2000 разные, доли — одни.
 *
 * ─── ЗАПУСК ─────────────────────────────────────────────────────────────────
 *   node tests/case-grid.check.mjs                      # ждёт сервер на 5173
 *   node tests/case-grid.check.mjs --base=http://127.0.0.1:4173
 *   node tests/case-grid.check.mjs --negative           # НЕГАТИВНЫЙ КОНТРОЛЬ
 *
 * `--negative` ломает сетку прямо в браузере (равные колонки в паре, тезис на
 * всю ширину) и обязан завершиться падением: проверка, которая зелёная всегда,
 * не проверка. Код выхода 1 при негативном прогоне означает, что сторож живой.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

const args = new Map(
  process.argv.slice(2).map((a) => {
    const [k, v = 'true'] = a.replace(/^--/, '').split('=');
    return [k, v];
  })
);

const BASE = args.get('base') ?? 'http://localhost:5173';
const OUT = args.get('out') ?? 'test-results/case-grid/case-grid.json';
const PATH = args.get('path') ?? 'a3/case/dashboard-redesign';
const NEGATIVE = args.has('negative');
const WIDTHS = [1440, 2000];

/** Допуски: макет нарисован от руки, до направляющих доведён не везде. */
const COL_TOLERANCE = 0.25;
const RATIO_TOLERANCE = 0.04;

/**
 * Эталон из макета. `cols` — [начало, конец] в колонках, `ratio` — ширина/высота
 * подложки кадра. Пиксели макета оставлены в комментариях как источник числа.
 */
const EXPECTED = [
  // имя кейса 1295 из 1800
  { id: 'title', selector: '.pc-title', nth: 0, cols: [1, 9.63] },
  // лид 571
  { id: 'lede', selector: '.pc-lede', nth: 0, cols: [1, 4.81] },
  // кадр героя 1800 × 664
  {
    id: 'hero',
    selector: '[data-testid="pc-hero"] .pc-shot-frame',
    nth: 0,
    cols: [1, 13],
    ratio: 1800 / 664,
  },
  // вводный блок: тезис и описание на 904 от вертикали 671
  /*
   * Тезис вводного блока — тот же класс, что у разделов: с правки 2026-08-14
   * «О проекте» устроен как раздел (метка → тезис → описание), а роли
   *  на странице больше нет.
   */
  { id: 'intro-lead', selector: '.pc-section[data-shift="true"] > .pc-part', nth: 0, cols: [5.07, 11.1], capped: true },
  { id: 'intro-text', selector: '.pc-section[data-shift="true"] > p.pc-section-text', nth: 0, cols: [5.07, 11.1], capped: true },
  // раздел от поля: метка и тезис 1191, описание 731
  { id: 'section-kicker', selector: '.pc-section:not([data-shift="true"]) > .pc-kicker', nth: 0, cols: [1, 8.94] },
  /*
   * Описания раздела ОТ ПОЛЯ на странице сейчас нет: `body` есть только у
   * вводного блока и у «Контекста», а оба стоят на трети. Правило 1/6 в CSS
   * живёт, но проверять здесь нечего — селектор дал бы «блок не найден», а не
   * расхождение. Появится раздел с `body` от поля — строку вернуть.
   */
  // смещённый раздел: метка и тезис 1036 от 671
  /*
   * nth 1, а не 0: первый смещённый блок — вводный «О проекте», он у́же (904,
   * шесть колонок). Здесь сверяется смещённый РАЗДЕЛ «Проблемы» — 1036, семь
   * колонок.
   */
  { id: 'shifted-kicker', selector: '.pc-section[data-shift="true"]:not([data-intro="true"]) > .pc-kicker', nth: 0, cols: [5.07, 11.98], capped: true },
  // нумерованный пункт: текст 731 от 671
  { id: 'item-text', selector: '.pc-item-text', nth: 0, cols: [5.07, 9.94] },
  // пара кадров: 579 и 1189 с зазором 32
  { id: 'pair-left', selector: '.pc-shots:not([data-wide="true"]) .pc-shot:first-child .pc-shot-frame', nth: 0, cols: [1, 4.86], ratio: 579 / 471 },
  { id: 'pair-right', selector: '.pc-shots:not([data-wide="true"]) .pc-shot:last-child .pc-shot-frame', nth: 0, cols: [5.07, 13], ratio: 1189 / 664 },
];

/**
 * Кегли: доля внутренней ширины из макета. Проверяются только там, где `clamp`
 * ещё не упёрся в потолок, — на 1440 доля живая, на 2000 у части ролей потолок.
 */
const EXPECTED_TYPE = [
  { id: 'title-size', selector: '.pc-title', ratio: 130 / 1800 },
  { id: 'lead-size', selector: '.pc-lead', ratio: 44 / 1800 },
  { id: 'body-size', selector: '.pc-item-text', ratio: 22 / 1800 },
  { id: 'meta-size', selector: '.pc-kicker', ratio: 16 / 1800 },
];

const { chromium } = await import('playwright');
const browser = await chromium.launch();
const findings = [];
const measurements = {};

for (const width of WIDTHS) {
  const ctx = await browser.newContext({ viewport: { width, height: 1000 } });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/${PATH}`, { waitUntil: 'networkidle' });

  if (NEGATIVE) {
    // Ровно те два дефекта, ради которых сторож и заведён.
    await page.addStyleTag({
      content: `
        .pc-shots:not([data-wide="true"]) { grid-template-columns: repeat(2, 1fr) !important; }
        .pc-section[data-shift="true"] > .pc-lead { grid-column: 1 / 13 !important; }
      `,
    });
  }

  await page.waitForTimeout(500);

  const data = await page.evaluate(
    ({ expected, expectedType }) => {
      const field = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--pa-field')) || 0;
      const pageWidth = document.querySelector('.pc-screen').getBoundingClientRect().width;
      const inner = pageWidth - field * 2;
      const col = inner / 12;
      const round = (v) => Math.round(v * 100) / 100;
      const toCol = (x) => round((x - field) / col + 1);

      const geometry = expected.map((e) => {
        const node = document.querySelectorAll(e.selector)[e.nth];
        if (!node) return { id: e.id, missing: true };
        const r = node.getBoundingClientRect();
        return {
          id: e.id,
          colStart: toCol(r.left),
          colEnd: toCol(r.right),
          ratio: r.height ? round(r.width / r.height) : null,
          width: Math.round(r.width),
          height: Math.round(r.height),
        };
      });

      const typography = expectedType.map((e) => {
        const node = document.querySelector(e.selector);
        if (!node) return { id: e.id, missing: true };
        const size = parseFloat(getComputedStyle(node).fontSize);
        // Доля округляется до пяти знаков: на двух знаках 32.27/1320 схлопывалось
        // в 0.02 и сравнение с макетной долей теряло смысл.
        return { id: e.id, size: round(size), share: Math.round((size / inner) * 1e5) / 1e5 };
      });

      return { field, inner: Math.round(inner), col: round(col), geometry, typography };
    },
    { expected: EXPECTED, expectedType: EXPECTED_TYPE }
  );

  measurements[`w${width}`] = data;

  for (const e of EXPECTED) {
    const m = data.geometry.find((g) => g.id === e.id);
    if (!m || m.missing) {
      findings.push({ width, id: e.id, message: `Блок не найден: ${e.selector}` });
      continue;
    }
    const [start, end] = e.cols;
    if (Math.abs(m.colStart - start) > COL_TOLERANCE) {
      findings.push({
        width,
        id: e.id,
        field: 'colStart',
        expected: start,
        actual: m.colStart,
        message: `${e.id}: левый край на колонке ${m.colStart}, в макете ${start}`,
      });
    }
    /*
     * 🔴 Правый край сверяется только там, где ширина растёт вместе с сеткой.
     *
     * У блоков с пометкой `capped` в CSS стоит потолок ширины из макета (тезис
     * 1191 и 1036, тело 731) — правка владельца 2026-08-14: «заголовки текстовых
     * блоков ты снова растянул, у них фиксированная ширина на больших экранах».
     * Выше опорных 1920 такой блок перестаёт догонять свою колонку, и это НЕ
     * дефект, а требование: сверять правый край там значило бы сторожить ровно
     * то, что владелец отменил. Левый край и позиция на сетке проверяются всегда.
     */
    const capWorks = e.capped && width > 1920;
    if (!capWorks && Math.abs(m.colEnd - end) > COL_TOLERANCE) {
      findings.push({
        width,
        id: e.id,
        field: 'colEnd',
        expected: end,
        actual: m.colEnd,
        message: `${e.id}: правый край на колонке ${m.colEnd}, в макете ${end}`,
      });
    }
    if (e.ratio && Math.abs(m.ratio - e.ratio) > RATIO_TOLERANCE) {
      findings.push({
        width,
        id: e.id,
        field: 'ratio',
        expected: Math.round(e.ratio * 100) / 100,
        actual: m.ratio,
        message: `${e.id}: пропорция подложки ${m.ratio}, в макете ${Math.round(e.ratio * 100) / 100}`,
      });
    }
  }

  // Кегли сверяются только на 1440: на 2000 доля упирается в потолок макета.
  if (width === 1440) {
    for (const e of EXPECTED_TYPE) {
      const m = data.typography.find((t) => t.id === e.id);
      if (!m || m.missing) continue;
      const deviation = Math.abs(m.share - e.ratio) / e.ratio;
      if (deviation > 0.06) {
        findings.push({
          width,
          id: e.id,
          field: 'font-size',
          expected: Math.round(e.ratio * data.inner * 10) / 10,
          actual: m.size,
          message: `${e.id}: кегль ${m.size} при макетной доле ${Math.round(e.ratio * data.inner * 10) / 10}`,
        });
      }
    }
  }

  await ctx.close();
}

await browser.close();

const result = {
  schema: 'case-grid/v1',
  generated_at: new Date().toISOString(),
  base_url: BASE,
  reference: 'figma Hqqav4V81gZIxxH6AwSUWj node 95:1004',
  negative_control: NEGATIVE,
  col_tolerance: COL_TOLERANCE,
  status: findings.length === 0 ? 'pass' : 'fail',
  findings,
  measurements,
};

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(result, null, 2));

if (findings.length === 0) {
  console.log(`pass · ${EXPECTED.length} блоков × ${WIDTHS.length} ширин · отчёт: ${OUT}`);
  process.exit(NEGATIVE ? 1 : 0);
}

console.error(`fail · расхождений: ${findings.length}`);
for (const f of findings) console.error(`  [${f.width}] ${f.message}`);
console.error(`отчёт: ${OUT}`);
process.exit(1);
