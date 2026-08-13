import { expect, test } from "@playwright/test";

/**
 * Сквозной проход по трём маршрутам сайта.
 *
 * Переписан 2026-08-03 под вёрстку на shadcn/ui: прежняя версия проверяла
 * элементы, которых больше нет («Открыть компанию А3», ссылка «Контекст» в
 * оглавлении, кнопка «Следующий кейс»). Оглавление и переход к следующему
 * кейсу сняты ещё в верстаке 2026-08-02, знаки компаний в заголовке — 08-03.
 *
 * Предмет этого файла — МАРШРУТЫ и наличие каркаса. Раскладку и разницу между
 * страницами проверяет `tests/portfolio-layout.check.mjs` (`yarn qa:layout`),
 * поведение компонентов — истории Storybook (`yarn test-storybook`).
 */

const basePath = process.env.PORTFOLIO_BASE_PATH ?? "/";
const portfolioUrl = (path = "") => `${basePath.replace(/\/$/, "")}${path}` || "/";

test("главная показывает заголовок и три компании", async ({ page }) => {
  await page.goto(portfolioUrl());

  await expect(page.getByRole("heading", { name: "Дизайнер сложных продуктов" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Компании" })).toBeVisible();

  for (const id of ["a3", "rtk", "smlt"]) {
    await expect(page.getByTestId(`pf-company-${id}`)).toBeVisible();
  }

  // Контакт живёт только в подвале: в шапке его быть не должно (правка 08-03).
  await expect(page.getByTestId("pf-footer-tg")).toBeVisible();
  await expect(page.getByTestId("pf-contact-tg")).toHaveCount(0);
});

test("карточка компании ведёт на её маршрут", async ({ page }) => {
  await page.goto(portfolioUrl());
  await page.getByTestId("pf-company-a3").click();

  await expect(page).toHaveURL(/\/a3$/);
  await expect(page.getByRole("heading", { name: "А3" })).toBeVisible();
  await expect(page.getByTestId("pf-case-dashboard-redesign")).toBeVisible();
});

test("карточка кейса ведёт на маршрут кейса", async ({ page }) => {
  await page.goto(portfolioUrl("/a3"));
  await page.getByTestId("pf-case-dashboard-redesign").click();

  await expect(page).toHaveURL(/\/a3\/case\/dashboard-redesign$/);
  await expect(page.getByTestId("pc-title")).toHaveText("Редизайн главной");
  await expect(page.getByTestId("pc-impact")).toBeVisible();
});

test("прямой заход на маршрут кейса открывает кейс", async ({ page }) => {
  await page.goto(portfolioUrl("/a3/case/dashboard-redesign"));

  await expect(page.getByTestId("pc-title")).toHaveText("Редизайн главной");
  // Шапка уводит в две стороны: к работам компании и на главную.
  await expect(page.getByTestId("pc-back")).toContainText("А3");
  await expect(page.getByTestId("pc-home")).toBeVisible();
});

test("неизвестный маршрут возвращает на главную", async ({ page }) => {
  await page.goto(portfolioUrl("/no-such-company"));

  await expect(page.getByRole("heading", { name: "Дизайнер сложных продуктов" })).toBeVisible();
});

/*
 * Прежде здесь проверялась карусель кадров со стрелками. На странице кейса,
 * пересобранной 2026-08-13 по кадру владельца 82:206, переключателя нет:
 * показы стоят сеткой и видны все сразу. Вместо стрелок проверяется то, что в
 * этой структуре несёт смысл, — подпись под каждым показом.
 */
test("каждый показ на странице кейса подписан", async ({ page }) => {
  await page.goto(portfolioUrl("/a3/case/dashboard-redesign"));

  const shots = page.locator(".pc-shot");
  const captions = page.locator(".pc-shot figcaption");

  const total = await shots.count();
  expect(total).toBeGreaterThan(0);
  await expect(captions).toHaveCount(total);

  for (let i = 0; i < total; i += 1) {
    await expect(captions.nth(i)).not.toBeEmpty();
  }
});

test("страница кейса уводит на соседний кейс", async ({ page }) => {
  await page.goto(portfolioUrl("/a3/case/dashboard-redesign"));

  const next = page.getByTestId("pc-next").getByRole("button");
  await next.scrollIntoViewIfNeeded();
  await next.click();

  await expect(page).toHaveURL(/\/a3\/case\/[a-z-]+$/);
  await expect(page).not.toHaveURL(/dashboard-redesign$/);
});

/*
 * Переход с синего экрана компании на кейс — закрытием, а не подменой.
 *
 * Плоскость компании уезжает вверх, и под ней УЖЕ отрисован кейс. Проверяются
 * оба условия разом: занавес существует и страница под ним готова. Раньше
 * `/archive` размонтировался целиком и кейс появлялся вспышкой.
 */
test("с синего экрана кейс открывается закрытием плоскости", async ({ page }) => {
  await page.goto(portfolioUrl("/archive"));

  await page.getByTestId("pa-company-a3").click();
  const sheet = page.getByTestId("pa-sheet");
  await expect(sheet).toBeVisible();

  await page.getByTestId("pa-case-dashboard-redesign").click();

  // Занавес виден, и под ним уже страница кейса — не заглушка и не пустота.
  const curtain = page.getByTestId("pa-curtain");
  await expect(curtain).toBeVisible();
  await expect(page.getByTestId("pc-title")).toHaveText("Редизайн главной");

  /*
   * Имя компании на занавесе стоит там же, где стояло на синем экране. Иначе
   * подмена читается рывком: сначала занавес центрировал имя по вертикали, и
   * оно съезжало с верха к середине (поймано владельцем).
   */
  const wordTop = await page
    .locator(".pa-curtain-word")
    .evaluate((node) => Math.round(node.getBoundingClientRect().top));
  expect(wordTop).toBeLessThan(200);

  /*
   * И написание то же самое. Занавес однажды брал `company.name` из общих
   * данных сайта — латинское «A3» подменялось русским «А3» прямо в момент
   * закрытия. Латиница здесь единственное место на сайте и решение владельца
   * по макету, поэтому проверяется буквой.
   */
  await expect(page.locator(".pa-curtain-word")).toHaveText("A3");

  // И уходит сам, не оставляя плоскость поверх страницы.
  await expect(curtain).toHaveCount(0, { timeout: 4000 });
});

/*
 * Уход синего экрана идёт в том же темпе, что приход.
 *
 * Сначала занавес закрывался за 0.52 с против 0.72 у открытия, и владелец
 * поймал это сразу: «слишком быстро закрывается». Проверка ловит и обратное —
 * если кто-то растянет уход настолько, что переход начнёт мешать.
 */
test("синий экран уходит в том же темпе, что приходит", async ({ page }) => {
  await page.goto(portfolioUrl("/archive"));
  await page.getByTestId("pa-company-a3").click();
  await expect(page.getByTestId("pa-sheet")).toBeVisible();

  const started = Date.now();
  await page.getByTestId("pa-case-dashboard-redesign").click();
  await expect(page.getByTestId("pa-curtain")).toHaveCount(0, { timeout: 4000 });
  const elapsed = Date.now() - started;

  // 0.72 с плюс кадр на снятие; нижняя граница отсекает мгновенное исчезновение.
  expect(elapsed, `Занавес ушёл за ${elapsed} мс`).toBeGreaterThan(600);
  expect(elapsed, `Занавес ушёл за ${elapsed} мс`).toBeLessThan(1400);
});

test("прямой заход на кейс идёт без занавеса", async ({ page }) => {
  await page.goto(portfolioUrl("/a3/case/flow"));

  await expect(page.getByTestId("pc-title")).toHaveText("Оптимизация флоу");
  await expect(page.getByTestId("pa-curtain")).toHaveCount(0);
});

/*
 * Прокрутка страницы кейса — мягкая (Lenis, приём образца `wemakefab.ru`).
 *
 * Проверка живёт здесь, а не в витрине, по двум причинам: колесо нужно
 * настоящее — синтетическое событие `wheel` браузер не прокручивает вовсе, — и
 * нужен работающий `requestAnimationFrame`, без которого догон не начнётся.
 *
 * Ловит две поломки разом: если Lenis перестанет подключаться, прокрутка станет
 * мгновенной и промежуточных положений не будет; если он молча отключит себя по
 * системной настройке «уменьшить движение» (его значение по умолчанию —
 * `respectReducedMotion: true`), результат будет тот же.
 */
test("прокрутка страницы кейса догоняет колесо, а не прыгает", async ({ page, isMobile }) => {
  /*
   * Только для точного указателя. На тач-экранах Lenis намеренно не перехватывает
   * жест (`syncTouch: false`): там инерция уже системная, и вторая поверх неё
   * ощущается как залипание. В мобильном профиле колесо отрабатывает нативно и
   * прыгает сразу — это не поломка, а условленное поведение.
   */
  test.skip(Boolean(isMobile), "мягкая прокрутка включена только для колеса мыши");

  await page.goto(portfolioUrl("/a3/case/dashboard-redesign"));
  await page.waitForTimeout(600);

  await page.mouse.move(700, 500);
  await page.mouse.wheel(0, 1200);

  /** Кадры сразу после колеса: при мягкой прокрутке положение растёт постепенно. */
  const frames: number[] = [];
  for (let i = 0; i < 8; i += 1) {
    frames.push(await page.evaluate(() => Math.round(window.scrollY)));
    await page.waitForTimeout(50);
  }

  await page.waitForTimeout(1200);
  const settled = await page.evaluate(() => Math.round(window.scrollY));

  expect(settled).toBeGreaterThan(200);
  const intermediate = frames.filter((y) => y > 10 && y < settled - 10);
  expect(
    intermediate.length,
    `Прокрутка прыгнула сразу: кадры ${frames.join(", ")} при итоге ${settled}`,
  ).toBeGreaterThanOrEqual(3);
});
