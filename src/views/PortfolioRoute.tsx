import * as React from "react"

import { PortfolioCaseView } from "./PortfolioCaseView"
import { PortfolioCompanyView } from "./PortfolioCompanyView"
import { PortfolioHomeView } from "./PortfolioHomeView"

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

type Screen =
  | { kind: "home" }
  | { kind: "company"; companyId: CompanyId }
  | { kind: "case"; caseId: string; companyId: CompanyId }

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

  React.useEffect(() => {
    const onPopState = () => setScreen(readScreen())
    window.addEventListener("popstate", onPopState)
    return () => window.removeEventListener("popstate", onPopState)
  }, [])

  const company = screen.kind === "home" ? undefined : companyById(screen.companyId)
  const study = screen.kind === "case" && company ? caseById(company, screen.caseId) : undefined

  const openCompany = React.useCallback((companyId: CompanyId) => go(companyId), [])
  const openHome = React.useCallback(() => go(""), [])

  if (screen.kind === "case" && company && study) {
    return (
      <PortfolioCaseView
        caseStudy={study}
        company={company}
        onHome={openHome}
        onOpenCompany={() => openCompany(company.id)}
      />
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
