# siteportfolio

Личный сайт-портфолио Ивана Игнатова — дизайнера сложных продуктов. Одностраничное приложение с кейсами и клиентской маршрутизацией.

## Стек

- **React 19** + **react-dom 19**
- **framer-motion** — анимации и переходы
- **Vite 8** — dev-сервер и сборка
- **TypeScript 6** — статическая проверка типов
- **Playwright** — smoke-тесты

UI полностью bespoke: кастомный CSS (`src/styles.css`) без UI-библиотек. Вся структура и контент — в `src/PortfolioView.tsx`.

## Структура

```
index.html                 — точка входа HTML
src/main.tsx               — bootstrap React
src/PortfolioView.tsx      — весь UI, контент кейсов, роутинг
src/styles.css             — весь визуал (bespoke)
src/optimized-images.ts    — srcSet-маппинг оптимизированных картинок
public/assets/optimized/   — webp-ассеты
public/.htaccess           — правила хостинга (копируется в билд)
tools/deploy-portfolio-regru.mjs — деплой на reg.ru по FTP/FTPS
tests/portfolio.spec.ts    — Playwright smoke-тесты
runs/                      — история прогонов сайта (ledger)
```

## Команды

| Команда | Действие |
| --- | --- |
| `yarn install` | установка зависимостей |
| `yarn dev` | локальная разработка |
| `yarn build` | typecheck + сборка в `dist/` |
| `yarn preview` | предпросмотр билда на `http://127.0.0.1:4173` |
| `yarn typecheck` | только проверка типов |
| `yarn qa:install` | установка chromium для Playwright |
| `yarn qa` | сборка + Playwright-тесты |
| `yarn deploy:dry-run` | сборка + пробный прогон деплоя |
| `yarn deploy` | сборка + выгрузка на хостинг |

## Деплой

Выгрузка на reg.ru по FTP/FTPS. Скопируйте `.env.portfolio-deploy.example` в `.env.portfolio-deploy`, заполните данными хостинга и запустите `yarn deploy`. Секреты не коммитятся (`.env*` в `.gitignore`).
