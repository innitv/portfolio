# CLAUDE.md — личный сайт-портфолио Ивана Игнатова

Это самостоятельный репозиторий персонального сайта-портфолио. Он собран на React 19 + Vite с bespoke-CSS без UI-библиотек и шаблонных фреймворков.

## Что это

- Одностраничное приложение-портфолио с кейсами (А3, РТК, Самолет) и клиентской маршрутизацией.
- Главный источник интерфейса — `src/PortfolioView.tsx` (вся структура, контент кейсов, логика роутинга) и `src/styles.css` (весь визуал, bespoke, без Tailwind/готовых UI-китов).
- Оптимизированные изображения — в `public/assets/optimized/`; их srcSet-маппинг — в `src/optimized-images.ts`.
- Точка входа — `src/main.tsx` + `index.html`.

## Стек

- React 19, react-dom 19, framer-motion (анимации/переходы).
- Vite 8 (сборка), TypeScript 6 (typecheck, `noEmit`).
- Playwright — smoke-тесты в `tests/portfolio.spec.ts`.

## Команды

- `yarn dev` — локальная разработка.
- `yarn build` — typecheck + production-сборка в `dist/`.
- `yarn preview` — предпросмотр собранного билда на `http://127.0.0.1:4173`.
- `yarn qa` — сборка + Playwright-тесты (сначала `yarn qa:install` для chromium).
- `yarn deploy` / `yarn deploy:dry-run` — сборка + выгрузка на хостинг.

## Деплой

Деплой на reg.ru по FTP/FTPS через `tools/deploy-portfolio-regru.mjs`. Данные хостинга берутся из `.env.portfolio-deploy` (шаблон — `.env.portfolio-deploy.example`). Секреты НЕ коммитить: `.env*` в `.gitignore`. Сборка выгружается из `dist/`; `public/.htaccess` копируется в билд автоматически.

## Правила

- Весь видимый пользователю UI-текст и рассуждения — на русском. Технические имена (файлы, переменные, CLI, env, ключи) не переводятся.
- UI — bespoke: не подключать шаблонные UI-библиотеки, не заменять кастомный CSS готовыми китами.
- Историю прогонов сайта см. в `runs/`.
