/**
 * ─── ПРЕРЕНДЕР: КАЖДЫЙ АДРЕС ОТДАЁТ СВОЙ HTML ──────────────────────────────
 *
 * Сайт — SPA: до 15.09.2026 все четырнадцать адресов отдавали один и тот же
 * `index.html` с пустым `<div id="root">` и одним заголовком на всех. Google
 * такое рендерит, Яндекс — хуже и с задержкой, а мессенджеры не исполняют JS
 * вовсе: ссылка на кейс разворачивалась пустой карточкой.
 *
 * Здесь не SSR. Собранный сайт открывается в настоящем браузере (Playwright уже
 * стоит для приёмки), и со страницы снимается готовый HTML — вместе с мета,
 * которые проставил `portfolio-meta.ts`. Поэтому второго словаря текстов не
 * возникает: и экран, и его заголовок приходят из `portfolio.data.ts`.
 *
 * 🔴 Разметка снимается ПОСЛЕ движения. Экраны приезжают анимацией, и снимок
 * раньше времени записал бы `opacity: 0` и `clip-path: inset(100%)` прямо в
 * файл — страница для краулера осталась бы пустой, а глазами всё выглядело бы
 * правильно. Отсюда ожидание и проверка ниже: ни один узел в снимке не должен
 * быть прозрачным.
 *
 * 🔴 React монтируется обычным `createRoot` и просто перерисовывает `#root`.
 * Гидратации нет намеренно: она требует совпадения разметки до узла, а на
 * странице живут WebGL-полоса, Lenis и framer-motion, и первое же расхождение
 * дало бы предупреждение в консоли у посетителя.
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { chromium } from "playwright";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(rootDir, "dist");
const origin = "https://ivan-ignatov.online";
const port = Number(process.env.PORTFOLIO_PRERENDER_PORT ?? 4180);
const base = `http://127.0.0.1:${port}`;

/**
 * Скрытые адреса: HTML снимается, в карту сайта адрес НЕ попадает.
 *
 * 🔴 Пререндер нужен им не ради поиска, а ради первого кадра. Пока `/brief` не
 * снимался, сервер отдавал на него `index.html` — то есть готовую разметку
 * ГЛАВНОЙ, — и человек, пришедший по присланной ссылке, успевал увидеть чужой
 * экран до того, как JS подменит его брифом. Владелец поймал это глазами
 * 02.11.2026: «сначала видно прогрузку главной страницы».
 *
 * 🔴 Из `sitemap.xml` и `robots.txt` адрес при этом исключён, и это не
 * противоречие: карта сайта — приглашение, а статический HTML — только ответ
 * на уже известный адрес. Запрет индексации приходит с сервера
 * (`X-Robots-Tag` в `public/.htaccess`), а снятый HTML несёт ещё и
 * `<meta name="robots" content="noindex">` — его ставит `portfolio-meta.ts`,
 * и теперь он доезжает до краулера без JS.
 */
const HIDDEN_ROUTES = ["/brief"];

/** Адреса берутся из собранного бандла — тот же источник, что у экранов. */
async function routesFromBundle(page) {
  return page.evaluate(() => {
    const links = [{ path: "/", changefreq: "monthly", priority: "1.0" }];
    /*
      Список компаний и кейсов лежит в приложении. Достаём его через тот же
      ряд имён, что рисует главная: переписывать перечень руками здесь —
      значит завести второй источник правды и забыть его обновить.
    */
    const cells = Array.from(document.querySelectorAll("[data-testid^='pa-company-']"));
    return { cells: cells.map((node) => node.dataset.testid.replace("pa-company-", "")), links };
  });
}

function waitForServer(url, attempts = 40) {
  return new Promise((resolve, reject) => {
    const tick = async () => {
      try {
        const response = await fetch(url, { method: "HEAD" });
        if (response.ok) return resolve();
      } catch {
        /* сервер ещё не поднялся */
      }
      if (--attempts <= 0) return reject(new Error(`Превью не поднялось: ${url}`));
      setTimeout(tick, 250);
    };
    tick();
  });
}

async function main() {
  if (!fs.existsSync(path.join(outDir, "index.html"))) {
    throw new Error("dist/index.html не найден — сначала `yarn build`");
  }

  /*
    Превью поднимается бинарником vite через node, а не через `npx`: на Windows
    `spawn` для `.cmd` падает с EINVAL, а `shell: true` тащит за собой разбор
    командной строки оболочкой.
  */
  const viteBin = path.join(rootDir, "node_modules", "vite", "bin", "vite.js");
  const preview = spawn(
    process.execPath,
    [viteBin, "preview", "--host", "127.0.0.1", "--port", String(port)],
    { cwd: rootDir, stdio: "ignore" },
  );

  try {
    await waitForServer(base);

    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { height: 1200, width: 1440 } });

    await page.goto(`${base}/`, { waitUntil: "networkidle" });
    const { cells } = await routesFromBundle(page);

    /* Компании и их кейсы: у каждой открываем экран и читаем список работ. */
    const routes = ["/"];
    for (const companyId of cells) {
      routes.push(`/${companyId}`);
      await page.goto(`${base}/${companyId}`, { waitUntil: "networkidle" });
      await page.waitForTimeout(900);
      const caseIds = await page.evaluate(() =>
        Array.from(document.querySelectorAll("[data-testid^='pa-case-']")).map((node) =>
          node.dataset.testid.replace("pa-case-", ""),
        ),
      );
      for (const caseId of caseIds) routes.push(`/${companyId}/case/${caseId}`);
    }

    const written = [];

    /* Скрытые идут последними: так их видно в выводе отдельным хвостом. */
    for (const route of [...routes, ...HIDDEN_ROUTES]) {
      await page.goto(`${base}${route}`, { waitUntil: "networkidle" });
      /* Движение экрана: лесенка блоков и спуск плоскости идут до 1.2 с. */
      await page.waitForTimeout(1600);

      /*
        🔴 Узлы под `aria-hidden="true"` из проверки исключены, и это не дыра в
        стороже. Он ловит снимок, сделанный до конца движения: тогда прозрачным
        оказывается содержимое, которое человек ДОЛЖЕН видеть. А `aria-hidden`
        — явное объявление обратного, и единственный такой узел на сайте —
        приманка для ботов в форме брифа: она обязана быть невидимой, и на ней
        проверка падала бы всегда (поймано 02.11.2026 при заведении /brief).
      */
      const invisible = await page.evaluate(
        () =>
          Array.from(document.querySelectorAll("#root *")).filter((node) => {
            if (node.closest('[aria-hidden="true"]')) return false;
            const style = window.getComputedStyle(node);
            return style.opacity === "0" && node.getBoundingClientRect().width > 0;
          }).length,
      );
      if (invisible > 0) {
        throw new Error(`${route}: снимок сделан до конца движения (${invisible} прозрачных узлов)`);
      }

      const html = await page.evaluate(() => `<!doctype html>\n${document.documentElement.outerHTML}`);
      const target =
        route === "/"
          ? path.join(outDir, "index.html")
          : path.join(outDir, route.slice(1), "index.html");

      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, html, "utf8");

      const title = await page.title();
      written.push({ bytes: Buffer.byteLength(html), hidden: HIDDEN_ROUTES.includes(route), route, title });
    }

    await browser.close();

    /* ── robots.txt и sitemap.xml ───────────────────────────────────────── */
    fs.writeFileSync(
      path.join(outDir, "robots.txt"),
      [
        "User-agent: *",
        "Allow: /",
        "",
        `Sitemap: ${origin}/sitemap.xml`,
        "",
      ].join("\n"),
      "utf8",
    );

    const today = new Date().toISOString().slice(0, 10);
    const urls = routes
      .map((route) =>
        [
          "  <url>",
          `    <loc>${origin}${route === "/" ? "/" : route}</loc>`,
          `    <lastmod>${today}</lastmod>`,
          `    <priority>${route === "/" ? "1.0" : route.includes("/case/") ? "0.8" : "0.9"}</priority>`,
          "  </url>",
        ].join("\n"),
      )
      .join("\n");

    fs.writeFileSync(
      path.join(outDir, "sitemap.xml"),
      `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
      "utf8",
    );

    console.log(`Пререндер: ${written.length} адресов, из них скрытых ${HIDDEN_ROUTES.length}`);
    for (const page of written) {
      console.log(
        `  ${page.route.padEnd(34)} ${String(Math.round(page.bytes / 1024)).padStart(4)} КБ  ${page.title}${page.hidden ? "   · скрытый, вне карты сайта" : ""}`,
      );
    }
    console.log("robots.txt и sitemap.xml записаны");
  } finally {
    preview.kill();
  }
}

await main();
