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

  /*
    🔴 Почта подписана словом, а сам адрес в тексте страницы не появляется —
    решение владельца 2026-08-15. Открытый адрес в разметке собирают почтовые
    роботы; здесь он живёт только в `href`.
  */
  const mail = contacts.nth(1);
  await expect(mail).toHaveText("mail");
  await expect(mail).toHaveAttribute("href", "mailto:i@ivan-ignatov.ru");

  const visible = await page.evaluate(() => document.body.innerText);
  expect(visible, "Адрес почты виден в тексте страницы").not.toMatch(/@[\w.-]+\.\w+/);
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
/*
 * 🔴 Лист выглядит одинаково, над какой бы страницей ни приехал.
 *
 * Владелец, 2026-08-15: «почему когда с кейса делаешь переход, название
 * компании чернеет». Белый цвет и гарнитура жили на `.pa-root` — корне
 * главной, — а лист возврата приезжает поверх кейса, вне этого корня, и
 * наследовал чернильный цвет документа: имя ехало чёрным и белело только
 * после подмены экрана. Замер поймал ровно это: `rgb(0,0,0)` в движении,
 * `rgb(255,255,255)` после.
 *
 * Проверяется именно В ДВИЖЕНИИ: после подмены цвет верен в любом случае, и
 * проверка на готовом экране дефекта не увидела бы.
 */
test("имя компании не темнеет на приезде с кейса", async ({ page }) => {
  await page.goto(portfolioUrl("/a3/case/dashboard-redesign"));
  await expect(page.getByTestId("pc-title")).toBeVisible();

  /*
    Замер снимается ОДНИМ кадром в середине приезда, без ожиданий: `expect` с
    ретраями досматривает движение до конца, а после подмены экрана цвет верен
    в любом случае — так проверка проходила и на сломанном коде.
  */
  const style = await page.evaluate(async () => {
    document.querySelector<HTMLElement>("[data-testid='pc-back']")!.click();
    await new Promise((resolve) => setTimeout(resolve, 250));
    const huge = document.querySelector(".pa-huge");
    if (!huge) return null;
    const computed = getComputedStyle(huge);
    return { color: computed.color, font: computed.fontFamily, caseAlive: Boolean(document.querySelector(".pc-root")) };
  });

  expect(style, "лист не приехал").not.toBeNull();
  // Кейс ещё под листом — значит замер снят именно в движении.
  expect(style!.caseAlive, "замер снят уже после подмены экрана").toBe(true);
  expect(style!.color, "имя приезжает не белым").toBe("rgb(255, 255, 255)");
  // Гарнитура ехала той же дорогой: без своей она бралась со страницы кейса.
  expect(style!.font, "гарнитура взята со страницы под листом").toMatch(/Manrope/);
});

test("«назад» с кейса приводит лист компании, как и кнопка на экране", async ({ page }) => {
  await page.goto(portfolioUrl());
  await page.getByTestId("pa-company-a3").click();
  await page.getByTestId("pa-case-dashboard-redesign").click();
  await expect(page.getByTestId("pc-title")).toBeVisible();

  await page.goBack();

  // Лист приезжает поверх кейса — и кейс всё ещё под ним.
  await expect(page.getByTestId("pa-sheet")).toBeVisible();
  await expect(page.getByTestId("pc-title")).toBeVisible();

  await expect(page).toHaveURL(/\/a3$/);
  await expect(page.getByTestId("pc-root")).toHaveCount(0, { timeout: 4000 });
  await expect(page.getByTestId("pa-sheet")).toHaveCount(1);
});

/*
 * 🔴 Экран компании открывается ОДИНАКОВО, откуда бы ни пришли.
 *
 * Владелец, 2026-08-15: «с главной у меня текст быстро появляется, а когда с
 * кейса — то медленно». Замер подтвердил: скорость лесенки та же, разным был
 * момент старта. С главной движения накладываются — плоскость едет 0,72 с, а
 * текст идёт поверх неё с 0,38 и встаёт к её приходу (имя на 741 мс). На
 * возврате они шли подряд: пустая плоскость закрывала кейс, и лишь потом
 * стартовала лесенка (имя на 1072 мс).
 *
 * Лечение — в маршруте: на возврате приезжает сам лист компании, а не
 * плоскость-пустышка. Проверка сравнивает ОБА пути по одному признаку: когда
 * имя стало полностью видимым. Порог 120 мс — это два кадра запаса на разброс
 * планировщика; настоящее расхождение было втрое больше.
 */
test("текст встаёт одинаково с главной и с кейса", async ({ page }) => {
  /*
    Нажатие и замер идут ВНУТРИ страницы, одним вызовом: между командой из
    теста и настоящим кликом лежит задержка протокола, и на ней первый замер
    показывал 1650 мс вместо 740 — то есть врал ровно на величину, которую и
    надо было сравнивать.
  */
  const nameShownAfterClick = (testId: string) =>
    page.evaluate(async (id) => {
      const target = document.querySelector<HTMLElement>(`[data-testid="${id}"]`);
      if (!target) return -1;

      const t0 = performance.now();
      target.click();

      return new Promise<number>((resolve) => {
        const tick = () => {
          const huge = document.querySelector(".pa-huge");
          if (huge && Number(getComputedStyle(huge).opacity) > 0.98) {
            resolve(Math.round(performance.now() - t0));
            return;
          }
          if (performance.now() - t0 > 4000) {
            resolve(-1);
            return;
          }
          requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
    }, testId);

  await page.goto(portfolioUrl());
  await expect(page.getByTestId("pa-word")).toBeVisible();
  const fromHome = await nameShownAfterClick("pa-company-a3");

  await page.getByTestId("pa-case-dashboard-redesign").click();
  await expect(page.getByTestId("pc-title")).toBeVisible();

  const fromCase = await nameShownAfterClick("pc-back");

  expect(fromHome, "имя не встало при открытии с главной").toBeGreaterThan(0);
  expect(fromCase, "имя не встало при возврате с кейса").toBeGreaterThan(0);
  expect(
    Math.abs(fromCase - fromHome),
    `С главной ${fromHome} мс, с кейса ${fromCase} мс`,
  ).toBeLessThan(120);
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

  /*
    🔴 Считаются показы С ИЗОБРАЖЕНИЕМ. С 2026-08-16 на странице есть ещё и
    пустое место под кадр «Контекста»: в макете кадр там есть, а изображения у
    кейса пока нет — владелец заменит. Подписи у места нет намеренно, её тоже
    напишет он вместе с кадром, и требовать её здесь значило бы требовать
    выдуманный текст.
  */
  const shots = page.locator(".pc-shot:has(img)");
  const captions = page.locator(".pc-shot:has(img) figcaption");

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

    Поверх кейса ПРИЕЗЖАЕТ сам экран компании — целиком, со своим спуском и
    лесенкой, — и только когда он приехал, меняется маршрут. Плоскости-пустышки
    здесь больше нет: пока возврат вёл её, движения шли подряд, а не внахлёст, и
    текст вставал на 300 мс позже, чем при открытии с главной (2026-08-15).
  */
  const sheet = page.getByTestId("pa-sheet");
  await expect(sheet).toBeVisible();
  await expect(page.locator(".pa-huge")).toHaveText("A3");

  /*
    Кейс держится ПОД приезжающим листом всю дорогу: пропади он раньше, под
    едущей плоскостью зияла бы пустота.
  */
  await expect(page.getByTestId("pc-title")).toBeVisible();

  await expect(page).toHaveURL(/\/a3$/);
  await expect(page.getByTestId("pc-root")).toHaveCount(0, { timeout: 4000 });

  // Лист ровно один: подмена идёт одним обновлением, без наложения двух копий.
  await expect(sheet).toHaveCount(1);

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

  /*
    Разделы — только те, что владелец назвал, и в порядке данных. «Продуктовые
    гипотезы» добавлены 2026-08-16 вместе с блоком карточек (узел `124:2018`),
    «Бизнес-эффект» — 2026-08-17 по его правке, под блоком крупных цифр.

    🔴 Список сторожится целиком, а не «содержит»: смысл проверки в том, что
    страница не обрастает разделами САМА. Каждая строка здесь появилась после
    отдельной фразы владельца, и добавить сюда пятую можно только так же.
  */
  const kickers = await page.locator(".pc-kicker").allTextContents();
  expect(kickers.map((text) => text.trim())).toEqual([
    "О проекте",
    "Контекст",
    "Проблемы до редизайна",
    "Продуктовые гипотезы",
    "Бизнес-эффект",
  ]);
});

/*
 * Шаблон первого кейса распространён на ВСЕ восемь: у каждого есть разделы.
 *
 * Правка владельца 2026-08-17: «используй кейс А3 редизайн главной как шаблон и
 * распространи на каждый кейс, только с заменяемым текстовым контентом».
 *
 * 🔴 Сторожится именно НАЛИЧИЕ текста на каждой странице. До этой правки список
 * разрешённых меток отсекал у семи кейсов ВСЁ: у них ни один раздел не размечен,
 * а условие фильтра выбрасывало неразмеченные. Страницы были пустыми, и увидеть
 * это можно было только зайдя на каждую — ни один тест туда не заходил.
 */
const ALL_CASES = [
  ["a3", "dashboard-redesign"],
  ["a3", "flow"],
  ["a3", "design-system"],
  ["rtk", "subscriptions"],
  ["rtk", "web-services"],
  ["rtk", "onboarding"],
  ["smlt", "mdg"],
  ["smlt", "options-map"],
] as const

for (const [company, id] of ALL_CASES) {
  test(`кейс ${company}/${id} собран по шаблону`, async ({ page }) => {
    await page.goto(portfolioUrl(`/${company}/case/${id}`))
    await expect(page.getByTestId("pc-title")).toBeVisible()

    /*
      🔴 МЕТКИ РАЗДЕЛОВ ОДИНАКОВЫ НА ВСЕХ КЕЙСАХ и равны меткам шаблона.
      Владелец 2026-08-17: «страница кейса А3 с редизайном главной — шаблон,
      значит другие страницы должны содержать точно такой же порядок, такие же
      блоки; никаких „Итоги“, „Решения“ и прочего — только то, что есть на
      шаблонном кейсе».
    */
    const kickers = await page.locator(".pc-kicker").allTextContents()
    expect(kickers.map((text) => text.trim())).toEqual([
      "О проекте",
      "Контекст",
      "Проблемы до редизайна",
      "Продуктовые гипотезы",
      "Бизнес-эффект",
    ])

    /*
      Текст разделов на месте: тезисы, абзацы или пункты.

      🔴 Порог низкий намеренно. После правки «блоки вне шаблона не нужны» у части
      кейсов остаются всего две роли из четырёх: у «МСГ» это «Проблемы» и
      «Бизнес-эффект», и текста там четыре узла. Требовать больше значило бы
      требовать содержания, которого у кейса нет, — а сочинять его нельзя.
    */
    const texts = await page.locator(".pc-part, .pc-section-text, .pc-item-text").count()
    expect(texts, `У ${id} нет текста разделов`).toBeGreaterThan(3)

    // Ни одна метка не осталась пустой строкой после переразметки.
    for (const kicker of kickers) {
      expect(kicker.trim().length, "Пустая метка раздела").toBeGreaterThan(0)
    }

    // Подвал с переходом есть у каждого кейса: соседей в компании минимум двое.
    await expect(page.getByTestId("pc-jump")).toBeVisible()
    expect(await page.locator(".pc-jump-card").count()).toBeGreaterThan(0)

    /*
      🔴 ПОРЯДОК блоков, а не только состав. Правка владельца: «повтори
      расположение блоков включая порядок». Первый заход дал верные разделы, но
      кадры остались там, где лежат в данных, и цифры вставали по месту своего
      раздела — у «Услуг Web» последним блоком страницы.

      Сторожится инвариант каркаса, общий для всех восьми страниц:
        • первым идёт вводный блок;
        • блок цифр стоит НЕ последним, если после него есть текстовая роль;
        • пара кадров под вводным блоком, а не в середине;
        • чередование сдвигов не сбивается: два текстовых блока подряд на одной
          вертикали допустимы только в начале (вводная группа).
    */
    const frame = await page.evaluate(() =>
      /*
        🔴 Кадр героя входит в замер. Он лежит ВЫШЕ `.pc-flow`, и прежняя версия
        этой проверки его не видела: у трёх кейсов обложки в данных нет, блок не
        рендерился, страница начиналась текстом — а тест показывал «порядок
        совпадает». Владелец заметил это глазом: «почему у шаблона первый блок
        изображение, а в остальных кейсах сначала блок о проекте».
      */
      [...document.querySelectorAll("[data-testid='pc-hero'], .pc-flow > *")].map((el) => {
        if (el.classList.contains("pc-section"))
          return `section:${(el as HTMLElement).dataset.shift === "true" ? "third" : "field"}`
        /*
          🔴 Блок кадров считается только с содержимым. Пустой `div` без кадра и
          без места обманул предыдущую версию проверки: негативный контроль снял
          кадр героя, а тест прошёл — потому что смотрел на класс, а не на то,
          есть ли внутри что показывать.
        */
        if (el.classList.contains("pc-shots"))
          return el.querySelector(".pc-shot") ? "shots" : "shots:EMPTY"
        if (el.classList.contains("pc-path")) return "path"
        if (el.classList.contains("pc-figures")) return "figures"
        return "other"
      }),
    )

    expect(frame[0], "Первым блоком идёт КАДР ГЕРОЯ, а не текст").toBe("shots")
    expect(frame[1], "Вторым — вводный раздел «О проекте» на трети").toBe("section:third")
    expect(frame[2], "Третьим — пара кадров под вводным блоком").toMatch(/shots|path/)

    /*
      Блок цифр не может стоять раньше «Проблем»: в шаблоне он между гипотезами и
      «Бизнес-эффектом», то есть во второй половине страницы.

      🔴 А вот требовать текстовый раздел ПОСЛЕ цифр нельзя: у «Онбординга» и
      «Услуг Web» роль «Бизнес-эффекта» и есть источник этих цифр, и текстом она
      не показывается, чтобы те же числа не стояли дважды. Там страница честно
      кончается блоком величин, и это следствие данных, а не сбитого порядка.
    */
    const figuresAt = frame.indexOf("figures")
    if (figuresAt >= 0) {
      const sectionsBefore = frame.slice(0, figuresAt).filter((item) => item.startsWith("section"))
      expect(
        sectionsBefore.length,
        "Блок цифр встал раньше текстовых разделов",
      ).toBeGreaterThanOrEqual(2)
    }

    /*
      🔴 Девять позиций шаблона стоят у КАЖДОГО кейса, даже если роль занята рыбой
      из шаблона («проставь везде нужные блоки, даже если их нет»). Порядок
      образца: текст → пара кадров → текст → широкий кадр → текст → пара кадров →
      текст → цифры → текст.
    */
    expect(frame.length, `У ${id} каркас короче шаблона: ${frame.join(" · ")}`).toBe(10)
    expect(frame[4], "Пятая позиция — широкий кадр или схема").toMatch(/shots|path/)
    expect(frame[6], "Седьмая позиция — пара кадров").toBe("shots")
    expect(frame[8], "Девятая позиция — блок цифр").toBe("figures")

    const shifts = frame.filter((item) => item.startsWith("section"))
    for (let index = 2; index < shifts.length; index += 1) {
      expect(
        shifts[index] === shifts[index - 1] && shifts[index - 1] === shifts[index - 2],
        `Три текстовых блока подряд на одной вертикали у ${id}`,
      ).toBe(false)
    }
  })
}

/*
 * Переход кейс → кейс идёт занавесом, а не подменой.
 *
 * Правка владельца 2026-08-17: «кнопки переключения кейса с футера должны тоже
 * как-то анимированно открывать кейсы, а то там просто статика; предлагаю
 * использовать анимацию как при вызове меню с кейсами».
 *
 * 🔴 Сторожится ПОРЯДОК фаз, а не факт анимации: плоскость обязана сначала
 * прийти (`in`) и только под закрытым занавесом сменить кейс, потом уехать
 * (`out`). Если фазы перепутать, подмена будет видна сквозь незакрытую
 * плоскость — дефект, который на глаз заметен лишь при внимательном просмотре.
 */
test("переход между кейсами идёт занавесом в две фазы", async ({ page }) => {
  await page.goto(portfolioUrl("/a3/case/flow"))
  await expect(page.getByTestId("pc-title")).toBeVisible()

  await page.evaluate(() => {
    const log: { dir: null | string; title: null | string }[] = []
    ;(window as unknown as { __jump: typeof log }).__jump = log
    const tick = () => {
      const curtain = document.querySelector('[data-testid="pa-curtain"]')
      log.push({
        dir: curtain?.getAttribute("data-direction") ?? null,
        title: document.querySelector('[data-testid="pc-title"]')?.textContent?.trim() ?? null,
      })
      if (log.length < 240) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  })

  await page.locator('.pc-jump-card[data-dir="next"]').click()
  await expect(page).toHaveURL(/\/a3\/case\/design-system$/)
  // Обе фазы занавеса по 0.72 с — ждём с запасом и снимаем журнал.
  await page.waitForTimeout(2000)

  const log = await page.evaluate(
    () => (window as unknown as { __jump: { dir: null | string; title: null | string }[] }).__jump,
  )

  // Пока занавес ПРИХОДИТ, на экране обязан оставаться прежний кейс.
  const during = log.filter((entry) => entry.dir === "in")
  expect(during.length, "Фазы прихода занавеса не было — переход остался подменой").toBeGreaterThan(0)
  expect(
    during.every((entry) => entry.title === "Оптимизация флоу"),
    "Новый кейс встал раньше, чем плоскость закрыла старый",
  ).toBe(true)

  // Уход занавеса идёт уже с нового кейса.
  const leaving = log.filter((entry) => entry.dir === "out")
  expect(leaving.length, "Занавес не разворачивался на уход").toBeGreaterThan(0)
  expect(leaving.at(-1)?.title).toBe("Дизайн-система")

  // Дорога назад та же: кнопка браузера возвращает на прежний кейс.
  await page.goBack()
  await expect(page).toHaveURL(/\/a3\/case\/flow$/)
  await expect(page.getByTestId("pc-title")).toHaveText("Оптимизация флоу")
})

/*
 * Переход к соседним кейсам зависит от места человека в списке.
 *
 * Блок заведён 2026-08-17 по правке владельца («переход к следующему кейсу или
 * предыдущему в зависимости от того, где находится человек»). Список НЕ
 * замкнут в кольцо, и это главное, что здесь сторожится: кольцо показывало бы
 * «следующий» на последнем кейсе и вело к первому, то есть врало бы о том, где
 * человек находится.
 *
 * Проверяется и сам переход, а не только его вид: кнопка обязана привести на
 * другой кейс и сменить адрес — иначе блок остаётся картинкой.
 */
test("переход к соседним кейсам знает место человека в списке", async ({ page }) => {
  // Первый кейс компании: назад некуда.
  await page.goto(portfolioUrl("/a3/case/dashboard-redesign"))
  await expect(page.getByTestId("pc-jump")).toBeVisible()
  await expect(page.locator(".pc-jump-card")).toHaveCount(1)
  await expect(page.locator('.pc-jump-card[data-dir="next"]')).toBeVisible()

  // Кобальт — тот же, что на синих экранах компаний.
  const background = await page.evaluate(
    () => getComputedStyle(document.querySelector('[data-testid="pc-jump"]')!).backgroundColor,
  )
  expect(background).toBe("rgb(4, 74, 179)")

  // Переход ведёт на следующий кейс и правит адрес.
  await page.locator('.pc-jump-card[data-dir="next"]').click()
  await expect(page).toHaveURL(/\/a3\/case\/flow$/)

  // Средний кейс: соседи с обеих сторон.
  await expect(page.locator(".pc-jump-card")).toHaveCount(2)

  // Последний кейс: вперёд некуда.
  await page.goto(portfolioUrl("/a3/case/design-system"))
  await expect(page.locator(".pc-jump-card")).toHaveCount(1)
  await expect(page.locator('.pc-jump-card[data-dir="prev"]')).toBeVisible()
})

/*
 * Крупные цифры не сочиняются и не теряют направление.
 *
 * Блок заведён 2026-08-17 по правке владельца. Сторожатся ровно две вещи, каждая
 * из которых иначе ломается молча:
 *
 * 1. **Число — подстрока текста автора.** Цифра в портфолио, взявшаяся из
 *    вёрстки, а не из его текста, — худшее, что тут может случиться.
 * 2. **Направление подписано словом.** «35–45%» без глагола читается как рост,
 *    хотя это сокращение времени до первого действия.
 */
test("крупные цифры взяты из текста и подписаны направлением", async ({ page }) => {
  await page.goto(portfolioUrl("/a3/case/dashboard-redesign"))
  await expect(page.getByTestId("pc-figures")).toBeVisible()

  const figures = await page.evaluate(() =>
    [...document.querySelectorAll(".pc-figure")].map((cell) => ({
      label: cell.querySelector(".pc-figure-label")!.textContent!.trim(),
      note: cell.querySelector(".pc-figure-note")!.textContent!.trim(),
      value: cell.querySelector(".pc-figure-value")!.textContent!.trim(),
    })),
  )

  expect(figures.length, "Величин должно быть четыре — по метрикам кейса").toBe(4)

  for (const figure of figures) {
    // Число и единица стоят в значении: «10–15» без единицы читалось бы как проценты.
    expect(figure.value, `Величина ${figure.label} без числа`).toMatch(/\d/)
    expect(figure.value, `Величина ${figure.label} без единицы`).toMatch(/%|пункт/)
    // Направление — глагол автора в сути метрики.
    expect(
      figure.note,
      `У ${figure.label} не подписано направление: «${figure.note}»`,
    ).toMatch(/растёт|сокращается|снижаются|снижается|падает/)
  }

  // Имена метрик — те же, что в тексте кейса, а не переписанные вёрсткой.
  expect(figures.map((f) => f.label)).toEqual([
    "Activation",
    "Time to Action",
    "Support Contact Rate",
    "CES",
  ])
})

/*
 * Схема пути под «Контекстом» должна показывать РАЗВИЛКУ, а не последовательность.
 *
 * Заведено на двух своих же ошибках 2026-08-17, каждая из которых прошла бы
 * любую проверку «блок отрисован»:
 *
 * 1. На широком экране каждая дорожка тянула связь прямо вверх — к той ступени
 *    входа, над которой случайно оказалась. Схема утверждала «Вход → Проверить
 *    платежи», «Главная → Создать счёт». Лечится шиной: одна линия, от которой
 *    отходят все четыре дорожки.
 * 2. В одну колонку дорожки склеивались в непрерывную цепочку: «Свести самому»
 *    → «Создать счёт», то есть та же ложь с другой стороны. Лечится снятием
 *    связи над задачей и двойным зазором между дорожками.
 *
 * Поэтому проверяются не плашки, а именно связи — через `::before`.
 */
test("схема пути показывает развилку, а не цепочку", async ({ page }) => {
  await page.goto(portfolioUrl("/a3/case/dashboard-redesign"))
  await expect(page.getByTestId("pc-path")).toBeVisible()

  const link = () =>
    page.evaluate(() => {
      const tracks = document.querySelector(".pc-path-tracks")!
      const task = document.querySelector(".pc-path-track > [data-role='task']")!
      const bus = getComputedStyle(tracks, "::before")
      return {
        busShown: bus.display !== "none" && parseFloat(bus.blockSize || "0") > 0,
        taskLinkShown:
          getComputedStyle(task, "::before").display !== "none",
      }
    })

  await page.setViewportSize({ height: 900, width: 1440 })
  expect(await link(), "Широкий экран: шина развилки должна быть").toEqual({
    busShown: true,
    taskLinkShown: true,
  })

  await page.setViewportSize({ height: 844, width: 390 })
  expect(await link(), "Узкий экран: дорожки не должны читаться цепочкой").toEqual({
    busShown: false,
    taskLinkShown: false,
  })
})

/*
 * На узком экране колоночные привязки разделов должны сниматься ВСЕ.
 *
 * Проверка заведена на дефекте 2026-08-17: тезис «Продуктовых гипотез» держал
 * свои семь колонок и на 375, потому что задан через `:has(.pc-cards)` — а
 * `:has()` весит как класс и делает селектор специфичнее того, что сворачивает
 * разделы в медиазапросе. Медиазапрос веса не добавляет, поэтому правило молча
 * проигрывало: 189 px из 335 и десять строк по два слова («или к» / «менеджеру»).
 *
 * Проверяется не конкретный раздел, а инвариант «текст занимает поле»: та же
 * ловушка ждёт любой будущий селектор с `:has()`, `[data-*]` или вложенностью.
 */
test("на узком экране текст разделов занимает всё поле", async ({ page }) => {
  await page.setViewportSize({ height: 812, width: 375 })
  await page.goto(portfolioUrl("/a3/case/dashboard-redesign"))
  await expect(page.getByTestId("pc-title")).toBeVisible()

  const narrow = await page.evaluate(() => {
    const out: { field: number; kicker: string; role: string; width: number }[] = []
    document.querySelectorAll(".pc-section").forEach((section) => {
      const field = section.getBoundingClientRect().width
      const kicker = section.querySelector(".pc-kicker")?.textContent?.trim() ?? "(без метки)"
      section.querySelectorAll(":scope > .pc-part, :scope > .pc-lead, :scope > p.pc-section-text")
        .forEach((el) => {
          const width = el.getBoundingClientRect().width
          // 0.92, а не 1: у текста бывает своя мера в знаках — это законно.
          if (width < field * 0.92) {
            out.push({ field: Math.round(field), kicker, role: el.className, width: Math.round(width) })
          }
        })
    })
    return out
  })

  expect(narrow, "Текст раздела остался в своих колонках на узком экране").toEqual([])
})

/*
 * На широком экране заголовки и тексты стоят в СВОИХ макетных ширинах.
 *
 * Сетка задаёт позицию, а предел роста — ширину: колонки тянутся за окном, и на
 * 2560 они шире макетных. Числа взяты из узлов кейса и разнятся по разделам —
 * общего предела тут нет и быть не может.
 *
 * Заведено на дефекте 2026-08-17: тезису «Продуктовых гипотез» (узел `120:226`,
 * 1036) достался общий предел 1191. До 1920 семь колонок у́же предела, и он не
 * проявлялся; на 2560 текст дорастал до 1191 и ломался НЕ в местах владельца.
 * Проверка идёт числами, потому что глазами такое видно только на широком
 * мониторе — а собирается страница обычно не на нём.
 */
test("на широком экране заголовки держат макетные ширины", async ({ page }) => {
  await page.setViewportSize({ height: 1200, width: 2560 })
  await page.goto(portfolioUrl("/a3/case/dashboard-redesign"))
  await expect(page.getByTestId("pc-title")).toBeVisible()

  const measured = await page.evaluate(() =>
    [...document.querySelectorAll(".pc-section")].flatMap((section) => {
      const kicker = section.querySelector(".pc-kicker")?.textContent?.trim() ?? "(без метки)"
      return [...section.querySelectorAll(":scope > .pc-part, :scope > .pc-lead, :scope > p.pc-section-text")]
        .map((el) => `${kicker} · ${el.className} · ${Math.round(el.getBoundingClientRect().width)}`)
    })
  )

  expect(measured).toEqual([
    "О проекте · pc-part · 904",
    "О проекте · pc-section-text · 904",
    "Контекст · pc-part · 1191",
    "Контекст · pc-section-text · 731",
    "Проблемы до редизайна · pc-part · 1036",
    "Продуктовые гипотезы · pc-part · 1036",
    /*
      «Бизнес-эффект» пришёл 2026-08-17 и встал на чередование четвёртым текстовым
      блоком — то есть сдвинутым, как «Проблемы», и с той же макетной шириной
      сдвинутого тезиса 1036. Своего узла в макете у него пока нет: число взято
      не из него, а из правила чередования, уже снятого с макета.
    */
    "Бизнес-эффект · pc-part · 1036",
  ])
})

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
