import { expect, test } from "@playwright/test";

/**
 * Сквозной проход по трём маршрутам сайта.
 *
 * Переписан 2026-08-03 под вёрстку на shadcn/ui: прежняя версия проверяла
 * элементы, которых больше нет («Открыть компанию А3», ссылка «Контекст» в
 * оглавлении, кнопка «Следующий кейс»). Оглавление и переход к следующему
 * кейсу сняты ещё в верстаке 2026-08-02, знаки компаний в заголовке — 08-03.
 *
 * Предмет этого файла — МАРШРУТЫ, переходы и соответствие адреса экрану.
 * Сетку страницы кейса проверяет `tests/case-grid.check.mjs`
 * (`yarn qa:case-grid`), поведение компонентов — истории Storybook
 * (`yarn test-storybook`).
 */

const basePath = process.env.PORTFOLIO_BASE_PATH ?? "/";
const portfolioUrl = (path = "") => `${basePath.replace(/\/$/, "")}${path}` || "/";

test("главная показывает имя, ряд компаний и каналы связи", async ({ page }) => {
  await page.goto(portfolioUrl());

  await expect(page.getByTestId("pa-word")).toHaveText("Product");
  await expect(page.getByTestId("pa-cursive")).toHaveText("Archive");

  for (const id of ["a3", "rtk", "smlt"]) {
    await expect(page.getByTestId(`pa-company-${id}`)).toBeVisible();
  }

  /*
    Каналы связи стоят на главной ссылками, а не одной почтой текстом.
    Прежний дизайн держал их строкой в подвале; при замене дизайна владелец
    просил оставить именно ссылки (2026-08-15), иначе с сайта пропал бы
    единственный способ написать.
  */
  const contacts = page.getByTestId("pa-contacts").locator("a");
  await expect(contacts).toHaveCount(3);
  await expect(contacts.first()).toHaveAttribute("href", /t\.me/);
});

test("имя компании ведёт на её маршрут", async ({ page }) => {
  await page.goto(portfolioUrl());
  await page.getByTestId("pa-company-a3").click();

  await expect(page).toHaveURL(/\/a3$/);
  await expect(page.getByTestId("pa-sheet")).toBeVisible();
  await expect(page.locator(".pa-huge")).toHaveText("A3");
});

test("строка кейса ведёт на маршрут кейса", async ({ page }) => {
  await page.goto(portfolioUrl("/a3"));
  await page.getByTestId("pa-case-dashboard-redesign").click();

  await expect(page).toHaveURL(/\/a3\/case\/dashboard-redesign$/);
  await expect(page.getByTestId("pc-title")).toHaveText("Редизайн главной");
  /*
    Раньше здесь проверялась кобальтовая плоскость «Итог». Она снята 2026-08-14
    вместе с таблицей, соседним кейсом и блоком фактов: в макете `95:1004` их
    нет, а владелец сказал не вносить на страницу ничего сверх макета, пока он
    его не дорисует. Признаком открывшегося кейса остаётся первый блок макета.
  */
  await expect(page.getByTestId("pc-intro-shots")).toBeVisible();
});

test("прямой заход на маршрут кейса открывает кейс", async ({ page }) => {
  await page.goto(portfolioUrl("/a3/case/dashboard-redesign"));

  await expect(page.getByTestId("pc-title")).toHaveText("Редизайн главной");
  // Шапка уводит в две стороны: к работам компании и на главную.
  await expect(page.getByTestId("pc-back")).toContainText("А3");
  await expect(page.getByTestId("pc-home")).toBeVisible();
});

/*
 * ─── АДРЕС СЛЕДУЕТ ЗА ЭКРАНОМ ───────────────────────────────────────────────
 *
 * 🔴 Класс дефектов, который не видела НИ ОДНА ось приёмки и который дал два
 * дефекта подряд 2026-08-15: экран верный, содержимое верное, врёт только
 * строка адреса.
 *
 *   • закрытие синего экрана на `/archive/a3` показывало ряд имён, а в строке
 *     оставалось `/archive/a3` — обновление возвращало не тот экран;
 *   • открытие компании нажатием не меняло адрес вовсе, поэтому состояние
 *     нельзя было ни скопировать ссылкой, ни отменить кнопкой «назад».
 *
 * Сборка проверяет типы, витрина — компонент в изоляции, `qa:case-grid` — доли
 * сетки. Соответствие адреса экрану не принадлежит ни одной из них, поэтому
 * проверки живут здесь: нужна настоящая история браузера.
 */
test("адрес следует за экраном в обе стороны", async ({ page }) => {
  await page.goto(portfolioUrl());
  await expect(page).toHaveURL(/\/$/);

  await page.getByTestId("pa-company-a3").click();
  await expect(page).toHaveURL(/\/a3$/);

  await page.getByTestId("pa-back").click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByTestId("pa-sheet")).toHaveCount(0);
});

test("кнопки браузера ходят по экранам, а не по одному адресу", async ({ page }) => {
  await page.goto(portfolioUrl());
  await page.getByTestId("pa-company-a3").click();
  await expect(page).toHaveURL(/\/a3$/);

  await page.getByTestId("pa-case-dashboard-redesign").click();
  await expect(page).toHaveURL(/\/a3\/case\/dashboard-redesign$/);

  await page.goBack();
  await expect(page).toHaveURL(/\/a3$/);
  await expect(page.getByTestId("pa-sheet")).toBeVisible();

  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByTestId("pa-sheet")).toHaveCount(0);

  await page.goForward();
  await expect(page).toHaveURL(/\/a3$/);
});

/*
 * 🔴 Кнопки браузера идут теми же дорогами, что и кнопки на экране.
 *
 * Движение — свойство ПЕРЕХОДА, а не нажатия. До 2026-08-15 занавес взводился
 * прямо в обработчиках, поэтому одна и та же дорога выглядела по-разному:
 * нажал «← кейсы А3» — приходит синяя плоскость; нажал «назад» — экран
 * подменяется мгновенно. Владелец: «хочу полноценно рабочую навигацию и через
 * интерфейс, и по кнопкам назад-вперёд».
 *
 * Проверяются обе дороги, где движение есть: возврат к работам компании
 * (приходящая плоскость) и открытие компании с главной (спуск). Уход синего на
 * главную играет сам — это exit-анимация компонента, ей источник не важен.
 */
test("«назад» с кейса идёт приходящей плоскостью, как и кнопка на экране", async ({ page }) => {
  await page.goto(portfolioUrl());
  await page.getByTestId("pa-company-a3").click();
  await page.getByTestId("pa-case-dashboard-redesign").click();
  await expect(page.getByTestId("pc-title")).toBeVisible();

  await page.goBack();

  const curtain = page.getByTestId("pa-curtain");
  await expect(curtain).toHaveAttribute("data-direction", "in");
  await expect(curtain).toHaveCount(0, { timeout: 4000 });

  await expect(page).toHaveURL(/\/a3$/);
  await expect(page.getByTestId("pa-sheet")).toBeVisible();
});

test("«вперёд» на компанию идёт спуском, а не подменой", async ({ page }) => {
  await page.goto(portfolioUrl());
  await page.getByTestId("pa-company-a3").click();
  await expect(page).toHaveURL(/\/a3$/);

  await page.goBack();
  await expect(page).toHaveURL(/\/$/);

  await page.goForward();
  await expect(page).toHaveURL(/\/a3$/);

  /*
    Плоскость обязана ЕХАТЬ. Замер берётся сразу после перехода: при подмене
    без движения `clip-path` стоит на `inset(0%)` с первого кадра — именно так
    «вперёд» и работало, пока движение зависело от того, кто его вызвал.
  */
  const clip = await page
    .getByTestId("pa-sheet-plane")
    .evaluate((el) => getComputedStyle(el).clipPath);
  expect(clip, `Плоскость на ${clip} — спуска нет`).not.toBe("inset(0%)");

  // И доезжает до конца.
  await expect(page.getByTestId("pa-sheet-plane")).toHaveCSS("clip-path", "inset(0%)", {
    timeout: 3000,
  });
});

/*
 * Прерванное движение не оставляет экран висеть.
 *
 * Человек может нажать «назад» второй раз, пока плоскость ещё идёт. Досматривать
 * её незачем — важно, чтобы маршрут и картинка сошлись на том, куда он идёт.
 */
test("второе «назад» посреди движения не ломает экран", async ({ page }) => {
  await page.goto(portfolioUrl());
  await page.getByTestId("pa-company-a3").click();
  await page.getByTestId("pa-case-dashboard-redesign").click();
  await expect(page.getByTestId("pc-title")).toBeVisible();

  await page.goBack();
  await page.waitForTimeout(200); // плоскость ещё в пути
  await page.goBack();

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByTestId("pa-word")).toBeVisible();
  await expect(page.getByTestId("pa-sheet")).toHaveCount(0);
  await expect(page.getByTestId("pa-curtain")).toHaveCount(0);
});

/*
 * Разбор снисходителен к мусору в адресе, но строка приводится к тому экрану,
 * который открыт: иначе `/a3/case/nope` осталось бы адресом реальной страницы,
 * а для поиска — её дублем.
 */
test("неизвестный маршрут возвращает на главную и правит адрес", async ({ page }) => {
  await page.goto(portfolioUrl("/no-such-company"));

  await expect(page.getByTestId("pa-word")).toBeVisible();
  await expect(page).toHaveURL(/\/$/);

  await page.goto(portfolioUrl("/a3/case/no-such-case"));
  await expect(page).toHaveURL(/\/a3\/case\/dashboard-redesign$/);
});

/*
 * Адреса `/archive` и `/archive/<id>` прожили 14-15 августа, пока новый дизайн
 * строился рядом со старым. Сохранённая за эти два дня ссылка обязана привести
 * на тот же экран, а не на главную «по правилу неизвестного сегмента».
 */
test("старые адреса /archive приводят на те же экраны", async ({ page }) => {
  await page.goto(portfolioUrl("/archive"));
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByTestId("pa-word")).toBeVisible();

  await page.goto(portfolioUrl("/archive/a3"));
  await expect(page).toHaveURL(/\/a3$/);
  await expect(page.getByTestId("pa-sheet")).toBeVisible();
});

/*
 * 🔴 Кейс, открытый ПОСЛЕ возврата, не закрывается сам.
 *
 * Дефект 2026-08-15, найден владельцем по точной цепочке: главная → A3 → кейс
 * → «← кейсы А3» → любой кейс. Приходящий занавес рендерится только на странице
 * кейса, а снимался лишь сменой маршрута — после возврата он оставался в
 * состоянии и ждал. Стоило открыть следующий кейс, как он приезжал вместе с ним
 * и своим завершением уводил маршрут обратно на работы компании: кейс
 * открывался и через полторы секунды сам закрывался синей плоскостью.
 *
 * Проверка идёт по ВСЕЙ цепочке и смотрит состояние ПОСЛЕ паузы: сразу после
 * нажатия картина верная, ложный возврат случается через ~1,5 с. Одиночные
 * переходы этот дефект не видят — он живёт в остатке состояния от предыдущего.
 */
test("кейс, открытый после возврата, остаётся открытым", async ({ page }) => {
  await page.goto(portfolioUrl());
  await page.getByTestId("pa-company-a3").click();
  await page.getByTestId("pa-case-dashboard-redesign").click();
  await expect(page.getByTestId("pc-title")).toBeVisible();

  await page.getByTestId("pc-back").click();
  await expect(page).toHaveURL(/\/a3$/);
  await expect(page.getByTestId("pa-sheet")).toBeVisible();

  await page.getByTestId("pa-case-flow").click();
  await expect(page).toHaveURL(/\/a3\/case\/flow$/);

  // Занавес обязан уйти и НЕ утащить за собой маршрут.
  await expect(page.getByTestId("pa-curtain")).toHaveCount(0, { timeout: 4000 });
  await page.waitForTimeout(1200);
  await expect(page).toHaveURL(/\/a3\/case\/flow$/);
  await expect(page.getByTestId("pc-title")).toBeVisible();
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

/*
 * 🔴 Возврат с кейса ведёт к работам СВОЕЙ компании, а не на главную.
 *
 * Решение владельца: человек уходит в кейс с синего экрана компании и должен
 * вернуться к её же кейсам; на главную с кейса ведёт вторая строка шапки.
 *
 * Подпись при этом разная: здесь «← кейсы А3», на экране компании «← все
 * работы». Пока обе назывались «все работы», одинаковые слова означали два
 * разных перехода, и владелец, нажимая на кейсе, попадал не туда, куда ждал
 * (2026-08-15).
 *
 * Проверяется и адрес, и результат: `/a3` обязан открыть синий экран сразу,
 * без нажатия на имя компании.
 */
test("с кейса возврат ведёт к работам своей компании", async ({ page }) => {
  await page.goto(portfolioUrl("/a3/case/dashboard-redesign"));
  await expect(page.getByTestId("pc-title")).toBeVisible();

  await page.getByTestId("pc-back").click();

  /*
    🔴 Возврат — это движение, а не подмена страницы.

    Кобальтовая плоскость приходит сверху вниз и накрывает кейс, и только под
    ней меняется маршрут. Без этого возврат был мгновенным, хотя дорога на кейс
    — движение: «анимацию не забудь перенести» (владелец, 2026-08-14).

    Проверяется занавес именно ПРИХОДЯЩИЙ: у уходящего то же имя и тот же класс,
    отличается направление.
  */
  const curtain = page.getByTestId("pa-curtain");
  await expect(curtain).toHaveAttribute("data-direction", "in");
  await expect(curtain).toHaveCount(0, { timeout: 4000 });

  await expect(page).toHaveURL(/\/a3$/);
  await expect(page.getByTestId("pa-sheet")).toBeVisible();
  await expect(page.locator(".pa-huge")).toHaveText("A3");

  /*
    🔴 Плакат не мелькает по дороге.

    Синий экран приходил спуском 0.72 с, и всё это время под ним был виден
    главный экран — владелец поймал это сразу: «успевает проскальзывать
    стартовый экран». По адресу экран обязан быть открыт с первого кадра, а
    заглушка на время подгрузки чанка — кобальтовой, а не чернильной.
  */
  const plane = page.getByTestId("pa-sheet-plane");
  await expect(plane).toHaveCSS("clip-path", /inset\(0%\)|none/);
});

test("прямой заход на маршрут компании открывает синий экран", async ({ page }) => {
  await page.goto(portfolioUrl("/a3"));

  await expect(page.getByTestId("pa-sheet")).toBeVisible();
  // Неизвестная компания в адресе — обычный архив, а не ошибка.
  await page.goto(portfolioUrl("/нет-такой"));
  await expect(page.getByTestId("pa-sheet")).toHaveCount(0);
  await expect(page.locator(".pa-cell").first()).toBeVisible();
});

/*
 * 🔴 На странице кейса нет ничего сверх макета.
 *
 * Решение владельца 2026-08-14: «остальные блоки когда я доделаю я тебе скажу,
 * а пока не надо вносить ничего своего». Сняты блок фактов «Клиент / Год /
 * Срок / Работа», строка типа над именем, кобальтовая плашка под лидом,
 * таблица «Что сделал / Результат», плоскость «Итог» и переход на соседний
 * кейс. Их код и данные целы — вернутся, когда макет дорисуют.
 *
 * Проверка сторожит именно ОТСУТСТВИЕ: вернуть блок обратно легко, и заметить
 * это на странице в восемь тысяч пикселей трудно.
 */
test("на странице кейса нет блоков вне макета", async ({ page }) => {
  await page.goto(portfolioUrl("/a3/case/dashboard-redesign"));
  await expect(page.getByTestId("pc-title")).toBeVisible();

  for (const id of ["pc-facts", "pc-rows", "pc-impact", "pc-next"]) {
    await expect(page.getByTestId(id), `Блок ${id} вернулся на страницу`).toHaveCount(0);
  }

  // Разделы — только те, что есть в макете, и в его порядке.
  const kickers = await page.locator(".pc-kicker").allTextContents();
  expect(kickers.map((text) => text.trim())).toEqual([
    "О проекте",
    "Контекст",
    "Проблемы до редизайна",
  ]);
});

/*
 * Переход с синего экрана компании на кейс — закрытием, а не подменой.
 *
 * Плоскость компании уезжает вверх, и под ней УЖЕ отрисован кейс. Проверяются
 * оба условия разом: занавес существует и страница под ним готова. Раньше
 * экран работ размонтировался целиком и кейс появлялся вспышкой.
 */
test("с синего экрана кейс открывается закрытием плоскости", async ({ page }) => {
  await page.goto(portfolioUrl());

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
 * Ничто на синем экране не проступает раньше самой плоскости.
 *
 * Дефект жил ровно один день и родился из разделения слоёв: пока `clip-path`
 * стоял на всём листе, он обрезал ВСЁ содержимое разом, и элементы без
 * собственной анимации были не видны просто за компанию. Как только текст
 * вынесли из анимируемого слоя, всё неанимированное стало проступать на
 * чернилах с нулевого кадра — кнопка «← все работы» и верхняя линия ряда кейсов
 * приходили раньше кобальта. Владелец поймал оба за минуту, машина не ловила
 * ничего: элементы на месте, тексты те же, раскладка та же.
 *
 * Проверяются оба конца: и прозрачность в первые кадры, и то, что линия ряда
 * принадлежит первой СТРОКЕ, а не контейнеру. Второе — не придирка к стилю:
 * контейнер ничем не анимируется, и любой бордер на нём воспроизведёт дефект.
 */
test("содержимое синего экрана не появляется раньше плоскости", async ({ page }) => {
  await page.goto(portfolioUrl());

  await page.getByTestId("pa-company-a3").click();
  await expect(page.getByTestId("pa-sheet")).toBeVisible();

  // Пауза лесенки — 0.38 с; замер идёт заведомо раньше неё.
  const early = await page.evaluate(() => ({
    back: Number(getComputedStyle(document.querySelector(".pa-back")!).opacity),
    firstCase: Number(getComputedStyle(document.querySelector(".pa-case")!).opacity),
    casesBorder: getComputedStyle(document.querySelector(".pa-cases")!).borderTopWidth,
  }));

  expect(early.back, `Кнопка возврата на ${early.back}`).toBeLessThan(0.2);
  expect(early.firstCase, `Первая строка на ${early.firstCase}`).toBeLessThan(0.2);
  expect(early.casesBorder, "Линия ряда снова на контейнере").toBe("0px");

  // И оба доходят до конца — проверка ловит не «спрятали навсегда», а порядок.
  await expect(page.getByTestId("pa-back")).toHaveCSS("opacity", "1", { timeout: 3000 });
});

/*
 * Возврат к списку идёт в том же темпе, что приход, — как и уход на кейс.
 *
 * Первая сборка закрывала лист за 0.4 с на кривой `[0.4, 0, 1, 1]`: это ease-IN,
 * то есть движение разгонялось до самого конца и обрывалось на полном ходу.
 * Владелец: «как-то резко уходит» (2026-08-14) — то же замечание, что он уже
 * делал про занавес на кейс. Проверка ловит возврат к спешке.
 */
test("возврат к списку идёт в темпе прихода", async ({ page }) => {
  await page.goto(portfolioUrl());
  await page.getByTestId("pa-company-a3").click();
  await expect(page.getByTestId("pa-sheet")).toBeVisible();
  await expect(page.getByTestId("pa-back")).toHaveCSS("opacity", "1", { timeout: 3000 });

  const started = Date.now();
  await page.getByTestId("pa-back").click();
  await expect(page.getByTestId("pa-sheet")).toHaveCount(0, { timeout: 4000 });
  const elapsed = Date.now() - started;

  // 0.72 с плюс кадр на снятие; нижняя граница отсекает прежние 0.4 с.
  expect(elapsed, `Лист ушёл за ${elapsed} мс`).toBeGreaterThan(600);
  expect(elapsed, `Лист ушёл за ${elapsed} мс`).toBeLessThan(1400);
});

/*
 * Содержимое синего экрана не переживает кромку уходящей плоскости.
 *
 * Плоскость обрезается снизу вверх, то есть низ листа освобождается первым:
 * кромка пролетает нижние 10 % высоты за ~50 мс. Пока содержимое гасло одним
 * общим fade на контейнере, величины внизу продолжали висеть на голых чернилах
 * ещё треть секунды после того, как кобальт из-под них ушёл. Владелец: «числа
 * снизу уходят медленно, кобальт уже оттуда ушёл, а значения всё ещё исчезают»
 * (2026-08-14).
 *
 * Проверка идёт от механизма: на каждом кадре смотрим, где кромка, и что ещё
 * видно НИЖЕ неё. Порог 0.2 — не «совсем прозрачно», а «уже не читается».
 */
test("содержимое синего экрана не переживает кромку плоскости", async ({ page }) => {
  await page.goto(portfolioUrl());
  await page.getByTestId("pa-company-a3").click();
  await expect(page.getByTestId("pa-back")).toHaveCSS("opacity", "1", { timeout: 3000 });

  const result = await page.evaluate(async () => {
    const H = window.innerHeight;
    const edgeOf = (sel: string) => {
      const node = document.querySelector(sel);
      if (!node) return null;
      const m = /inset\(0%\s+0%\s+([\d.]+)%/.exec(getComputedStyle(node).clipPath);
      // Нижняя кромка в px от верха окна; без клипа элемент виден целиком.
      return m ? H * (1 - Number(m[1]) / 100) : H;
    };

    (document.querySelector(".pa-back") as HTMLButtonElement).click();

    let frames = 0;
    let moved = false;
    let worstGap = 0;
    await new Promise<void>((resolve) => {
      const started = performance.now();
      const tick = () => {
        const plane = edgeOf(".pa-sheet-plane");
        const inner = edgeOf(".pa-sheet-inner");
        if (plane !== null && inner !== null) {
          frames += 1;
          if (plane < H - 1) moved = true;
          worstGap = Math.max(worstGap, Math.abs(plane - inner));
        }
        if (plane === null || performance.now() - started > 900) resolve();
        else requestAnimationFrame(tick);
      };
      tick();
    });
    return { frames, moved, worstGap: Math.round(worstGap) };
  });

  // Кадры действительно снимались и движение действительно шло — иначе
  // «расхождение ноль» означало бы, что проверять было нечего.
  expect(result.frames, "Кадров ухода не снято").toBeGreaterThan(5);
  expect(result.moved, "Плоскость не двигалась").toBe(true);
  // 8 px — допуск на округление кадра, а не на рассинхрон: механизм общий.
  expect(
    result.worstGap,
    `Текст отстал от цвета на ${result.worstGap} px`,
  ).toBeLessThanOrEqual(8);
});

/*
 * Занавес на кейс идёт в темпе открытия синего экрана — 0.72 с.
 *
 * Решение владельца 2026-08-14: «такой же, как открытие, только другой график,
 * раз это в обратную сторону». Совпадение проверяется по факту ухода: середина
 * и завершение у обоих движений сходятся (замер: 50 % пути к 255 и 285 мс,
 * 90 % к 460 и 495), расходится только первая треть секунды.
 *
 * История правок до этого: 0.52 — «слишком быстро закрывается»; попытка
 * растянуть до 1.0 — «как-то резко» лечилось не длительностью, а кривой.
 */
test("занавес на кейс идёт в темпе открытия", async ({ page }) => {
  await page.goto(portfolioUrl());
  await page.getByTestId("pa-company-a3").click();
  await expect(page.getByTestId("pa-sheet")).toBeVisible();

  const started = Date.now();
  await page.getByTestId("pa-case-dashboard-redesign").click();
  await expect(page.getByTestId("pa-curtain")).toHaveCount(0, { timeout: 4000 });
  const elapsed = Date.now() - started;

  // 0.72 с плюс кадр на снятие; нижняя граница отсекает прежние 0.52.
  expect(elapsed, `Занавес ушёл за ${elapsed} мс`).toBeGreaterThan(600);
  expect(elapsed, `Занавес ушёл за ${elapsed} мс`).toBeLessThan(1100);
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
