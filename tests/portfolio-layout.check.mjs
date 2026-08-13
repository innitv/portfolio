/**
 * Межстраничная приёмка каркаса портфолио.
 *
 * ─── ЗАЧЕМ ОН ЕСТЬ ──────────────────────────────────────────────────────────
 * Этот файл закрывает класс дефектов, который не видит НИ ОДНА из остальных
 * проверок, и видел только человек, переключаясь между страницами:
 *
 *   • имя в шапке прыгало вниз при переходе с главной — на главной оно было
 *     `<span>` без метрик цели нажатия (20 px), на внутренних `<button>`
 *     (36 px от `sm:min-h-9`);
 *   • первый заголовок стартовал с разной высоты — 132 / 124 / 100 px на 1440;
 *   • подвал висел, не доходя до низа окна: на 1440×1200 страница компании не
 *     скроллилась, а под подвалом оставалось 23 px пустого хвоста, и между
 *     компаниями с разным числом кейсов подвал прыгал.
 *
 * Общая причина, по которой они прошли приёмку: КАЖДАЯ СТРАНИЦА ПО ОТДЕЛЬНОСТИ
 * КОРРЕКТНА. Витрина проверяет компонент в изоляции, скриншот-регрессия
 * сверяет страницу с её собственным эталоном, мобильная приёмка берёт один
 * маршрут. Расхождение между страницами не принадлежит ни одной из них —
 * поэтому его и не ловил никто.
 *
 * Отсюда правило: сюда добавляется проверка, чей предмет — РАЗНИЦА между
 * страницами, а не свойство одной. Свойства одной страницы остаются в витрине
 * и в скриншот-регрессии, дублировать их здесь не нужно.
 *
 * ─── ЗАПУСК ─────────────────────────────────────────────────────────────────
 *   yarn qa:layout                       # ждёт dev-сервер на 5173
 *   node tests/portfolio-layout.check.mjs --base=http://127.0.0.1:4173
 *
 *   Коды выхода: 0 — пройдено; 1 — есть расхождение; 2 — страница не открылась.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

const args = new Map(
  process.argv.slice(2).map((a) => {
    const [k, v = 'true'] = a.replace(/^--/, '').split('=');
    return [k, v];
  })
);

const BASE = args.get('base') ?? 'http://127.0.0.1:4173';
const OUT = args.get('out') ?? 'test-results/portfolio-layout/portfolio-layout.json';

/**
 * Страницы каркаса. Первая — эталон: от главной отсчитывается всё остальное.
 *
 * Адреса настоящие, а не хеши: в верстаке студии эта же проверка ходила по
 * `#portfolio-company/a3`, здесь у сайта свой домен и своя схема путей.
 */
const PAGES = [
  { id: 'home', path: '' },
  { id: 'company-a3', path: 'a3' },
  // вторая компания с другим числом кейсов: именно разная длина страницы
  // вскрывала прыжок подвала
  { id: 'company-samolet', path: 'smlt' },
  /*
   * Страницы кейса здесь БОЛЬШЕ НЕТ, и это решение, а не пропуск.
   *
   * Проверка сверяет общий каркас сайта — шапку `pf-header`, подвал `pf-footer`
   * и положение первого заголовка, — то есть части темы `portfolio`. С
   * 2026-08-13 кейс пересобран в чернильной манере `/archive` (решение
   * владельца: заменить страницу, адреса сохранив) и этого каркаса не имеет
   * вовсе — ровно как `/archive`, которого в списке тоже никогда не было.
   *
   * Взамен кейс закрыт своими проверками: истории `Pages/PortfolioCaseFull`
   * в витрине и четыре сквозных теста в `portfolio.spec.ts` — заголовок,
   * подпись под каждым показом, кобальтовый итог, переход на соседний кейс.
   */
];

/** Ширины и высоты. Высокое окно обязательно: на нём видно неприжатый подвал. */
const VIEWPORTS = [
  { id: 'w1440', width: 1440, height: 900 },
  { id: 'w1440-tall', width: 1440, height: 1200 },
  { id: 'w390', width: 390, height: 844 },
];

/** Допуск в пикселях: субпиксельные различия шрифтового рендера — не дефект. */
const TOLERANCE = 1;

async function measure(page) {
  return page.evaluate(() => {
    const header = document.querySelector('[data-testid="pf-header"]');
    const footer = document.querySelector('[data-testid="pf-footer"]');
    const h1 = document.querySelector('h1');
    if (!header || !footer || !h1) return null;

    const hr = header.getBoundingClientRect();
    const fr = footer.getBoundingClientRect();
    return {
      headerHeight: Math.round(hr.height),
      // первое звено цепочки — имя автора; его положение и прыгало
      trailTop: Math.round(header.querySelector('button, span').getBoundingClientRect().top),
      trailLeft: Math.round(header.querySelector('button, span').getBoundingClientRect().left),
      h1Top: Math.round(h1.getBoundingClientRect().top),
      // сколько окна остаётся ПОД подвалом: > 0 значит подвал не прижат
      gapBelowFooter: Math.round(window.innerHeight - fr.bottom),
      scrolls: document.documentElement.scrollHeight > window.innerHeight,
      // контакт обязан быть ровно в одном месте страницы
      headerContacts: header.querySelectorAll('a').length,
    };
  });
}

const { chromium } = await import('playwright');
const browser = await chromium.launch();
const findings = [];
const measurements = {};

for (const vp of VIEWPORTS) {
  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    isMobile: vp.width < 700,
    hasTouch: vp.width < 700,
  });
  const page = await ctx.newPage();
  measurements[vp.id] = {};

  for (const p of PAGES) {
    await page.goto(`${BASE}/${p.path}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(300);
    const m = await measure(page);
    if (!m) {
      console.error(`Не найден каркас на /${p.path} (${vp.id})`);
      await browser.close();
      process.exit(2);
    }
    measurements[vp.id][p.id] = m;
  }

  const ref = measurements[vp.id].home;

  for (const p of PAGES) {
    const m = measurements[vp.id][p.id];

    // 1. Шапка одинаковой высоты, имя на одном месте
    for (const key of ['headerHeight', 'trailTop', 'trailLeft']) {
      if (Math.abs(m[key] - ref[key]) > TOLERANCE) {
        findings.push({
          id: 'header-jump',
          viewport: vp.id,
          page: p.id,
          field: key,
          expected: ref[key],
          actual: m[key],
          message: `Шапка расходится с главной по ${key}: ${m[key]} против ${ref[key]}`,
        });
      }
    }

    // 2. Первый заголовок стартует с той же высоты, что на главной
    if (Math.abs(m.h1Top - ref.h1Top) > TOLERANCE) {
      findings.push({
        id: 'heading-jump',
        viewport: vp.id,
        page: p.id,
        field: 'h1Top',
        expected: ref.h1Top,
        actual: m.h1Top,
        message: `Заголовок стартует с ${m.h1Top} против ${ref.h1Top} на главной`,
      });
    }

    // 3. Подвал прижат: под ним не остаётся пустоты, если страница не скроллится
    if (!m.scrolls && m.gapBelowFooter > TOLERANCE) {
      findings.push({
        id: 'footer-not-pinned',
        viewport: vp.id,
        page: p.id,
        field: 'gapBelowFooter',
        expected: 0,
        actual: m.gapBelowFooter,
        message: `Под подвалом ${m.gapBelowFooter} px пустоты на нескроллящейся странице`,
      });
    }

    // 4. Контакт не дублируется в шапке
    if (m.headerContacts > 0) {
      findings.push({
        id: 'contact-duplicated',
        viewport: vp.id,
        page: p.id,
        field: 'headerContacts',
        expected: 0,
        actual: m.headerContacts,
        message: `В шапке ${m.headerContacts} внешних ссылок: контакт живёт только в подвале`,
      });
    }
  }

  await ctx.close();
}

await browser.close();

const result = {
  schema: 'portfolio-layout/v1',
  generated_at: new Date().toISOString(),
  base_url: BASE,
  tolerance_px: TOLERANCE,
  reference_page: 'home',
  status: findings.length === 0 ? 'pass' : 'fail',
  findings,
  measurements,
};

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(result, null, 2));

if (findings.length === 0) {
  console.log(`pass · ${PAGES.length} страниц × ${VIEWPORTS.length} вьюпортов · отчёт: ${OUT}`);
  process.exit(0);
}

console.error(`fail · расхождений: ${findings.length}`);
for (const f of findings) console.error(`  [${f.viewport}] ${f.page}: ${f.message}`);
console.error(`отчёт: ${OUT}`);
process.exit(1);
