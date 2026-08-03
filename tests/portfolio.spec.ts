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
  await expect(page.getByTestId("pf-case-title")).toHaveText("Редизайн главной");
  await expect(page.getByRole("img", { name: "Новый дашборд А3" })).toBeVisible();
  await expect(page.getByTestId("pf-metric-strip")).toBeVisible();
});

test("прямой заход на маршрут кейса открывает кейс", async ({ page }) => {
  await page.goto(portfolioUrl("/a3/case/dashboard-redesign"));

  await expect(page.getByTestId("pf-case-title")).toHaveText("Редизайн главной");
  // Цепочка в шапке: имя автора → компания → текущая страница.
  await expect(page.getByTestId("pf-header-home")).toBeVisible();
  await expect(page.getByTestId("pf-crumb-А3")).toBeVisible();
  await expect(page.getByTestId("pf-header-current")).toHaveText("Редизайн главной");
});

test("неизвестный маршрут возвращает на главную", async ({ page }) => {
  await page.goto(portfolioUrl("/no-such-company"));

  await expect(page.getByRole("heading", { name: "Дизайнер сложных продуктов" })).toBeVisible();
});

test("пара кадров переключается стрелками", async ({ page }) => {
  await page.goto(portfolioUrl("/a3/case/dashboard-redesign"));

  const group = page.getByTestId("pf-figure-group").first();
  await group.scrollIntoViewIfNeeded();

  const next = page.getByTestId("pf-figure-next").first();
  const prev = page.getByTestId("pf-figure-prev").first();

  // На первом кадре назад недоступно, вперёд доступно.
  await expect(prev).toBeDisabled();
  await expect(next).toBeEnabled();

  const before = await group.boundingBox();
  await next.click();

  await expect(next).toBeDisabled();
  await expect(prev).toBeEnabled();

  // Высота группы не меняется при переключении: кадры лежат в одной ячейке.
  const after = await group.boundingBox();
  expect(Math.round(after!.height)).toBe(Math.round(before!.height));
});
