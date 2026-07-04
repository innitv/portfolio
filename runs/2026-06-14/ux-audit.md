# UX Audit

## Inputs Used

- `apps/frontend/src/views/PortfolioView.tsx`
- `apps/frontend/src/styles.css`
- `http://127.0.0.1:5177/portfolio`
- `http://127.0.0.1:5177/portfolio/a3`
- `http://127.0.0.1:5177/portfolio/a3/case/dashboard-redesign`

## Scope

Проверка удобства текущего frontend-прототипа портфолио после перехода на flow:

```text
главная -> компания -> кейсы компании -> детальный кейс
```

Проверялись читаемость, навигация, touch targets, отсутствие горизонтального скролла, доступность основных заголовков и устойчивость композиции на разных разрешениях.

## Viewports

| Viewport | Size | Routes |
|---|---:|---|
| desktop-large | 1440x900 | `/portfolio`, `/portfolio/a3`, `/portfolio/a3/case/dashboard-redesign` |
| desktop-small | 1280x720 | `/portfolio`, `/portfolio/a3`, `/portfolio/a3/case/dashboard-redesign` |
| tablet | 768x1024 | `/portfolio`, `/portfolio/a3`, `/portfolio/a3/case/dashboard-redesign` |
| mobile | 390x844 | `/portfolio`, `/portfolio/a3`, `/portfolio/a3/case/dashboard-redesign` |
| mobile-small | 360x800 | `/portfolio`, `/portfolio/a3`, `/portfolio/a3/case/dashboard-redesign` |
| wide | 1920x1080, 2560x1440 | `/portfolio`, `/portfolio/a3`, `/portfolio/a3/case/dashboard-redesign` |

## Results

| Check | Result | Notes |
|---|---|---|
| Горизонтальный overflow | passed | После фикса все проверенные routes и viewports имеют `scrollWidth <= clientWidth`. |
| Touch targets | passed | Все `button` и `a` в проверке не меньше 44px по высоте и ширине. |
| Микротекст | passed | Текст меньше 10px не найден. |
| Screen reader heading | passed with note | Для H1 с переносом строки добавлен `aria-label`, чтобы текст не читался склеенно. |
| Flow navigation | passed | Главная ведет в компанию, компания ведет в кейсы, кейс возвращает к списку компании. |
| Mobile readability | passed with note | Статья читается, но hero занимает много первого экрана; это осознанный editorial direction. |
| Wide-screen grid | fixed | Основная колонка строк больше не растягивается на всю ширину больших мониторов. |
| Interface readability patterns | fixed | Compact-строки получили локальные labels для метаданных, desktop остался без лишнего визуального шума. |
| Layout guides | fixed | Header, hero, table header and row primary content now share one main vertical guide on desktop; compact rows no longer indent primary content behind an index column. |

## Wide-Screen Grid Review

Исходная широкая сетка была нерелевантна для больших экранов. На 1920px основная колонка строки растягивалась примерно до 1240px, а на 2560px почти до 1900px. Из-за этого взгляд разрывался между названием компании/кейса и метаданными справа: роль, период, итог и число кейсов ощущались как отдельная зона, а не как часть одной строки.

Правка:

- строки компаний и кейсов остались full-width по фону и разделителям;
- внутренние grid tracks теперь центрируются и имеют максимальную рабочую ширину;
- основная колонка на wide-экранах ограничена примерно 760px;
- hero и article layout тоже получили центрированную рабочую область, чтобы текст не разъезжался на 1920/2560px;
- compact/tablet mode теперь включается с 1100px, потому что на 1024px desktop-таблица уже слишком плотная.

Проверка после правки:

| Viewport | Result |
|---|---|
| 2560px | основная колонка 760px, horizontal overflow отсутствует |
| 1920px | основная колонка 760px, horizontal overflow отсутствует |
| 1280px | desktop-сетка остается рабочей, horizontal overflow отсутствует |
| 1024px | включается компактная сетка, horizontal overflow отсутствует |
| 390px / 360px | mobile-сетка без горизонтального скролла |

## Interface Readability Pattern Review

Проверялось, насколько быстро пользователь понимает структуру интерфейса без чтения всего текста подряд:

- **Иерархия:** первый взгляд должен попадать в компанию или название кейса, а не в метаданные.
- **Группировка:** роль, период, тип и итог должны считываться как свойства строки, а не как случайные строки текста.
- **Affordance:** строка должна выглядеть как выбираемый объект.
- **Compact mode:** после скрытия table header строка должна сохранять смысл без внешних заголовков.
- **Article scan:** страница кейса должна читаться через `Контекст -> Проблема -> Решение -> Результат`.

Что было найдено:

| Pattern | Before | Fix |
|---|---|---|
| Compact row labels | На tablet/mobile table header скрывался, а значения `Ведущий продуктовый дизайнер`, `2022—2024`, `3->` оставались без подписи. | Добавлены `data-label` и compact labels `Роль`, `Период`, `Кейсов`. |
| Company case labels | На странице компании значения `UX Research · Redesign` и `быстрее путь к действиям` читались без контекста. | Добавлены compact labels `Тип` и `Итог`. |
| Desktop density | Desktop-таблица уже имела header, поэтому дополнительные labels были бы визуальным шумом. | Labels показываются только в compact mode `<=1100px`. |
| Case H1 readability | На mobile H1 кейса был визуально сжат из-за editorial line-height. | Для mobile article H1 line-height поднят до `1.02`. |

Проверка после правки:

| Viewport | Result |
|---|---|
| Desktop | table header остается главным способом считывания метаданных; compact labels скрыты |
| Tablet | строки компаний и кейсов читаются как `label -> value` |
| Mobile | метаданные не выглядят случайными строками, horizontal overflow отсутствует |
| Case page mobile | H1 стал менее сжатым, статья сохраняет сканирование по разделам |

## Layout Guide Review

Проверка направляющих главного экрана показала, что до правки разные блоки начинались от разных внутренних сеток:

- header использовал двухколоночную сетку;
- hero использовал отдельную двухколоночную сетку;
- таблица компаний использовала пятиколоночную сетку;
- на tablet/mobile индекс компании занимал отдельную колонку, поэтому название компании начиналось правее hero.

Из-за этого экран выглядел собранным из нескольких независимых блоков: визуальный стиль был единый, но вертикальная направляющая прыгала.

Правка:

- введена общая desktop-сетка `--portfolio-grid-main`;
- header, hero, table header и строки компаний используют одну и ту же систему колонок;
- правые пункты header переведены из `flex` в grid и посажены на направляющие колонок `Роль / Период / Кейсов`;
- числовая статистика в hero удалена, чтобы первый экран не спорил с задачей главной страницы как оглавления компаний;
- основной контент на desktop начинается во второй колонке: brand, hero title, `Компания`, название компании;
- индекс остается отдельной первой колонкой только на desktop, где есть table reading pattern;
- на compact `<=1100px` строки переходят в одну колонку, чтобы название компании/кейса начиналось с той же левой направляющей, что header и hero;
- mobile padding управляется через `--portfolio-page-pad`, чтобы не расходились локальные отступы.

Проверка после правки:

| Viewport | Result |
|---|---|
| Desktop | `headerBrand`, `heroMain`, `tableMain`, `firstRowMain` выровнены по одной основной направляющей |
| Desktop 1280px | правые пункты header и table columns совпадают по `x`: `779 / 983 / 1127`; hero stats отсутствуют |
| Wide desktop | сетка центрируется, но внутренняя направляющая сохраняется |
| Tablet | header, hero и primary row content начинаются с одной левой направляющей |
| Mobile | header, hero и primary row content начинаются с одного `22px` inset |

## Issues Found And Fixed

| Severity | Issue | Fix |
|---|---|---|
| P1 | Breadcrumb и back link выглядели аккуратно, но были слишком низкими для touch-навигации. | Добавлены `min-height: 44px`, padding и inline-flex alignment. |
| P1 | Оглавление кейса на mobile/tablet имело ссылки высотой меньше комфортного touch target. | Добавлен `min-height: 44px` и вертикальное центрирование. |
| P1 | На странице кейса mobile появлялся горизонтальный overflow из-за `100vw`/padding и metrics strip. | `article/aside` переведены на auto width, длинные значения metrics получают перенос. |
| P2 | Metadata labels были 9px и плохо читались на плотных экранах. | Размеры table/facts/aside labels подняты до 10px. |
| P2 | H1 с `<br />` давал склеенный `textContent`. | Добавлены `aria-label` для home и case H1. |
| P2 | Ряды компаний/кейсов визуально понятны, но для assistive tech лучше иметь явное действие. | Добавлены `aria-label` на company/case row buttons. |
| P2 | На 1920/2560px широкая сетка разрывала связь между названием и метаданными. | Добавлена максимальная мера внутренних grid tracks и центрирование wide-layout. |
| P2 | В compact-режиме метаданные теряли смысл без table header. | Добавлены локальные labels для строк компаний и кейсов. |
| P2 | Header, hero and table rows used different grids, creating drifting vertical guides. | Introduced shared grid tracks and compact one-column row layout. |
| P2 | Header nav visually drifted from the three right-side guide lines on the home screen. | Header nav now uses the same right-side grid tracks; hero stats were removed. |

## UX Notes

- Главная сейчас хорошо работает как editorial index: пользователь сначала выбирает компанию, а не тонет в смешанном списке кейсов.
- Самый сильный экран по смыслу: страница компании. Она хорошо объясняет контекст и дает ровный переход к кейсам.
- Страница кейса читается как статья, но для production лучше добавить реальные изображения интерфейсов вместо схематичных CSS-preview.
- На mobile hero у главной и кейса занимает много высоты. Это красиво и близко к reference direction, но если цель быстро довести до кейсов, можно сократить вертикальные отступы на 360-390px.
- Число кейсов в строке компании визуально минималистичное. Для production можно сделать visible label `3 кейса ->`, если понадобится больше ясности без hover.
- Широкие мониторы лучше использовать как поле вокруг редакционной таблицы, а не растягивать саму таблицу до краев экрана.

## Home Layout Research Addendum

Дополнительное исследование главной страницы сохранено в `.lazyweb/design-improve/ivan-ignatov-home-layout-2026-06-14/report.html`.

Вывод: ощущение перегруза создается не количеством секций, а конфликтом режимов чтения. Header, hero, поясняющий абзац, table header и строки компаний одновременно претендуют на роль главного входа. Главный сценарий `выбрать компанию` появляется поздно: первая компания начинается примерно на `y=562` на desktop 1440px и `y=631` на mobile 390px.

Рекомендация для следующей итерации:

- сократить hero до идентификации и специализации;
- убрать служебный текст `Главная работает как оглавление...` из видимого интерфейса;
- ослабить или перенести с главной поля `Роль`, `Период`, `Кейсов`;
- сделать строки компаний главным объектом первого экрана;
- добавить тонкие сигналы содержимого компании: домен, 2-3 направления кейсов или микро-превью.

## Figma Make Card Placement Update

После сравнения с Figma Make главная страница переведена с табличного списка компаний на три крупные редакционные плитки.

Что изменено:

- убрана table header-логика `№ / Компания / Роль / Период / Кейсов` на главной;
- каждая компания стала самостоятельной вертикальной областью с тонкими разделителями, без радиусов, теней и вложенных карточек;
- верх плитки содержит индекс и домен компании, центр — крупное название и описание, низ — период, количество кейсов, роль и CTA;
- desktop использует 3 равные колонки, tablet/mobile складываются в один поток;
- CTA переведен из технического `->` в визуально чистую стрелку `→`.

Проверка после правки:

| Viewport | Result |
|---|---|
| 1440x1000 | 3 плитки по 480px, горизонтального overflow нет |
| 1920x1080 | 3 плитки по 640px, структура остается читаемой |
| 900x1100 | плитки складываются в один столбец |
| 390x900 | плитки складываются в один столбец, overflow нет |

Evidence screenshots:

- `siteportfolio/runs/2026-06-14/evidence/home-desktop.png`
- `siteportfolio/runs/2026-06-14/evidence/home-wide.png`
- `siteportfolio/runs/2026-06-14/evidence/home-tablet.png`
- `siteportfolio/runs/2026-06-14/evidence/home-mobile.png`

## Grid Alignment Update

После дополнительной правки плитки компаний подстроены под текущую рабочую сетку страницы.

Что изменено:

- добавлен общий `--portfolio-content-max: 1436px`;
- основная сетка расширена с `80px minmax(420px, 760px) 180px 120px 90px` до `80px minmax(420px, 820px) 200px 140px 100px`;
- header nav переведен на те же расширенные правые колонки;
- блок плиток больше не full-bleed: он центрируется в общей рабочей мере и держит внешний край сетки;
- на wide desktop плитки ограничены `1436px`, чтобы взгляд не разбегался по всей ширине монитора;
- на tablet/mobile плитки снова занимают весь поток экрана и сохраняют внутренние отступы контента.

Проверка после правки:

| Viewport | Grid result |
|---|---|
| 1440x1000 | контейнер плиток `x=48`, `w=1344`; 3 плитки по `447px`; overflow отсутствует |
| 1920x1080 | контейнер плиток `x=242`, `w=1436`; 3 плитки по `478px`; wide-расползания нет |
| 900x1100 | контейнер `w=900`, плитки в одну колонку |
| 390x900 | контейнер `w=390`, плитки в одну колонку |

Новые screenshots:

- `siteportfolio/runs/2026-06-14/evidence/home-grid-desktop.png`
- `siteportfolio/runs/2026-06-14/evidence/home-grid-wide.png`
- `siteportfolio/runs/2026-06-14/evidence/home-grid-tablet.png`
- `siteportfolio/runs/2026-06-14/evidence/home-grid-mobile.png`

## Unified Guide Fix

После проверки по screenshot выявлена проблема: hero, header и плитки формально были в одной общей мере, но визуально создавали несколько конкурирующих направляющих:

- hero начинался внутри вспомогательной левой колонки;
- блок плиток начинался по внешнему краю контейнера;
- текст внутри плиток начинался по третьей оси из-за внутреннего padding;
- боковые рамки контейнера и короткая линия footer внутри плиток выглядели как случайные обрезки.

Исправление:

- служебная левая колонка удалена из `--portfolio-grid-main`;
- `header`, `hero` и `portfolio-company-tiles` теперь начинаются по одной внешней оси;
- `--portfolio-content-max` снижен до `1332px`, чтобы плитки не расползались на широких экранах;
- боковые рамки контейнера плиток удалены;
- короткая внутренняя горизонтальная линия footer в плитке удалена;
- оставлены только функциональные линии: общий горизонтальный разделитель секций и вертикальные разделители между компаниями.

Проверка после фикса:

| Viewport | Alignment result |
|---|---|
| 1440x1000 | `headerX=54`, `heroX=54`, `cardsX=54`; overflow отсутствует |
| 1920x1080 | `headerX=294`, `heroX=294`, `cardsX=294`; рабочая мера не шире `1332px` |
| 390x900 | `headerX=22`, `heroX=22`; плитки в один поток без overflow |

Новые screenshots:

- `siteportfolio/runs/2026-06-14/evidence/home-unified-grid-desktop.png`
- `siteportfolio/runs/2026-06-14/evidence/home-unified-grid-wide.png`
- `siteportfolio/runs/2026-06-14/evidence/home-unified-grid-mobile.png`

## Expanded Content Grid Update

После проверки wide-состояния заголовок `Самолет` в третьей плитке выглядел слишком зажатым.

Исправление:

- `--portfolio-content-max` расширен с `1332px` до `1500px`;
- первая колонка общей сетки расширена с `820px` до `988px`;
- плитки на wide desktop стали `500px` вместо `444px`;
- `header`, `hero` и плитки продолжают начинаться по одной оси.

Проверка после расширения:

| Viewport | Result |
|---|---|
| 1440x1000 | доступная ширина `1344px`, плитки по `448px`, overflow отсутствует |
| 1920x1080 | рабочая мера `1500px`, плитки по `500px`, `Самолет` влезает спокойнее |
| 2560x1200 | рабочая мера остается `1500px`, экран не расползается |
| 390x900 | mobile flow не изменился, overflow отсутствует |

Новый screenshot:

- `siteportfolio/runs/2026-06-14/evidence/home-expanded-grid-wide.png`

## Footer Line Cleanup

После расширения сетки низ главной давал две конкурирующие горизонтальные линии: нижнюю границу блока карточек и верхнюю границу футера.

Исправление:

- нижняя граница `portfolio-company-tiles` удалена;
- финальную линию страницы теперь дает только `portfolio-footer`;
- вертикальные разделители между компаниями сохранены.

Проверка:

| Check | Result |
|---|---|
| `portfolio-company-tiles` border-bottom | `0px` |
| `portfolio-footer` border-top | `1px` |
| 1920x1080 overflow | отсутствует |

Новый screenshot:

- `siteportfolio/runs/2026-06-14/evidence/home-footer-line-wide.png`

## Footer Tightening

После удаления нижней линии карточек между блоком компаний и футером осталось лишнее пустое пространство.

Исправление:

- `portfolio-footer` margin-top изменен с `48px` на `0`;
- линия футера теперь начинается сразу после блока карточек.

Проверка:

| Check | Result |
|---|---|
| Cards bottom | `950px` |
| Footer top | `950px` |
| Gap | `0px` |
| 1920x1080 overflow | отсутствует |

Новый screenshot:

- `siteportfolio/runs/2026-06-14/evidence/home-footer-tight-wide.png`

## Short Hero Identification

Hero сжат до короткой идентификации: кто автор и в каких продуктах он силен.

Исправление:

- заголовок `Компании / и кейсы` заменен на `Продуктовый / дизайнер`;
- служебный текст про механику главной страницы удален из интерфейса;
- supporting copy теперь описывает специализацию: B2B-платежи, сервисные кабинеты, подписки и proptech-инструменты;
- вертикальные отступы главного hero уменьшены;
- mobile-размер H1 уменьшен, чтобы слово `Продуктовый` не ломалось внутри слова.

Проверка:

| Viewport | Hero result |
|---|---|
| 1440x1000 | hero height `346px`, cards top `458px`, служебной фразы нет |
| 390x900 | hero height `404px`, cards top `545px`, overflow отсутствует |

Новые screenshots:

- `siteportfolio/runs/2026-06-14/evidence/home-short-identification-desktop.png`
- `siteportfolio/runs/2026-06-14/evidence/home-short-identification-mobile.png`

## Bottom Stack Alignment

Блок компаний и футер прижаты к нижней части главного экрана.

Исправление:

- home получил отдельный класс `portfolio-home-shell`;
- главная переведена в `display: flex; flex-direction: column`;
- для `portfolio-company-tiles` задан `margin-top: auto`, поэтому свободное пространство уходит между hero и карточками;
- на mobile, где контент выше viewport, страница остается обычной прокручиваемой колонкой.

Проверка:

| Viewport | Result |
|---|---|
| 1440x1000 | footer bottom `1000px`, viewport bottom `1000px` |
| 1920x1080 | footer bottom `1080px`, viewport bottom `1080px`, gap hero/cards `82px` |
| 1440x1200 | footer bottom `1200px`, viewport bottom `1200px`, gap hero/cards `202px` |
| 390x900 | контент длиннее viewport, обычный scroll, overflow-x отсутствует |

Новый screenshot:

- `siteportfolio/runs/2026-06-14/evidence/home-bottom-stack-wide.png`

## Hero-To-Cards Line Alignment

После прижатия блока компаний к низу свободное пространство оказалось между нижней линией hero и карточками. Это создавало отдельную горизонтальную линию, не связанную с началом блока компаний.

Исправление:

- `margin-top: auto` перенесен с `portfolio-company-tiles` на рост самого hero-блока;
- `portfolio-home-shell .portfolio-hero` получил `flex: 1 0 auto`;
- теперь нижняя линия hero является верхней границей блока компаний.

Проверка:

| Viewport | Gap hero/cards | Footer bottom |
|---|---:|---:|
| 1440x1000 | `0px` | `1000px` |
| 1920x1080 | `0px` | `1080px` |
| 1440x1200 | `0px` | `1200px` |
| 390x900 | `0px` | естественный scroll |

Новый screenshot:

- `siteportfolio/runs/2026-06-14/evidence/home-hero-to-cards-line-wide.png`

## Home Header Height Match

Шапка главной приведена к высоте верхней полосы внутренних страниц.

Исправление:

- вертикальные отступы `portfolio-header` уменьшены с `32px / 24px` до `14px / 13px`;
- структура header и общая сетка не менялись.

Проверка:

| Page | Top bar height |
|---|---:|
| `/portfolio` | `62px` |
| `/portfolio/a3` | `61px` |

Дополнительно:

- gap между hero и карточками остался `0px`;
- футер на главной остался прижат к нижней части viewport;
- overflow-x отсутствует.

Новый screenshot:

- `siteportfolio/runs/2026-06-14/evidence/home-compact-header-desktop.png`

## Unified Header Type And Height

Шапка главной приведена к единой типографике и высоте с верхними полосами внутренних страниц.

Исправление:

- `portfolio-header` теперь имеет `min-height: 61px`;
- вертикальные padding заменены на центрирование по высоте;
- имя `Иван Игнатов` переведено из крупного serif в тот же mono-навигационный стиль, что и пункты справа;
- имя и nav items используют `10px`, `letter-spacing: 0.1em`, uppercase-ритм.

Проверка:

| Element | Height / font |
|---|---|
| Home header | `61px` |
| Company breadcrumb | `61px` |
| Header name | `10px`, mono |
| Header nav item | `10px`, mono |
| Breadcrumb | `10px`, mono |

Новый screenshot:

- `siteportfolio/runs/2026-06-14/evidence/home-unified-header-type-desktop.png`

## Header Nav And Company Naming Update

Шапка и названия компаний уточнены после визуальной проверки.

Исправление:

- из шапки удален пункт `Москва`;
- правые пункты шапки сокращены до двух и начинаются от одной направляющей;
- расстояние между пунктами справа сокращено через `grid-template-columns: repeat(2, max-content)` и `gap: 42px`;
- `Ростелеком` переименован в `РТК`;
- `portfolio-hero` получил `padding-bottom: 72px`.

Проверка:

| Check | Result |
|---|---|
| Header nav items | `2` |
| `Москва` in body text | отсутствует |
| Company titles | `А3`, `РТК`, `Самолет` |
| Hero padding-bottom | `72px` |
| Overflow-x | отсутствует |

Новый screenshot:

- `siteportfolio/runs/2026-06-14/evidence/home-header-nav-rtk-hero-padding-desktop.png`

## Current Home UX/UI Metrics Audit

Дата проверки: 2026-06-14. Экран: `/portfolio`.

### Quantitative Metrics

| Viewport | Header | Hero | Cards top | Cards block | Footer | Visible cards | Scroll | Overflow-x |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| 1440x1000 | `61px` | `399px` | `460px` | `460px` | bottom aligned | `3/3` | no | no |
| 1920x1080 | `61px` | `479px` | `540px` | `460px` | bottom aligned | `3/3` | no | no |
| 1440x1200 | `61px` | `599px` | `660px` | `460px` | bottom aligned | `3/3` | no | no |
| 900x1100 | `61px` | `390px` | `451px` | `1077px` | below fold | `2/3` | yes | no |
| 390x900 | `61px` | `428px` | `489px` | `1083px` | below fold | `2/3` | yes | no |

### What Works

- На desktop/wide главный экран собирается в одну композицию: header, hero, cards и footer помещаются в viewport без скролла.
- Нижняя линия hero совпадает с началом карточек: `gapHeroToTiles = 0px`.
- Footer прижат к нижней границе viewport на desktop/wide/tall.
- Горизонтального overflow нет на всех проверенных ширинах.
- Карточки компаний читаются как три равноправных входа: `А3`, `РТК`, `Самолет`.
- Wide-экран ограничен рабочей мерой, поэтому карточки не расползаются на всю ширину монитора.

### UX/UI Risks

| Priority | Issue | Evidence | Impact |
|---|---|---|---|
| P1 | На mobile слово `Продуктовый` ломается внутри слова. | Screenshot `ux-audit-home-mobile.png` | Снижает ощущение аккуратности и доверия к визуальному уровню. |
| P1 | Mobile hero занимает `428px` из `900px`, карточки начинаются на `489px`. | Metrics | Пользователь видит только начало списка компаний; входы в кейсы появляются поздновато. |
| P2 | На tall desktop hero растягивается до `599px`. | Metrics 1440x1200 | Выглядит эстетично, но может восприниматься как избыточная пустота между шапкой и карточками. |
| P2 | Right nav на mobile остается в одну строку и занимает почти всю ширину. | Screenshot `ux-audit-home-mobile.png` | При добавлении третьего пункта или длинного текста снова появится риск тесноты. |
| P2 | CTA `Смотреть кейсы` есть только внизу карточек. | Visual review | На desktop ок, но на mobile путь к действию требует прокрутки внутри каждой карточки. |

### Readability Check

| Element | Desktop | Mobile | Verdict |
|---|---|---|---|
| Header text | `12px`, readable | `12px`, readable | good |
| Hero title | `112px`, strong | `58.5px`, word break issue | needs fix |
| Hero copy | `15px`, readable | `15px`, readable | good |
| Tile title | `80px`, strong | `54.6px`, readable | good |
| Tile descriptions | readable but dense | readable | acceptable |

### Recommendations

1. Исправить mobile hero wrapping: дать заголовку другой break на mobile, например `Продуктовый` / `дизайнер` без разрыва внутри слова, или снизить mobile H1 до диапазона, где слово помещается.
2. Для mobile уменьшить hero height примерно на `48–72px`: снизить верхний/нижний padding или не растягивать hero через flex на узких экранах.
3. Ограничить flex-растяжение hero только для desktop/tablet landscape, а на mobile оставить естественную высоту контента.
4. Добавить hover/focus-visible состояние карточек с чуть более явным affordance, не превращая их в обычные cards.
5. На mobile можно поднять CTA ближе к названию или продублировать стрелку рядом с названием, чтобы действие считывалось раньше.

Evidence:

- `siteportfolio/runs/2026-06-14/evidence/ux-audit-home-desktop.png`
- `siteportfolio/runs/2026-06-14/evidence/ux-audit-home-wide.png`
- `siteportfolio/runs/2026-06-14/evidence/ux-audit-home-tall.png`
- `siteportfolio/runs/2026-06-14/evidence/ux-audit-home-tablet.png`
- `siteportfolio/runs/2026-06-14/evidence/ux-audit-home-mobile.png`
- `siteportfolio/runs/2026-06-14/evidence/ux-audit-home-metrics.json`

## Mobile Hero Research And Fix

Проблема: H1 `Продуктовый дизайнер` на mobile ломался внутри слова `Продуктовый`. Это ухудшало первое впечатление: роль понятна, но визуально экран выглядел как неадаптированный desktop.

Мини-исследование вариантов:

| Вариант | Плюсы | Минусы | Решение |
|---|---|---|---|
| `Продуктовый дизайнер` | привычная должность | длинное первое слово, риск некрасивого переноса | rejected |
| `Дизайнер продуктов` | компактно | звучит слишком широко и менее точно | rejected |
| `Дизайнер B2B-продуктов` | доменно точнее | сужает опыт, теряет B2C/proptech | rejected |
| `Дизайнер сложных продуктов` | короткое первое слово, сохраняет senior-позиционирование, хорошо переносится | чуть менее стандартная должность | applied |

Исправление:

- H1 заменен на `Дизайнер / сложных продуктов`;
- supporting copy переписан с `Силен в...` на более деятельное `Проектирую...`;
- на mobile hero больше не растягивается через flex;
- mobile hero padding уменьшен до `42px / 44px`;
- mobile H1 диапазон изменен на `clamp(44px, 13vw, 60px)`;
- mobile header nav получил `gap: 24px`, чтобы два пункта оставались в одной строке на `360px`.

Проверка после правки:

| Viewport | Header | Hero | Cards top | H1 | Nav | Overflow-x |
|---|---:|---:|---:|---|---|---|
| 390x900 | `61px` | `365px` | `426px` | `Дизайнер / сложных продуктов` | one line | no |
| 360x800 | `61px` | `380px` | `441px` | `Дизайнер / сложных продуктов` | one line | no |
| 1440x1000 | `61px` | `473px` | `534px` | `Дизайнер / сложных продуктов` | one line | no |

Новые screenshots:

- `siteportfolio/runs/2026-06-14/evidence/home-mobile-title-research-fix-mobile.png`
- `siteportfolio/runs/2026-06-14/evidence/home-mobile-title-research-fix-mobile-small.png`
- `siteportfolio/runs/2026-06-14/evidence/home-mobile-title-research-fix-desktop.png`
- `siteportfolio/runs/2026-06-14/evidence/home-mobile-title-research-fix-metrics.json`

## Hero Copy Guide Fix

После замены H1 supporting copy визуально оставался на отдельной правой направляющей. Это снова создавало разнобой: `Портфолио`, H1, описание и карточки начинались с разных осей.

Исправление:

- только на home `portfolio-hero-copy` перенесен в первую колонку hero;
- `portfolio-home-shell .portfolio-hero > div:last-child` теперь `grid-column: 1`;
- copy получил `justify-self: start` и `max-width: 620px`;
- внутренние страницы сохранили двухколоночную hero-композицию.

Проверка:

| Viewport | H1 X | Copy X | Cards X | Gap H1/Copy |
|---|---:|---:|---:|---:|
| 1440x1000 | `48px` | `48px` | `48px` | `0px` |
| 1920x1080 | `210px` | `210px` | `210px` | `0px` |
| 390x900 | `22px` | `22px` | `0px` container / `22px` content | `0px` |

Новые screenshots:

- `siteportfolio/runs/2026-06-14/evidence/home-copy-guide-fix-desktop.png`
- `siteportfolio/runs/2026-06-14/evidence/home-copy-guide-fix-wide.png`
- `siteportfolio/runs/2026-06-14/evidence/home-copy-guide-fix-mobile.png`

## Compact Intro Hero Experiment

По запросу проверена версия без большого hero-блока: hero сохранен как компактная intro-полоса, чтобы не превращать главный экран в сухой список компаний.

Исправление:

- supporting copy на desktop возвращен вправо;
- home H1 уменьшен до `clamp(54px, 7vw, 88px)`;
- desktop hero padding изменен на `42px / 42px`;
- mobile hero остается одноосевым: copy под H1;
- mobile hero padding изменен на `36px / 38px`.

Проверка:

| Viewport | Hero | Cards top | Copy position | Overflow-x |
|---|---:|---:|---|---|
| 1440x1000 | `399px` | `460px` | right column | no |
| 1920x1080 | `479px` | `540px` | right column | no |
| 390x900 | `362px` | `423px` | under H1 | no |
| 360x800 | `388px` | `449px` | under H1 | no |

Новые screenshots:

- `siteportfolio/runs/2026-06-14/evidence/home-compact-intro-desktop.png`
- `siteportfolio/runs/2026-06-14/evidence/home-compact-intro-wide.png`
- `siteportfolio/runs/2026-06-14/evidence/home-compact-intro-mobile.png`
- `siteportfolio/runs/2026-06-14/evidence/home-compact-intro-mobile-small.png`
- `siteportfolio/runs/2026-06-14/evidence/home-compact-intro-metrics.json`

## Right Guide Alignment Fix

После проверки по screenshot справа были три близкие, но разные направляющие: header nav, hero-copy и внутренний контент третьей карточки.

Исправление:

- добавлена вычисляемая мера `--portfolio-measure`;
- header nav теперь начинается от линии `2/3 сетки карточек + внутренний padding карточки`;
- home hero-copy использует ту же вычисляемую линию;
- compact/tablet/mobile сбрасывают вычисляемый отступ и остаются одноосевыми.

Проверка:

| Viewport | Header nav X | Hero copy X | Third card content X | Delta |
|---|---:|---:|---:|---:|
| 1440x1000 | `984px` | `984px` | `984px` | `0px` |
| 1920x1080 | `1250px` | `1250px` | `1250px` | `0px` |
| 390x900 | `22px` | `22px` | `22px` | `0px` |

Новые screenshots:

- `siteportfolio/runs/2026-06-14/evidence/home-right-guide-align-desktop.png`
- `siteportfolio/runs/2026-06-14/evidence/home-right-guide-align-wide.png`
- `siteportfolio/runs/2026-06-14/evidence/home-right-guide-align-mobile.png`
- `siteportfolio/runs/2026-06-14/evidence/home-right-guide-align-metrics.json`

## Verification

```text
yarn typecheck: passed
yarn build: passed
Browser responsive audit: passed
```

Screenshot file save from Browser runtime was blocked by filesystem permission (`EPERM`), so evidence is recorded as browser DOM/layout metrics in this document.

## Header And Hero Baseline Fix

Проблема была не в отдельных текстах, а в разных правилах выравнивания:

- header создавал две implicit grid-строки: имя попадало в верхнюю строку, nav — в нижнюю;
- home hero-copy наследовал правую grid-area и одновременно получал вычисляемый `left`, поэтому направляющая считалась дважды;
- H1 и описание не имели общей нижней линии, потому что описание не было привязано к той же нижней границе hero.

Исправление:

- header зафиксирован в одну строку `61px`, имя и nav поставлены в `grid-row: 1`;
- desktop hero-copy привязан к полной сетке `grid-column: 1 / -1` и смещается от общей content-measure, а не от правой grid-area;
- на `<=1100px` absolute-позиционирование и desktop-width сбрасываются;
- на mobile скрыт второй пункт nav, потому что два пункта вместе с именем не помещаются в одну горизонтальную строку без переноса.

Контрольные координаты:

| Viewport | Header name centerY | Header nav centerY | H1 bottom | Hero copy bottom | Right guide X | Overflow-x |
|---|---:|---:|---:|---:|---:|---:|
| 1440x900 | `30.5px` | `30.5px` | `317px` | `317px` | `984px` | `0px` |
| 1920x1080 | `30.5px` | `30.5px` | `497px` | `497px` | `1250px` | `0px` |
| 390x844 | `30.5px` | `30.5px` | mobile stack | mobile stack | `22px` | `0px` |

Проверка:

```text
yarn typecheck: passed
yarn build: passed
Browser DOM/layout metrics: passed
```

## Detail Page Left Navigation Grid

На детальной странице блоки жили в разных сетках: metrics-strip был full-bleed, содержание стояло справа отдельной колонкой, а основной текст начинался по третьей логике. Из-за этого страница выглядела разбросанной относительно главной и разводящих страниц.

Исправление:

- metrics-strip ограничен общей шириной `--portfolio-measure`;
- article layout переведен на три равные колонки, как карточки;
- навигация `Содержание` перенесена в левую колонку;
- основной материал занимает вторую и третью колонки;
- на мобильном layout остается линейным stack без горизонтального overflow.

Контрольные координаты:

| Viewport | Metrics X / W | Left nav X | Article X | Section text X | Overflow-x |
|---|---:|---:|---:|---:|---:|
| 1440x900 | `48px / 1344px` | `48px` | `496px` | `536px` | `0px` |
| 1920x1080 | `210px / 1500px` | `210px` | `710px` | `750px` | `0px` |
| 390x844 | `0px / 390px` | `0px` | `0px` | `22px` | `0px` |

Проверка:

```text
yarn typecheck: passed
yarn build: passed
Browser DOM/layout metrics: passed
```

## Company Routing Page Grid Fix

Разводящие страницы компаний использовали отдельную узкую сетку `--portfolio-grid-case`, из-за чего список кейсов начинался не по общей направляющей главной страницы и hero-блока компании.

Исправление:

- `--portfolio-grid-case` теперь считается от общей `--portfolio-measure`;
- список кейсов сохраняет свои служебные колонки (`№`, `Кейс`, `Тип`, `Итог`), но занимает ту же content-width, что главная сетка;
- на широких экранах сетка центрируется по max-width `1500px`, а не растягивается на весь viewport.

Контрольные координаты:

| Viewport | Company hero X | Case list X | Case list content width | Overflow-x |
|---|---:|---:|---:|---:|
| 1440x900 | `48px` | `48px` | `1344px` | `0px` |
| 1920x1080 | `210px` | `210px` | `1500px` | `0px` |
| 390x844 | `22px` | `22px` | mobile stack | `0px` |

Проверка:

```text
yarn typecheck: passed
yarn build: passed
Browser DOM/layout metrics: passed
```

## Inner Header Grid Fix

Шапка внутренних страниц (`portfolio-breadcrumb`) оставалась на старом фиксированном padding `48px`, поэтому на широких экранах она не совпадала с главной шапкой и сеткой hero/list.

Исправление:

- `portfolio-breadcrumb` теперь использует тот же расчет края: `calc((100vw - var(--portfolio-measure)) / 2)`;
- высота внутренней шапки приведена к `61px`, как у главной;
- у breadcrumb-button убран отрицательный margin, который смещал box кнопки на 10px левее направляющей;
- на mobile действует тот же `22px` край через responsive override.

Контрольные координаты:

| Viewport | Home header X | Inner header X | Company hero X | Case list X | Overflow-x |
|---|---:|---:|---:|---:|---:|
| 1440x900 | `48px` | `48px` | `48px` | `48px` | `0px` |
| 1920x1080 | `210px` | `210px` | `210px` | `210px` | `0px` |
| 390x844 | n/a | `22px` | `22px` | `22px` | `0px` |

Проверка:

```text
yarn typecheck: passed
yarn build: passed
Browser DOM/layout metrics: passed
```

## Company Case Tiles Pattern

Страница компании раньше переключалась с плиточного паттерна главной на табличный список кейсов. Это создавало лишний визуальный режим между уровнями `главная -> компания -> кейс`.

Исправление:

- табличная строка `№ / Кейс / Тип / Итог` убрана со страницы компании;
- кейсы переведены в крупные плитки по паттерну главной страницы;
- сохранены те же content-width, вертикальные линии, border rhythm, hover и CTA;
- заголовок кейса уменьшен относительно названия компании, чтобы длинные названия не ломали плитку;
- на tablet/mobile плитки кейсов складываются в одну колонку по тем же правилам, что и компании.

Контрольные координаты:

| Viewport | Company hero X | Case tiles X | Case tiles width | First tile width | Overflow-x |
|---|---:|---:|---:|---:|---:|
| 1440x900 | `48px` | `48px` | `1344px` | `448px` | `0px` |
| 1920x1080 | `210px` | `210px` | `1500px` | `500px` | `0px` |
| 390x844 | `22px` | container `0px` / content `22px` | mobile stack | `390px` | `0px` |

Проверка:

```text
yarn typecheck: passed
yarn build: passed
Browser DOM/layout metrics: passed
```

## Company Bottom Alignment Fix

После перевода кейсов в плитки страница компании получила тот же принцип вертикального поведения, что главная: если viewport выше контента, свободное место забирает hero, а блок кейсов с footer прижимается к низу экрана.

Исправление:

- добавлен shell-класс `portfolio-company-shell`;
- страница компании теперь `display: flex; flex-direction: column`;
- `portfolio-company-hero` получил `flex: 1 0 auto`;
- плитки кейсов и footer остаются единым нижним блоком.

Контрольные координаты:

| Viewport | Hero bottom | Case tiles top | Footer bottom | Viewport bottom | Delta |
|---|---:|---:|---:|---:|---:|
| 1920x1080 А3 | `500.4px` | `500.4px` | `1080px` | `1080px` | `0px` |
| 1920x1080 Самолет | `540px` | `540px` | `1080px` | `1080px` | `0px` |
| 1440x900 А3 | content taller than viewport | scroll | `941.1px` | `900px` | natural scroll |

Проверка:

```text
yarn typecheck: passed
yarn build: passed
Browser DOM/layout metrics: passed
```

## Company Hero Right Guide Fix

На разводящих страницах правый текст hero стоял по grid-column `2 / -1`, а плитки кейсов ниже начинались от внутреннего padding третьей карточки. Из-за этого правая силовая линия была смещена относительно паттерна главной.

Исправление:

- правый блок `portfolio-company-hero` на desktop привязан к линии `2/3 общей сетки + 40px`;
- оба hero-блока компании явно поставлены в одну `grid-row: 1`, чтобы выравнивание по нижней линии не распадалось;
- на `<=1100px` desktop-формула сбрасывается и страница возвращается в одноосевой stack.

Контрольные координаты:

| Viewport | Hero copy X | Third tile content X | H1 bottom | Hero copy bottom | Overflow-x |
|---|---:|---:|---:|---:|---:|
| 1440x900 | `984px` | `984px` | `321.8px` | `321.8px` | `0px` |
| 1920x1080 | `1250px` | `1250px` | `475px` | `475px` | `0px` |
| 390x844 | `22px` | `22px` | mobile stack | mobile stack | `0px` |

Проверка:

```text
yarn typecheck: passed
yarn build: passed
Browser DOM/layout metrics: passed
```

## Header Height Match Fix

Главная шапка имела реальную высоту `62px`, а внутренняя breadcrumb-шапка — `61px`. Из-за одного пикселя border/grid визуально появлялось ощущение разной высоты.

Исправление:

- `portfolio-breadcrumb` приведен к `min-height: 62px`;
- вертикальный центр первого элемента breadcrumb совпадает с центром имени в главной шапке.

Контрольные координаты:

| Viewport | Home header height | Inner header height | Home text centerY | Inner text centerY | Overflow-x |
|---|---:|---:|---:|---:|---:|
| 1440x900 | `62px` | `62px` | `30.5px` | `30.5px` | `0px` |
| 390x844 | `62px` | `62px` | `30.5px` | `30.5px` | `0px` |

Проверка:

```text
yarn typecheck: passed
yarn build: passed
Browser DOM/layout metrics: passed
```

## Shared Left Guide Token

Левая силовая линия была смешана: часть элементов начиналась от внешнего края content-width, а плитки — от внутреннего padding карточки. Из-за этого главная и разводящие страницы выглядели близко, но не идеально чисто.

Исправление:

- добавлен токен `--portfolio-left-guide-offset: 40px`;
- header, breadcrumb и hero на главной/разводящих страницах используют тот же внутренний content-edge, что и плитки;
- на `<=1100px` offset сбрасывается в `0px`, потому что мобильные/full-width плитки уже имеют padding страницы.

Контрольные координаты:

| Viewport | Home header/H1/tile X | Company header/H1/tile X | Right tile content X | Overflow-x |
|---|---:|---:|---:|---:|
| 1440x900 | `88px` | `88px` | `984px` | `0px` |
| 1920x1080 | `250px` | `250px` | `1250px` | `0px` |
| 390x844 | `22px` | `22px` | `22px` | `0px` |

Проверка:

```text
yarn typecheck: passed
yarn build: passed
Browser DOM/layout metrics: passed
```

## Detail Page Grid Alignment

Детальная страница кейса использовала отдельную article-сетку (`820px + sidebar`) и выпадала из общей системы главной и разводящих страниц: H1, summary и основной текст начинались не по общей левой направляющей.

Исправление:

- `portfolio-article-hero` переведен на `--portfolio-grid-main`;
- H1 и summary используют общий `--portfolio-left-guide-offset`;
- facts-блок справа привязан к той же правой силовой линии, что третья карточка;
- основной article body переведен на общую content-width и левую направляющую;
- aside и article поставлены в одну grid-row на desktop;
- на tablet/mobile desktop-grid сбрасывается в одноосевой stack.

Контрольные координаты:

| Viewport | Header X | Article H1 X | Section text X | Facts X | Overflow-x |
|---|---:|---:|---:|---:|---:|
| 1440x900 | `88px` | `88px` | `88px` | `984px` | `0px` |
| 1920x1080 | `250px` | `250px` | `250px` | `1250px` | `0px` |
| 390x844 | `22px` | `22px` | `22px` | `22px` | `0px` |

Проверка:

```text
yarn typecheck: passed
yarn build: passed
Browser DOM/layout metrics: passed
```
