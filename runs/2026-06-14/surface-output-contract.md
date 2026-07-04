# Surface Output Contract

## 1. Surface Type

| Field | Value |
|---|---|
| Surface | `frontend` |
| Primary user | Иван Игнатов и разработчик/дизайнер, который будет переносить прототип в основной сайт |
| Primary job | Проверить новый visual direction и IA портфолио перед переносом в production |
| Output mode | `implementation` |
| External write target | `apps/frontend/src/views/PortfolioView.tsx`, `apps/frontend/src/App.tsx`, `apps/frontend/src/styles.css` |

## 2. Scope Contract

| Field | Value |
|---|---|
| Required inputs | Сайт `ivan-ignatov.online`, выбранный Figma Make URL, Make source files, ранее собранные кейсы А3/Ростелеком/Самолет |
| Must-cover sections | Главная-компании, страница компании, список кейсов компании, детальная страница кейса |
| Expected units | 1 frontend route family: `/portfolio`, `/portfolio/:companyId`, `/portfolio/:companyId/case/:caseId` |
| Non-goals | Production deploy, полный перенос всех глубинных материалов каждого кейса, Notion/Figma publication |
| Definition of Done | Локальный прототип работает, build/typecheck проходят, responsive проверен |

## 3. Coverage Gate

| Input / section | Output location | Coverage status | Notes |
|---|---|---|---|
| Главная только с компаниями | `/portfolio` | covered | Компании отображены строками как editorial index |
| А3 кейсы | `/portfolio/a3` | covered | Dashboard, flow, design system |
| Ростелеком кейсы | `/portfolio/rtk` | covered | Subscriptions, web services, onboarding |
| Самолет кейсы | `/portfolio/smlt` | covered | МСГ, карта опций |
| Детальный кейс | `/portfolio/:companyId/case/:caseId` | covered | Используется единый article template |
| Полные реальные скриншоты кейсов | frontend preview components | partial | Вместо raster screenshots используются CSS-схемы; production перенос должен подключить реальные изображения |

## 4. Evidence-To-Output Map

| Evidence source | Evidence status | Design / product decision | Output location | Applied / rejected |
|---|---|---|---|---|
| Figma Make `obk2PddZqIIoZIYAbj5iFb` | source-backed | Использовать editorial table/index стиль, serif headlines, mono labels, теплый фон | `/portfolio`, CSS `.portfolio-*` | applied |
| Сайт `ivan-ignatov.online` | source-informed | Заменить Make hallucinated cases на реальные компании и кейсы | `companies` data in `PortfolioView.tsx` | applied |
| Пользовательская IA правка | source-backed | Главная содержит только компании, кейсы живут на странице компании | routes `/portfolio`, `/portfolio/:companyId` | applied |

## 5. Visual Evidence Grounding

### Visual Evidence Plan

| Layer | Target references | Source / tool | Status | Skipped reason / risk |
|---|---|---|---|---|
| Same-domain references | Текущее портфолио пользователя | live site + prior Lazyweb capture | collected | Нужна production-проверка на полном контенте |
| Adjacent high-quality references | Figma Make editorial portfolio direction | Figma Make source | collected | Make мог сгенерировать выдуманные факты, они заменены |
| Interaction/state references | Navigation home/company/case, mobile overflow | Browser QA | collected | Нет полноценного Playwright test файла |
| Design-system grounding | Existing frontend app + CSS namespace | codebase | collected | Прототип scoped, не интегрирован в общий DS |

### Visual Reference Cards

| Reference | Surface / screen / state | Observed pattern | What to borrow | What to avoid | Applicability | IP / trade-dress risk | Output location |
|---|---|---|---|---|---|---|---|
| Figma Make portfolio | home/company/case | Editorial table, warm background, serif display typography, mono metadata | IA rhythm, typography, row-based navigation | Hallucinated content and generic metrics | high | low | `/portfolio` route |
| Current user site | company/cases pages | Real company categories and case list | Real names and case structure | Keeping old visual style untouched | high | low | `companies` data |

### Visual Evidence-To-Output Map

| Visual evidence | Visual decision | Output unit | Verification signal |
|---|---|---|---|
| Make source `home-page.tsx` | Home as company index | `/portfolio` | Browser DOM + screenshot |
| Make source `company-page.tsx` | Company page as case index | `/portfolio/a3` | Browser DOM |
| Make source `case-page.tsx` | Case detail as article | `/portfolio/a3/case/dashboard-redesign` | Browser DOM |

### Source Pair Matrix

| Pair | Required | Evidence | Status | Notes |
|---|---|---|---|---|
| `reference_to_figma` | no | Make reference was source code, not imported as editable Figma frame | not_applicable | Make URL used as frontend reference |
| `figma_to_frontend` | yes | Make source files -> local React/CSS implementation | passed_with_notes | Content replaced with real cases |
| `reference_to_frontend` | yes | Make visual direction + browser screenshot | passed_with_notes | No pixel diff; manual/browser smoke only |
| `spec_to_frontend_behavior` | yes | User flow + DOM checks | passed | `/portfolio -> /portfolio/a3 -> /portfolio/a3/case/dashboard-redesign` verified |

## 6. Surface Quality Bar

| Check | Status | Evidence |
|---|---|---|
| Primary workflow | passed | Browser checked home/company/case URLs |
| Navigation | passed | Custom history routing works for route family |
| Responsive | passed_with_notes | Mobile horizontal overflow found and fixed |
| Russian visible text | passed_with_notes | Main UI text in Russian; technical terms like `B2B`, `dashboard`, `AI` retained |
| Build/typecheck | passed | `yarn typecheck`, `yarn build` |
| Real visual evidence | passed_with_notes | Make reference + current-site content; no competitor benchmark layer in this limited run |

## 7. Write -> Verify -> Fix Plan

| Step | Required evidence | Status |
|---|---|---|
| Plan | Surface Output Contract reviewed | completed |
| Write | `/portfolio` implementation created | completed |
| Verify | Typecheck, build, browser flow, mobile overflow | completed |
| Fix | Horizontal overflow corrected | completed |

## 8. Deviations

| Deviation | Reason | Approval / waiver | Downstream impact |
|---|---|---|---|
| Full product workflow not executed | User asked to apply selected Make variant, not rebuild full product pipeline | implicit limited-scope execution | Output is prototype, not final production release |
| Real screenshots not embedded | Existing source images were not wired into frontend in this pass | none | Next pass should connect actual screenshots/case media |
