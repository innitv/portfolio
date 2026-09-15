# Карта компонентов — где что лежит

Снято по `src/` 15 сентября 2026: 16 модулей, 105 блоков в CSS, 35 точек приёмки.
Карта отвечает на один вопрос — **куда идти за правкой**. Номера строк —
снимок этой даты: они сдвигаются, имена блоков нет. Значения и их тиеры —
в [`INVENTORY.md`](INVENTORY.md) и `design/tokens/portfolio/`.

## 1. Дерево: что кого включает

```
main.tsx
└── PortfolioRoute ................ маршруты, движения переходов, история, мета адреса
    ├── PortfolioArchiveView ...... главная и синий экран компании
    │   ├── ArchiveStripe ......... полоса Archive
    │   │   └── StripeRaster ...... живой пиксельный растр на WebGL
    │   └── ArchiveSheet .......... синий экран компании: имя, вкладки, кейсы
    ├── ArchiveSheet .............. тот же лист отдельно: приезд с кейса на компанию
    ├── PortfolioCaseView ......... страница кейса: шаблон и лонгрид
    │   └── useSmoothScroll ....... догоняющая прокрутка (Lenis)
    └── SheetCurtain .............. занавес между экранами
```

`ArchiveSheet` стоит в дереве дважды, и это не ошибка: обычно лист рендерит
`PortfolioArchiveView`, но при приезде с кейса маршрут показывает его сам —
только маршрут знает, пришёл человек с главной или по ссылке.

Данные отдельно от вида: `portfolio.data.ts` (тексты и структура кейсов),
`portfolio-archive.model.ts` (модель синего экрана) и `portfolio-meta.ts`
(заголовки, описания и карточка ссылки) не знают о React-дереве.

## 2. Модули

| Файл | Строк | Что делает | Ключевое |
|---|---|---|---|
| `views/portfolio.data.ts` | 3009 | **все тексты и структура кейсов** | правка текста — только сюда |
| `views/PortfolioCaseView.tsx` | 1645 | страница кейса: каркас шаблона, лонгрид, слайдеры | `frameSections`, `TEMPLATE_ROLES`, `longread` |
| `views/PortfolioRoute.tsx` | 515 | маршруты и движение пары экранов | `moveFor`, `scrollRestoration: manual` |
| `views/PortfolioArchiveView.tsx` | 354 | главная: экран, полоса, ряд имён | управляемый вид, состояние приходит снаружи |
| `views/portfolio-archive.model.ts` | 148 | модель синего экрана компании | `WORDMARK`, `archiveCompanies` |
| `views/portfolio-meta.ts` | 136 | заголовок, описание и канонический адрес экрана | `metaForScreen`, `applyScreenMeta`, `SITE_ORIGIN` |
| `views/portfolio-images.generated.ts` | 82 | манифест кадров (ширины webp + признак `avif`) | **сгенерирован, руками не правится** |
| `components/portfolio/archive/archive-sheet.tsx` | 572 | синий экран: вкладки, кейсы, величины | `onOpened` отдаёт экран маршруту |
| `components/portfolio/archive/stripe-raster.tsx` | 242 | заливка полосы: WebGL-растр | цвета числами — GLSL не видит CSS-переменных |
| `components/portfolio/archive/sheet-curtain.tsx` | 152 | занавес перехода | ключ по направлению, иначе движение не перезапустится |
| `components/portfolio/archive/archive-stripe.tsx` | 33 | полоса Archive | заезда болида нет с 14.09.2026 |
| `components/portfolio/motion.ts` | 71 | значения движения для framer-motion | сверяется с CSS в `tokens:check` |
| `components/portfolio/use-smooth-scroll.ts` | 75 | прокрутка страницы кейса на Lenis | на тач-экранах перехват выключен |
| `main.tsx` | 31 | точка входа, `LazyMotion` | набор `domAnimation` + `strict`, поэтому по проекту `m.*` |
| `views/*.stories.tsx` | 214 / 392 | витрины главной и страницы кейса | play-функции идут как тесты |

**Инструменты (`tools/`)**

| Файл | Строк | Что делает | Запуск |
|---|---|---|---|
| `prerender-portfolio.mjs` | 183 | снимает готовый HTML каждого адреса настоящим браузером | `yarn prerender` (входит в `yarn build`-цепочки `deploy` и `qa`) |
| `deploy-portfolio-regru.mjs` | 159 | выгрузка на reg.ru через `curl` по файлу | `yarn deploy`, `yarn deploy:dry-run` |
| `build-portfolio-avif.py` | 149 | AVIF рядом с каждым webp + перегенерация манифеста кадров | `yarn images` |
| `upload-portfolio-ftp.py` | 114 | выгрузка одним FTP-соединением, только изменившееся | ⚠️ собственный докстринг зовёт `yarn upload`, такого скрипта в `package.json` нет — запускать `python tools/upload-portfolio-ftp.py` |

## 3. Блоки главной — `pa-*` (37 классов, `portfolio-archive.css`)

| Блок | Класс | Строка |
|---|---|---|
| Корень и экран | `pa-root`, `pa-screen` | 186, 210 |
| Шапка: подпись и контакты | `pa-top`, `pa-contacts`, `pa-contact` | 219–239 |
| Имя PRODUCT и полоса Archive | `pa-title`, `pa-word`, `pa-stripe`, `pa-silk`, `pa-cursive` | 289–402 |
| Ряд компаний | `pa-works`, `pa-works-label`, `pa-row`, `pa-cell`, `pa-name`, `pa-meta`, `pa-sep` | 427–489 |
| Служебная строка цвета | `pa-spec` | 525 |
| Синий экран компании | `pa-sheet`, `pa-sheet-plane`, `pa-sheet-inner`, `pa-back`, `pa-huge`, `pa-sub` | 566–676 |
| Список кейсов и вкладки | `pa-cases`, `pa-case`, `pa-case-index`, `pa-case-title`, `pa-case-impact`, `pa-tabs`, `pa-tab`, `pa-cases-empty`, `pa-cases-block`, `pa-cases-layer` | 693–1013 |
| Величины компании | `pa-facts`, `pa-fact-value`, `pa-fact-caption` | 784–797 |

`pa-silk` — полотно WebGL-растра под словом «Archive» (`stripe-raster.tsx`).
`pa-spec` — строка `#044AB3 · контраст к белому 7,97 : 1 · основной цвет
системы` внизу главной.

В разметке есть ещё `pa-sheet-head` (`archive-sheet.tsx`) — обёртка кнопки
возврата **без собственного правила в CSS**; в счёт классов она не входит.

## 4. Блоки страницы кейса — `pc-*` (68 классов, `portfolio-case.css`)

| Группа | Классы | Строки |
|---|---|---|
| Каркас | `pc-root`, `pc-screen`, `pc-body`, `pc-flow`, `pc-section` | 385–654 |
| Шапка | `pc-top`, `pc-back`, `pc-home`, `pc-head`, `pc-title`, `pc-lede` | 415–529 |
| Текст раздела | `pc-lead`, `pc-part`, `pc-kicker`, `pc-section-text` | 794–892 |
| Нумерованный список | `pc-items`, `pc-item`, `pc-item-num`, `pc-item-text` | 971–1032 |
| Показы и слайдер | `pc-shots`, `pc-shot`, `pc-shot-frame`, `pc-shot-slider`, `pc-shot-track`, `pc-shot-slide`, `pc-shot-arrow`, `pc-shot-dots`, `pc-shot-dot` | 768–2313 |
| Блок величин | `pc-figures`, `pc-figures-caption`, `pc-figures-plate`, `pc-figures-row`, `pc-figure`, `pc-figure-value`, `pc-figure-unit`, `pc-figure-label`, `pc-figure-note` | 1225–1356 |
| Схема пути | `pc-path`, `pc-path-plate`, `pc-path-entry`, `pc-path-tracks`, `pc-path-track`, `pc-path-step`, `pc-path-caption` | 1420–1567 |
| Карточки гипотез | `pc-cards`, `pc-cards-rule`, `pc-card`, `pc-card-title`, `pc-card-text` | 2013–2089 |
| **Лонгрид: пара было → стало** | `pc-compare`, `pc-compare-cell`, `pc-compare-mark`, `pc-compare-text` | 2693–2726 |
| **Лонгрид: вынос** | `pc-aside`, `pc-aside-value`, `pc-aside-note` | 2743–2766 |
| Переходы в подвале | `pc-jump`, `pc-jump-row`, `pc-jump-card`, `pc-jump-title`, `pc-jump-sub`, `pc-jump-meta`, `pc-jump-arrow` | 1661–1782 |
| Подвал | `pc-foot`, `pc-foot-links` | 1847–1862 |
| Занавес (живёт здесь же) | `pa-curtain`, `pa-curtain-word` | 1900–1919 |

`pc-figure-note` заведён при переписывании блока цифр: слово автора о
направлении («сокращается») набирается им, а не единицей.

⚠️ `pc-label` **без единого носителя в разметке**: ни один узел
`PortfolioCaseView.tsx` этот класс не ставит. Своё правило у него снято
15.09.2026 (см. §6.1), но он уцелел в четырёх групповых селекторах вида
`.pc-section > .pc-label` — строки 665, 698, 1961, 2587. В счёт 68 классов
входит, правку через него не искать.

## 5. Точки приёмки (`data-testid`)

**Главная (17):** `pa-root`, `pa-top`, `pa-contacts`, `pa-word`, `pa-cursive`,
`pa-works`, `pa-company-*`, `pa-stripe`, `pa-sheet`, `pa-sheet-plane`,
`pa-back`, `pa-tabs`, `pa-tab-*`, `pa-cases`, `pa-case-*`, `pa-cases-empty`,
`pa-curtain`.

**Страница кейса (18):** `pc-root`, `pc-title`, `pc-back`, `pc-home`, `pc-hero`,
`pc-body`, `pc-problem`, `pc-lead`, `pc-intro-shots`, `pc-items`, `pc-cards`,
`pc-figures`, `pc-path`, `pc-path-track`, `pc-shot-track`, `pc-shot-slot-*`,
`pc-jump`, `pc-foot`.

Тесты: `tests/portfolio.spec.ts` (38 объявлений; одно параметризовано восемью
кейсами, итого 45 прогонов), истории — `views/*.stories.tsx` (7 play-функций).

🔴 Пять имён приёмки живут только как **отрицательные** проверки в
`PortfolioArchiveView.stories.tsx`: `pa-car`, `pa-car-wrap`, `pa-hud`,
`pa-replay`, `pa-flag`. Их не должно быть в DOM — так заезд болида не заводится
обратно молча.

## 6. Куда идти за типовой правкой

| Задача | Файл |
|---|---|
| Текст кейса, метрики, порядок разделов | `views/portfolio.data.ts` |
| Новый кадр в кейсе | `portfolio.data.ts` + `public/assets/optimized/` + `yarn images` |
| Заголовок, описание, карточка ссылки | `views/portfolio-meta.ts` (тексты всё равно из `portfolio.data.ts`) |
| Раскладка страницы кейса и лонгрида | `styles/portfolio-case.css` + `views/PortfolioCaseView.tsx` |
| Главная, синий экран, вкладки | `styles/portfolio-archive.css` + `archive-sheet.tsx` |
| Заливка полосы Archive | `components/portfolio/archive/stripe-raster.tsx` (GLSL, цвета числами) |
| Движение перехода между экранами | `views/PortfolioRoute.tsx` (`moveFor`) |
| Длительность или кривая | `styles/portfolio-tokens.css` (тиер 1) + `components/portfolio/motion.ts` |
| Цвет, шкала, кегль | `styles/portfolio-tokens.css`, роли — тиер 2 |
| Чернила, гарнитуры, общее поле обеих поверхностей | `styles/portfolio-ink.css` |
| **Поведение на телефоне и планшете** | `styles/portfolio-tokens.css` — моды ширины; медиазапросы по месту в слоях поверхностей |
| **Новая точка перелома** | нельзя: шкала 640 / 900 / 1200 закрыта, сторож `yarn tokens:check` |
| **Зона нажатия** | `--s-target-touch`, вылет псевдоэлементом (`pa-contact::after`, `pa-back::after`) |

## 6.1 Что снято

**Рельс лонгрида (`pc-rail*`) снят 14.09.2026** — решение владельца: «убрать
левую навигацию и вернуть содержимое к сетке, как на остальных кейсах». Вместе
с ним ушли колонка оглавления, правило «одна силовая линия», номер раздела в
поле, полоса оглавления на узком экране, якоря `#section-NN` и счёт места
чтения в `PortfolioCaseView`. Лонгрид делит двенадцать колонок и чередование
смещений с остальными семью кейсами; собственной у него осталась только
типографика рассказа — мера и ритм строк.

**Заезд болида снят 14.09.2026** — решение владельца: «убери машинку». Ушли
`pixel-car.tsx`, `use-race-boot.ts`, приборная строка, светофор и запуск
нажатием на слово; из CSS — `pa-car-wrap`, `pa-hud`, `pa-lights`, `pa-lamp`,
`pa-count` и кадры движения (остался комментарий-надгробие,
`portfolio-archive.css`, 805). Слово «Archive» снова подпись, а не кнопка;
полоса осталась полосой — её заливку ведёт `StripeRaster`. Финишная шахматка
снята раньше, 2026-09-10. Тогда же, 14.09, ушла сетка-подложка `pa-grid`: две
клетки на экране — фоновая и растровая — читались как рябь. Шаг клетки
(`--pa-cell`) остался, от него считается вертикальный ритм главной.

**Слой shadcn снят целиком 15.09.2026** — решение владельца. Ушли
`src/components/shadcn/` (`theme-scope`, `breadcrumb`, `button`, `separator`),
`src/lib/utils.ts` с `cn`, каталог `src/styles/shadcn/` и плагин
`@tailwindcss/typography`. Атрибут `data-shadcn-theme` не выставлялся нигде, в
бандл примитивы не попадали, но тянули зависимости и держали на себе инертный
guardrail движения. Остался `@custom-variant dark` в `src/styles.css` —
сознательно: он стоит копейки и сторожит класс дефектов, который не видит ни
одна машинная приёмка.

**Восемнадцать классов без носителей в разметке вычищены 15.09.2026** —
`pc-next`, `pc-next-card`, `pc-next-title`, `pc-next-meta`, `pc-rows`, `pc-row`,
`pc-metric-value`, `pc-metric-caption`, `pc-impact`, `pc-impact-grid`,
`pc-impact-line`, `pc-index`, `pc-label`, `pc-label--on-cobalt`, `pc-value`,
`pc-facts`, `pc-fact`. Из `portfolio-case.css` ушло около 260 строк (288
удалений в коммите `3c391d7`). Ссылка `pa-home` снята тем же прогоном: разбор
приёма тач-цели переехал от неё к живому носителю — ссылкам контактов
(`pa-contact::after`).

## 7. Что в карте не описано намеренно

- **Блоки без своего компонента.** `pc-compare`, `pc-aside`, `pc-cards`,
  `pc-items`, `pc-path`, `pc-figures` живут разметкой внутри
  `PortfolioCaseView.tsx` и классами в CSS. Вынести их в компоненты — следующий
  шаг, пока карта служит навигацией по классам.
- **Слой значений.** Три тиера (`portfolio-tokens.css`) и чернильная основа
  (`portfolio-ink.css`) — предмет [`INVENTORY.md`](INVENTORY.md), здесь только
  адреса правки.

