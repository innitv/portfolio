---
schema_payload:
  status: ready
  inputs_used:
    - "https://ivan-ignatov.online/"
    - "https://www.figma.com/make/obk2PddZqIIoZIYAbj5iFb/Сайт-портфолио-продуктового-дизайнера"
    - "apps/frontend/src/App.tsx"
    - "apps/frontend/src/styles.css"
---

# План run: редизайн портфолио Ивана Игнатова

## Тип работы

`reference-driven workflow` + ограниченная frontend-реализация.

Причина: пользователь выбрал Figma Make-вариант как визуальный референс и попросил применить его. Выход является интерактивной визуальной поверхностью (`frontend`), поэтому нужен отдельный ledger в `outputs/`.

## Цель

Собрать прототип портфолио в стиле понравившегося Figma Make-варианта, но с реальной структурой и реальными кейсами пользователя.

## Целевой flow

```text
главная -> компания -> кейсы компании -> детальный кейс
```

## План выполнения

1. Зафиксировать Make-вариант как visual reference.
2. Заменить выдуманный Make-контент на реальные компании и кейсы с сайта пользователя.
3. Реализовать отдельный маршрут `/portfolio`, не ломая текущие `/`, `/console`, `/components`.
4. Проверить навигацию:
   - `/portfolio`
   - `/portfolio/a3`
   - `/portfolio/a3/case/dashboard-redesign`
5. Проверить responsive и отсутствие горизонтального overflow.
6. Зафиксировать результат, evidence, риски и handoff в run directory.

## Non-goals

- Не деплоить на production.
- Не заменять текущий публичный сайт пользователя.
- Не делать полный research/PRD pipeline.
- Не публиковать в Notion/Figma как финальный production handoff.

## Definition of Done

- Прототип доступен локально по `/portfolio`.
- Flow `главная -> компания -> кейс` работает.
- Реальные компании и ключевые кейсы отражены.
- `yarn typecheck` и `yarn build` проходят.
- Browser QA фиксирует desktop render и mobile overflow check.
