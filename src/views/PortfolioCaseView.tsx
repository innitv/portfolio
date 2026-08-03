import * as React from "react"

import { CaseArticle, CaseAside, CaseIntro } from "@/components/portfolio/case-parts"
import { SiteFooter, SiteHeader } from "@/components/portfolio/site-chrome"
import { ShadcnThemeScope } from "@/components/shadcn/theme-scope"

import { caseSections, type CaseStudy, type Company } from "./portfolio.data"

/**
 * Страница кейса — длинная статья в двух колонках.
 *
 * Формат выбран владельцем: блок `@shadcnblocks/case-study1` («Long-form case
 * study with metrics and sidebar»). Из блока взята раскладка и ничего больше —
 * его демо-контент про короля и налог на шутки в проде не живёт, файл
 * `components/shadcn/case-study1.tsx` удалён после переноса структуры.
 *
 *   слева  (≤692)  крошки → категория → заголовок → лид → кадр → сетка
 *                  метрик → тело кейса в колонке `prose`
 *   справа (≤320)  знак компании → пары «метка → значение» → кнопка перехода
 *                  к остальным кейсам → разделитель → контакты
 *
 * Правая колонка липкая только с `lg`; на узкой ширине она встаёт под текст
 * обычным блоком, и закреплённых слоёв на мобильной странице нет ни одного.
 *
 * ─── ЧТО СТАЛО С ПРЕЖНИМ ФИНАЛОМ СТРАНИЦЫ ───────────────────────────────────
 * Блока «Обсудить задачу» внизу больше нет: контакты переехали в правую
 * колонку, и на узкой ширине она и оказывается низом страницы — тот же итог,
 * но без второго набора тех же кнопок.
 */

export interface PortfolioCaseViewProps {
  caseStudy: CaseStudy
  company: Company
  onContact?: (channel: string) => void
  onHome: () => void
  onOpenCompany: () => void
}

export function PortfolioCaseView({
  caseStudy,
  company,
  onContact,
  onHome,
  onOpenCompany,
}: PortfolioCaseViewProps) {
  const sections = React.useMemo(() => caseSections(caseStudy), [caseStudy])

  return (
    <ShadcnThemeScope
      className="bg-background text-foreground flex min-h-dvh flex-col"
      theme="portfolio"
    >
      <SiteHeader
        current={caseStudy.title}
        levels={[{ label: company.name, onClick: onOpenCompany }]}
        onHome={onHome}
      />

      {/* `flex-1` прижимает подвал к низу — разбор в `PortfolioHomeView`.
          Здесь страница заведомо длиннее окна, но приём держится одинаковым
          на всех трёх видах: разная механика подвала между страницами и есть
          то, из-за чего он прыгал.

          Отступ 32/48 — общий на все три страницы, см. `PortfolioHomeView`. */}
      <main className="pf-container flex-1 pt-8 pb-8 md:pt-12">
        <div className="flex flex-col gap-10 lg:flex-row lg:justify-between">
          <div className="min-w-0 lg:max-w-[692px]">
            <CaseIntro caseStudy={caseStudy} />
            <CaseArticle className="mt-10" sections={sections} />
          </div>

          <CaseAside company={company} onContact={onContact} onOpenCompany={onOpenCompany} />
        </div>
      </main>

      {/* Контакт здесь уже держит липкая правая колонка — второй такой же
          блок в подвале вернул бы дубль внутри одной страницы. */}
      <SiteFooter contact={false} suffix={company.name} />
    </ShadcnThemeScope>
  )
}
