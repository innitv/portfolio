# QA Report

## Inputs Used

- `apps/frontend/src/App.tsx`
- `apps/frontend/src/views/PortfolioView.tsx`
- `apps/frontend/src/styles.css`
- Browser QA on `http://127.0.0.1:5177/portfolio`
- `ux-audit.md`

## Checks

| Check | Command / method | Result |
|---|---|---|
| Environment doctor | `yarn workflow:doctor` | passed |
| TypeScript | `yarn typecheck` | passed |
| Production build | `yarn build` | passed |
| Home route | Browser DOM `/portfolio` | passed |
| Company route | Browser DOM `/portfolio/a3` | passed |
| Case route | Browser DOM `/portfolio/a3/case/dashboard-redesign` | passed |
| Mobile horizontal overflow | Browser evaluate at 390px | failed initially, fixed, passed |
| Responsive UX matrix | Browser evaluate at 1440, 1280, 768, 390, 360 | passed |
| Touch target audit | Browser evaluate on all checked routes | passed |
| Tiny text audit | Browser evaluate on all checked routes | passed |

## Browser Evidence Summary

Verified route chain:

```text
http://127.0.0.1:5177/portfolio
http://127.0.0.1:5177/portfolio/a3
http://127.0.0.1:5177/portfolio/a3/case/dashboard-redesign
```

DOM checks confirmed:

- companies present on home: А3, Ростелеком, Самолет;
- A3 page includes cases: Редизайн главного экрана, Оптимизация флоу, Дизайн-система;
- case page includes article sections: Контекст, Проблема, Решение, Результат.

## Issues Found And Fixed

| Issue | Fix |
|---|---|
| JSX parsed `->` as invalid token | Replaced with `{"->"}` |
| Mobile horizontal overflow at 390px | Added scoped `box-sizing` and mobile width constraints for article/aside |
| Mobile horizontal overflow at 360px in case metrics | Added width constraints and `overflow-wrap` for long metric values |
| Small breadcrumb and TOC touch targets | Added 44px minimum target sizing |
| Metadata labels below 10px | Increased table/fact/aside labels to 10px |
| H1 text read as concatenated because of line breaks | Added explicit `aria-label` for key H1 headings |

## Residual Risk

- Route handling is intentionally lightweight and local to the SPA. If deployed behind static hosting, fallback routing must be configured.
- Real production media/screenshots are not wired yet.
- No dedicated Playwright spec was added in this pass.
- Browser screenshot file save was blocked by runtime filesystem permissions; layout evidence is recorded in `ux-audit.md`.
