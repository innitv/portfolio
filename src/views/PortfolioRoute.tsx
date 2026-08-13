import * as React from "react"

import { SheetCurtain } from "@/components/portfolio/archive/sheet-curtain"

import { PortfolioCaseView } from "./PortfolioCaseView"
import { PortfolioCompanyView } from "./PortfolioCompanyView"
import { PortfolioHomeView } from "./PortfolioHomeView"

import { WORDMARK } from "./portfolio-archive.model"
import { caseById, companyById, type CompanyId } from "./portfolio.data"

/**
 * Роут портфолио: вся логика трёх экранов собрана здесь.
 *
 * Виды остаются презентационными, поэтому их состояния снимаются историями
 * один в один.
 *
 * ─── АДРЕСА ─────────────────────────────────────────────────────────────────
 * Схема путей унаследована от прежней сборки сайта и НЕ меняется при переносе
 * 2026-08-03: по этим адресам сайт уже проиндексирован и на них ведут внешние
 * ссылки.
 *
 *   /                          главная
 *   /<companyId>               компания
 *   /<companyId>/case/<caseId> кейс
 *
 * Сегмент `case` в середине обязателен: без него `/a3/flow` было бы
 * неотличимо от компании со вложенным разделом.
 *
 * В верстаке студии те же экраны живут на хешах (`#portfolio-company/a3`) —
 * там оболочка одна на несколько демо-экранов и своего домена у портфолио нет.
 * Здесь домен свой, поэтому адреса настоящие: `history.pushState` плюс
 * `popstate`. Разбор снисходителен к хвосту — неизвестный идентификатор
 * возвращает на главную, а не показывает пустой экран.
 *
 * Отдача путей на проде обеспечивается `public/.htaccess` (SPA-fallback):
 * без него прямой заход на `/a3/case/flow` вернул бы 404 от сервера.
 */

/**
 * `/archive` — экран-заезд, перенесённый из прототипа
 * `outputs/portfolio-swiss-shot/2026-08-11/prototype/v8.html`.
 *
 * Грузится лениво, и это не микрооптимизация: у экрана собственная поверхность
 * с тремя гарнитурами и своим слоем CSS. При статическом импорте объявления
 * `@font-face` и весь его стиль попали бы в общий бандл сайта, то есть на
 * страницы, которым они не нужны. Ленивый импорт уводит их в отдельный чанк,
 * который приезжает только по этому адресу.
 */
const PortfolioArchiveView = React.lazy(() =>
  import("./PortfolioArchiveView").then((module) => ({ default: module.PortfolioArchiveView })),
)

type Screen =
  | { kind: "archive" }
  | { kind: "home" }
  | { kind: "company"; companyId: CompanyId }
  | { kind: "case"; caseId: string; companyId: CompanyId }

/** Адрес экрана-заезда. Не пересекается ни с одним идентификатором компании. */
const ARCHIVE_PATH = "archive"

/** База сайта. В проде «/», но значение приходит из сборки, а не зашито. */
const BASE = String(import.meta.env.VITE_PORTFOLIO_BASE_PATH ?? "/").replace(/\/$/, "")

/** Сегменты пути без базы. */
function pathParts(): string[] {
  const parts = window.location.pathname.split("/").filter(Boolean)
  const base = BASE.split("/").filter(Boolean)
  return base.every((part, index) => parts[index] === part) ? parts.slice(base.length) : parts
}

function href(path = ""): string {
  const suffix = path ? `/${path.replace(/^\/+/, "")}` : ""
  return `${BASE}${suffix}` || "/"
}

function readScreen(): Screen {
  const [companyId, section, caseId] = pathParts()
  if (!companyId) return { kind: "home" }
  if (companyId === ARCHIVE_PATH) return { kind: "archive" }

  const company = companyById(companyId)
  if (!company) return { kind: "home" }

  if (section === "case") {
    const study = caseById(company, caseId ?? company.cases[0].id) ?? company.cases[0]
    if (study) return { kind: "case", caseId: study.id, companyId: company.id }
  }

  return { kind: "company", companyId: company.id }
}

function go(path: string) {
  window.history.pushState({}, "", href(path))
  // `pushState` не поднимает `popstate` сам — состояние обновляется явно.
  window.dispatchEvent(new PopStateEvent("popstate"))
  // Переход между экранами всегда начинается сверху: иначе на длинной
  // странице кейса возврат к списку открывался бы в середине.
  window.scrollTo({ top: 0 })
}

export function PortfolioRoute() {
  const [screen, setScreen] = React.useState<Screen>(readScreen)

  /*
   * Уходящий синий экран. Переход с `/archive` на кейс должен читаться как
   * закрытие: плоскость компании уезжает вверх, а под ней уже открытая работа.
   * Держать это состояние внутри `/archive` нельзя — при смене маршрута он
   * размонтируется целиком, и анимировать становится нечего.
   */
  const [curtain, setCurtain] = React.useState<string | null>(null)

  React.useEffect(() => {
    const onPopState = () => setScreen(readScreen())
    window.addEventListener("popstate", onPopState)
    return () => window.removeEventListener("popstate", onPopState)
  }, [])

  // Экраны без компании — главная и архив: у них в состоянии нет `companyId`.
  const company =
    screen.kind === "company" || screen.kind === "case" ? companyById(screen.companyId) : undefined
  const study = screen.kind === "case" && company ? caseById(company, screen.caseId) : undefined

  const openCompany = React.useCallback((companyId: CompanyId) => go(companyId), [])
  const openHome = React.useCallback(() => go(""), [])

  if (screen.kind === "archive") {
    return (
      /* Заглушка на время подгрузки чанка — чернильное полотно экрана: белая
         вспышка перед тёмной страницей заметнее, чем сама задержка. */
      <React.Suspense
        fallback={<div style={{ background: "#0B0B0B", minHeight: "100dvh" }} />}
      >
        <PortfolioArchiveView
          onHome={openHome}
          onOpenCase={(archiveCompanyId, caseId) => {
            /*
             * Занавес ставится ДО смены маршрута: иначе кейс успевает мигнуть.
             *
             * Имя берётся ЛАТИНСКОЕ (`WORDMARK`), а не `company.name`: на синем
             * экране стоит «A3», и подставленное русское «А3» подменяло надпись
             * прямо в момент закрытия.
             */
            setCurtain(WORDMARK[archiveCompanyId])
            go(`${archiveCompanyId}/case/${caseId}`)
          }}
        />
      </React.Suspense>
    )
  }

  if (screen.kind === "case" && company && study) {
    return (
      <>
        <PortfolioCaseView
          caseStudy={study}
          company={company}
          onHome={openHome}
          onOpenCase={(caseId) => go(`${company.id}/case/${caseId}`)}
          onOpenCompany={() => openCompany(company.id)}
        />
        {curtain !== null ? (
          <React.Suspense fallback={null}>
            <SheetCurtain onDone={() => setCurtain(null)} wordmark={curtain} />
          </React.Suspense>
        ) : null}
      </>
    )
  }

  if (screen.kind === "company" && company) {
    return (
      <PortfolioCompanyView
        company={company}
        onHome={openHome}
        onOpenCase={(caseId) => go(`${company.id}/case/${caseId}`)}
      />
    )
  }

  return <PortfolioHomeView onOpenCompany={openCompany} />
}
