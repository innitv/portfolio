import { CaseCard } from "@/components/portfolio/case-card"
import { CardRow } from "@/components/portfolio/company-card"
import { SiteFooter, SiteHeader } from "@/components/portfolio/site-chrome"
import { ShadcnThemeScope } from "@/components/shadcn/theme-scope"

import type { Company } from "./portfolio.data"

/**
 * Страница компании: чем человек занимался в одном месте работы.
 *
 * Крошки, заголовок с описанием, сетка одинаковых карточек кейсов, футер.
 * Отрасль и годы стоят здесь, а не на разводящей: на карточке компании они
 * были бы датой, которая старит работу, а на своей странице это контекст.
 */

export interface PortfolioCompanyViewProps {
  company: Company
  onContact?: (channel: string) => void
  onHome: () => void
  onOpenCase: (caseId: string) => void
}

export function PortfolioCompanyView({
  company,
  onContact,
  onHome,
  onOpenCase,
}: PortfolioCompanyViewProps) {
  return (
    <ShadcnThemeScope
      className="bg-background text-foreground flex min-h-dvh flex-col"
      theme="portfolio"
    >
      <SiteHeader current={company.name} onHome={onHome} />

      {/* `flex-1` прижимает подвал к низу окна — разбор в `PortfolioHomeView`.
          Именно на этой странице дефект и мерялся: у А3 три кейса, у
          «Самолета» два, страницы разной длины, и подвал прыгал между ними.

          Отступ 32/48 — общий на все три страницы, см. `PortfolioHomeView`. */}
      <main className="pf-flow flex-1 pt-8 pb-4 md:pt-12">
        {/* Надзаголовка «отрасль · период» здесь нет — убран по правке
            владельца 2026-08-03. Обе величины остаются на странице кейса в
            правой колонке, где подписаны словами («Отрасль», «Период») и
            читаются как справка, а не как ярлык над именем компании. */}
        <section className="pf-container">
          <h1 className="pf-h1 text-foreground">{company.name}</h1>
          <p className="pf-lead text-muted-foreground mt-4 max-w-[60ch]">{company.description}</p>
        </section>

        <section aria-labelledby="pf-cases-title" className="pf-container">
          <h2 className="pf-h3 text-foreground mb-6" id="pf-cases-title">
            Кейсы
          </h2>
          {/* Тот же ряд, что у карточек компаний на разводящей. Число колонок
              равно числу кейсов: у «Самолета» их два, и в трёх колонках ряд
              заканчивался бы пустой третью. */}
          <CardRow columns={company.cases.length >= 3 ? 3 : 2}>
            {company.cases.map((caseStudy) => (
              <CaseCard caseStudy={caseStudy} key={caseStudy.id} onOpen={onOpenCase} />
            ))}
          </CardRow>
        </section>
      </main>

      <SiteFooter onContact={onContact} suffix={company.name} />
    </ShadcnThemeScope>
  )
}
