# Карта компонентов — где что лежит

Снято по `src/` 13 сентября 2026: 21 модуль, 129 блоков в CSS, 33 точки приёмки.
Карта отвечает на один вопрос — **куда идти за правкой**. Значения и их тиеры —
в [`INVENTORY.md`](INVENTORY.md) и `design/tokens/portfolio/`.

## 1. Дерево: что кого включает

```
main.tsx
└── PortfolioRoute ................ маршруты, движения переходов, история
    ├── PortfolioArchiveView ...... главная и синий экран компании
    │   ├── ArchiveStripe ......... полоса Archive, она же трасса заезда
    │   │   ├── PixelCar .......... болид пасхалки
    │   │   └── useRaceBoot ....... светофор, дистанция, финиш
    │   └── ArchiveSheet .......... синий экран компании: имя, вкладки, кейсы
    ├── PortfolioCaseView ......... страница кейса: шаблон и лонгрид
    │   └── useSmoothScroll ....... догоняющая прокрутка
    └── SheetCurtain .............. занавес между экранами
```

Данные отдельно от вида: `portfolio.data.ts` (тексты и структура кейсов) и
`portfolio-archive.model.ts` (модель синего экрана) не знают о React-дереве.

## 2. Модули

| Файл | Строк | Что делает | Ключевое |
|---|---|---|---|
| `views/portfolio.data.ts` | 2591 | **все тексты и структура кейсов** | правка текста — только сюда |
| `views/PortfolioCaseView.tsx` | 1531 | страница кейса: каркас шаблона, лонгрид, слайдеры | `frameSections`, `TEMPLATE_ROLES`, `longread` |
| `views/PortfolioRoute.tsx` | 499 | маршруты и движение пары экранов | `moveFor`, `scrollRestoration: manual` |
| `views/PortfolioArchiveView.tsx` | 314 | главная: сетка, полоса, ряд имён | управляемый вид, состояние приходит снаружи |
| `views/portfolio-archive.model.ts` | 147 | модель синего экрана компании | `WORDMARK`, `archiveCompanies` |
| `views/portfolio-images.generated.ts` | 65 | манифест кадров (ширины webp) | **сгенерирован, руками не правится** |
| `components/portfolio/archive/archive-sheet.tsx` | 507 | синий экран: вкладки, кейсы, величины | `onOpened` отдаёт экран маршруту |
| `components/portfolio/archive/sheet-curtain.tsx` | 153 | занавес перехода | ключ по направлению, иначе движение не перезапустится |
| `components/portfolio/archive/use-race-boot.ts` | 172 | заезд болида | запускается словом «Archive» |
| `components/portfolio/archive/pixel-car.tsx` | 106 | болид | растровая картинка, вне палитры интерфейса |
| `components/portfolio/archive/archive-stripe.tsx` | 61 | полоса Archive | шахматки нет с 13.09.2026 |
| `components/portfolio/motion.ts` | 72 | значения движения для framer-motion | сверяется с CSS в `tokens:check` |
| `components/portfolio/use-smooth-scroll.ts` | 76 | прокрутка страницы кейса | |
| `components/shadcn/*` | 96/110/72/29 | `theme-scope`, `breadcrumb`, `button`, `separator` | из реестра; в интерфейсе почти не используются |
| `lib/utils.ts` | 7 | `cn` | |

## 3. Блоки главной — `pa-*` (42 класса, `portfolio-archive.css`)

| Блок | Класс | Строка |
|---|---|---|
| Корень и сетка-подложка | `pa-root`, `pa-grid`, `pa-screen` | 170, 183, 205 |
| Шапка: портфолио и контакты | `pa-top`, `pa-home`, `pa-contacts`, `pa-contact` | 214–261 |
| Имя PRODUCT и полоса Archive | `pa-title`, `pa-word`, `pa-stripe`, `pa-cursive` | 312–343 |
| Ряд компаний | `pa-works`, `pa-works-label`, `pa-row`, `pa-cell`, `pa-name`, `pa-meta`, `pa-sep` | 368–430 |
| Синий экран компании | `pa-sheet`, `pa-sheet-plane`, `pa-sheet-inner`, `pa-back`, `pa-huge`, `pa-sub` | 507–617 |
| Список кейсов и вкладки | `pa-cases-block`, `pa-tabs`, `pa-tab`, `pa-cases`, `pa-case`, `pa-case-index`, `pa-case-title`, `pa-case-impact`, `pa-cases-empty` | 634–977 |
| Величины компании | `pa-facts`, `pa-fact-value`, `pa-fact-caption` | 719–732 |
| Заезд | `pa-hud`, `pa-lights`, `pa-lamp`, `pa-count`, `pa-car-wrap` | 750–800 |

## 4. Блоки страницы кейса — `pc-*` (87 классов, `portfolio-case.css`)

| Группа | Классы | Строки |
|---|---|---|
| Каркас | `pc-root`, `pc-screen`, `pc-body`, `pc-flow`, `pc-section` | 392–682 |
| Шапка | `pc-top`, `pc-back`, `pc-home`, `pc-head`, `pc-title`, `pc-lede` | 422–539 |
| Текст раздела | `pc-kicker`, `pc-part`, `pc-lead`, `pc-section-text` | 883–981 |
| Нумерованный список | `pc-items`, `pc-item`, `pc-item-num`, `pc-item-text` | 1060–1111 |
| Показы и слайдер | `pc-shots`, `pc-shot`, `pc-shot-frame`, `pc-shot-slider`, `pc-shot-track`, `pc-shot-slide`, `pc-shot-arrow`, `pc-shot-dots`, `pc-shot-dot` | 764–2510 |
| Блок величин | `pc-figures`, `pc-figures-plate`, `pc-figures-row`, `pc-figure`, `pc-figure-value`, `pc-figure-unit`, `pc-figure-label`, `pc-figures-caption` | 772–1428 |
| Схема пути | `pc-path`, `pc-path-plate`, `pc-path-entry`, `pc-path-tracks`, `pc-path-track`, `pc-path-step`, `pc-path-caption` | 770–1621 |
| Карточки гипотез | `pc-cards`, `pc-cards-rule`, `pc-card`, `pc-card-title`, `pc-card-text` | 2219–2295 |
| **Лонгрид: пара было → стало** | `pc-compare`, `pc-compare-cell`, `pc-compare-mark`, `pc-compare-text` | 2749–2782 |
| **Лонгрид: вынос** | `pc-aside`, `pc-aside-value`, `pc-aside-note` | 2799–2822 |
| Переходы в подвале | `pc-jump`, `pc-jump-row`, `pc-jump-card`, `pc-jump-title`, `pc-jump-sub`, `pc-jump-meta`, `pc-jump-arrow` | 1851–1972 |
| Подвал | `pc-foot`, `pc-foot-links` | 2037–2052 |
| Занавес (живёт здесь же) | `pa-curtain`, `pa-curtain-word` | 2090–2109 |

## 5. Точки приёмки (`data-testid`)

**Главная:** `pa-root`, `pa-grid`, `pa-top`, `pa-contacts`, `pa-word`, `pa-cursive`,
`pa-works`, `pa-company-*`, `pa-case-*`, `pa-stripe`, `pa-car`, `pa-car-wrap`,
`pa-hud`, `pa-count`, `pa-sheet`, `pa-sheet-plane`, `pa-back`, `pa-tabs`,
`pa-cases`, `pa-cases-empty`, `pa-curtain`.

**Страница кейса:** `pc-root`, `pc-title`, `pc-back`, `pc-home`, `pc-hero`,
`pc-body`, `pc-problem`, `pc-lead`, `pc-intro-shots`, `pc-items`, `pc-cards`,
`pc-figures`, `pc-path`, `pc-path-track`, `pc-shot-track`, `pc-jump`, `pc-foot`.

Тесты: `tests/portfolio.spec.ts` (78 проверок), истории —
`views/*.stories.tsx` (7 проверок в play-функциях).

## 6. Куда идти за типовой правкой

| Задача | Файл |
|---|---|
| Текст кейса, метрики, порядок разделов | `views/portfolio.data.ts` |
| Новый кадр в кейсе | `portfolio.data.ts` + `public/assets/optimized/` + манифест |
| Раскладка страницы кейса и лонгрида | `styles/portfolio-case.css` + `views/PortfolioCaseView.tsx` |
| Главная, синий экран, вкладки | `styles/portfolio-archive.css` + `archive-sheet.tsx` |
| Движение перехода между экранами | `views/PortfolioRoute.tsx` (`moveFor`) |
| Длительность или кривая | `styles/portfolio-tokens.css` (тиер 1) + `components/portfolio/motion.ts` |
| Цвет, шкала, кегль | `styles/portfolio-tokens.css`, роли — тиер 2 |
| Заезд болида | `use-race-boot.ts`, запуск — курсив «Archive» в `PortfolioArchiveView.tsx` |
| **Поведение на телефоне и планшете** | `styles/portfolio-tokens.css` — моды ширины; медиазапросы по месту в слоях поверхностей |
| **Новая точка перелома** | нельзя: шкала 640 / 900 / 1200 закрыта, сторож `yarn tokens:check` |
| **Зона нажатия** | `--s-target-touch`, вылет псевдоэлементом (`pa-home::after`, `pa-contact::after`) |

## 6.1 Что снято

**Рельс лонгрида (`pc-rail*`) снят 14.09.2026** — решение владельца: «убрать
левую навигацию и вернуть содержимое к сетке, как на остальных кейсах». Вместе
с ним ушли колонка оглавления, правило «одна силовая линия», номер раздела в
поле, полоса оглавления на узком экране, якоря `#section-NN` и счёт места
чтения в `PortfolioCaseView`. Лонгрид делит двенадцать колонок и чередование
смещений с остальными семью кейсами; собственной у него осталась только
типографика рассказа — мера и ритм строк.

## 7. Что в карте не описано намеренно

- **Реестр shadcn** (`components/shadcn/*`) — четыре примитива, из которых в
  интерфейсе работает только `ShadcnThemeScope`. Остальные подключены темой и
  ждут применения; это долг из `INVENTORY.md`, а не рабочая часть.
- **Блоки без своего компонента.** `pc-compare`, `pc-aside`,
  `pc-cards`, `pc-items`, `pc-path`, `pc-figures` живут разметкой внутри
  `PortfolioCaseView.tsx` и классами в CSS. Вынести их в компоненты — следующий
  шаг, пока карта служит навигацией по классам.
