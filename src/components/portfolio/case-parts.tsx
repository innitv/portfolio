import { LayoutGrid } from "lucide-react"

import { Button } from "@/components/shadcn/button"
import { Separator } from "@/components/shadcn/separator"
import { cn } from "@/lib/utils"

import { CaseFigure, CaseFigures } from "./case-figure"
import { CompanyLogo } from "./company-logo"
import { MetricStrip } from "./metric-strip"

import {
  caseMetrics,
  contacts,
  sectionImages,
  type CaseDetailSection,
  type CaseStudy,
  type Company,
} from "@/views/portfolio.data"

/**
 * Блоки страницы кейса, вынесенные из вида.
 *
 * Причина выноса — витрина, а не эстетика файла: страница кейса выше 5000 px и
 * в кадр скриншот-регрессии (1280×2000) целиком не помещается, поэтому её
 * регрессия ведётся по блокам. Блок обязан быть ТЕМ ЖЕ кодом, что стоит в
 * роуте, иначе витрина проверяет не то, что видит человек, — а для этого он
 * должен быть отдельным компонентом, а не разметкой внутри вида.
 *
 * ─── ФОРМАТ СТРАНИЦЫ (2026-08-02) ───────────────────────────────────────────
 * Структура взята из блока `@shadcnblocks/case-study1` («Long-form case study
 * with metrics and sidebar»), выбранного владельцем: две колонки, слева
 * крошки → заголовок → лид → кадр → сетка метрик → длинный текст в `prose`,
 * справа липкая колонка со знаком компании, парами «метка → значение» и
 * контактом. Демо-контент блока (про короля и налог на шутки) не переносится:
 * из блока взята только раскладка, наполнение — наши данные дословно.
 */

/**
 * Термин в начале пункта — полужирным.
 *
 * Единственный текстовый акцент на сайте. Работает там, где автор сам начал
 * пункт с термина и отбил его точкой или двоеточием: «Быстрые действия. Если
 * вынести…», «Time to Action: сокращение…». Фраза при этом остаётся целой —
 * меняется только начертание куска, ни одного слова не добавлено и не убрано.
 *
 * ─── ПОЧЕМУ ДВА ПОРОГА, А НЕ ОДИН ───────────────────────────────────────────
 * Длины мало. Первая сборка отделяла термин порогом в 48 знаков и выделяла
 * «Сократить путь до ключевых действий:» и «Дать быстрый обзор состояния
 * продукта:» — это не термины, а начала предложений, у которых двоеточие
 * стоит перед перечислением. Найдено просмотром страницы, не тестом.
 *
 * Термин отличается от такого начала числом слов: «Быстрые действия», «Time
 * to Action», «Support Contact Rate», «Вход существующего пользователя» — не
 * длиннее трёх. Поэтому условий два: не больше трёх слов И не длиннее 34
 * знаков. Пункт, не прошедший оба, остаётся без акцента — пропущенный акцент
 * дешевле ложного.
 */
const TERM_MAX_WORDS = 3
const TERM_MAX_CHARS = 34

/** Термин пункта вместе с его знаком отбивки — или `null`, если его нет. */
function termOf(text: string): string | null {
  const candidates = [text.indexOf(": "), text.indexOf(". ")].filter((index) => index > 0)
  if (candidates.length === 0) return null

  const term = text.slice(0, Math.min(...candidates) + 1)
  if (term.length > TERM_MAX_CHARS || term.split(/\s+/).length > TERM_MAX_WORDS) return null
  return term
}

/**
 * Акцент принадлежит СПИСКУ, а не отдельному пункту.
 *
 * Без этого правила в разделе «Что сделал» полужирным становился ровно один
 * пункт из семи («Добавил быстрые действия: создать счет…»), потому что он
 * случайно попал в порог, — и список выглядел так, будто у него сбилось
 * форматирование. Найдено просмотром страницы.
 *
 * Поэтому термины выделяются, только когда список действительно устроен как
 * «ярлык плюс расшифровка»: терминов не меньше двух и они есть минимум у
 * половины пунктов. «Продуктовые гипотезы» (4 из 4) и «Метрики успеха»
 * (4 из 4) проходят, «Что сделал» (1 из 7) — нет.
 */
function listUsesTerms(items: string[]): boolean {
  const matched = items.filter((item) => termOf(item) !== null).length
  return matched >= 2 && matched * 2 >= items.length
}

function TermLeadIn({ enabled, text }: { enabled: boolean; text: string }) {
  const term = enabled ? termOf(text) : null
  if (!term) return <>{text}</>

  return (
    <>
      <strong className="text-foreground font-semibold">{term}</strong>
      {text.slice(term.length)}
    </>
  )
}

export interface CaseIntroProps {
  caseStudy: CaseStudy
}

/**
 * Голова левой колонки: заголовок, лид, кадр и сетка метрик.
 *
 * Чипа с типом кейса здесь нет — убран по правке владельца 2026-08-03. Тип
 * работы («UX Research · Redesign») остаётся на карточке кейса, где он служит
 * различению работ в списке; над заголовком самого кейса он читался как статус
 * страницы, которым не является.
 *
 * Числа стоят ЗДЕСЬ, а не внизу страницы, где они лежат в данных: «Метрики
 * успеха» и «Бизнес-эффект» — предпоследние разделы, и до них дочитывает не
 * каждый. Значения подняты дословно, без пересчёта, и полное предложение
 * остаётся на своём месте в теле кейса: наверху сводка, в разделе — описание
 * действия.
 */
export function CaseIntro({ caseStudy }: CaseIntroProps) {
  const metrics = caseMetrics(caseStudy)

  return (
    <>
      <h1 className="pf-h1 text-foreground" data-testid="pf-case-title">
        {caseStudy.title}
      </h1>
      <p className="pf-lead text-foreground mt-2">{caseStudy.subtitle}</p>
      <p className="pf-prose text-muted-foreground mt-3">{caseStudy.summary}</p>

      {/* Кадр не кропается под 16:9, как в исходном блоке: наши кадры — это
          скриншоты интерфейсов, и `object-cover` срезал бы у них смысловую
          часть. Ширина по-прежнему считается из манифеста (natural / 1.5). */}
      {caseStudy.coverImage ? (
        <CaseFigure className="mt-8" image={caseStudy.coverImage} limit={692} />
      ) : null}

      {metrics.length > 0 ? <MetricStrip className="mt-8" metrics={metrics} /> : null}
    </>
  )
}

export interface CaseArticleProps {
  className?: string
  sections: CaseDetailSection[]
}

/**
 * Тело кейса: разделы 01–08 в колонке `prose`.
 *
 * `prose` даёт маркеры списков, отбивку абзацев и оформление таблиц; всё
 * остальное — кегли, трекинг и цвет — переопределено классом `.pf-article` в
 * `styles/portfolio.css`, потому что собственная шкала плагина расходится с
 * нашей и приносит хроматичный серый. Разбор конфликта — там же.
 */
export function CaseArticle({ className, sections }: CaseArticleProps) {
  return (
    <div className={cn("prose pf-article max-w-full", className)} data-testid="pf-case-article">
      {sections.map((section, index) => (
        <CaseSection index={index} key={section.title} section={section} />
      ))}
    </div>
  )
}

export interface CaseSectionProps {
  index: number
  section: CaseDetailSection
}

/**
 * Раздел кейса: номер, заголовок, абзацы, список, кадры.
 *
 * Рассчитан на то, что стоит внутри `CaseArticle`: маркеры списка и отбивки
 * абзацев приходят от `prose`. Кадры и видео обёрнуты в `not-prose` — плагин
 * навешивает на `img` собственные вертикальные отступы, и внутри рамки кадра
 * они дали бы серую полосу над и под изображением.
 */
export function CaseSection({ index, section }: CaseSectionProps) {
  const images = sectionImages(section)
  const items = section.items
  const terms = items ? listUsesTerms(items) : false

  return (
    <section>
      <h2 className="pf-h2 text-foreground flex items-baseline gap-3">
        <span aria-hidden="true" className="pf-micro pf-ink-soft">
          {String(index + 1).padStart(2, "0")}
        </span>
        {section.title}
      </h2>

      {section.body?.map((paragraph) => (
        <p className="pf-measure pf-prose text-muted-foreground" key={paragraph}>
          {paragraph}
        </p>
      ))}

      {section.quote ? (
        <p className="pf-measure pf-prose text-muted-foreground">{section.quote}</p>
      ) : null}

      {items ? (
        <ul className="pf-measure pf-prose text-muted-foreground">
          {items.map((item) => (
            <li key={item}>
              <TermLeadIn enabled={terms} text={item} />
            </li>
          ))}
        </ul>
      ) : null}

      {images.length > 0 ? (
        <div className="not-prose mt-6">
          <CaseFigures images={images} />
        </div>
      ) : null}

      {section.videos ? (
        <div className="not-prose mt-6 grid gap-6 sm:grid-cols-3">
          {section.videos.map((video) => (
            <figure className="min-w-0" key={video.src}>
              <div className="pf-frame">
                {/* Видео живут на внешнем домене портфолио: в репозитории их
                    нет, копировать нечего. `preload="none"` — файл не
                    грузится, пока пользователь не нажал play. */}
                <video className="block w-full" controls playsInline preload="none" src={video.src} />
              </div>
              <figcaption className="pf-caption pf-ink-soft mt-3">{video.caption}</figcaption>
            </figure>
          ))}
        </div>
      ) : null}
    </section>
  )
}

export interface CaseAsideProps {
  className?: string
  company: Company
  onContact?: (channel: string) => void
  onOpenCompany: () => void
}

/**
 * Правая колонка: знак компании, справка о ней и контакт.
 *
 * Липкость включается только с `lg`: на узкой ширине колонка встаёт под текст
 * обычным блоком, и закреплённых слоёв на мобильной странице по-прежнему нет
 * ни одного (это же зафиксировано в мобильной приёмке).
 *
 * Кнопки контакта подписаны ровно теми ярлыками, что лежат в данных
 * (`tg`/`email`/`linkedin`), — ни одной новой строки текста здесь не заведено.
 */
export function CaseAside({ className, company, onContact, onOpenCompany }: CaseAsideProps) {
  return (
    <aside
      className={cn("h-fit lg:sticky lg:top-8 lg:max-w-80", className)}
      data-testid="pf-case-aside"
    >
      <CompanyLogo className="mb-8" company={company.id} height={22} />

      <p className="pf-ui text-foreground mb-1.5 font-semibold">О компании</p>
      <p className="pf-ui text-muted-foreground mb-5">{company.description}</p>

      <p className="pf-ui text-foreground mb-1.5 font-semibold">Отрасль</p>
      <p className="pf-ui text-muted-foreground mb-5">{company.industry}</p>

      {company.years ? (
        <>
          <p className="pf-ui text-foreground mb-1.5 font-semibold">Период</p>
          <p className="pf-ui text-muted-foreground mb-5">{company.years}</p>
        </>
      ) : null}

      <p className="pf-ui text-foreground mb-1.5 font-semibold">Другие работы</p>
      <Button
        className="pf-ui h-11 sm:h-8"
        data-testid="pf-aside-company"
        onClick={onOpenCompany}
        size="sm"
        type="button"
        variant="outline"
      >
        <LayoutGrid className="opacity-60" />
        Все кейсы {company.name}
      </Button>

      <Separator className="my-5" />

      <p className="pf-ui text-foreground mb-3 font-semibold">Обсудить задачу</p>
      <div className="flex flex-wrap items-center gap-2">
        {contacts.map((contact, index) => (
          <Button
            asChild
            className="pf-ui h-11 sm:h-8"
            key={contact.label}
            size="sm"
            // Заливка достаётся первому каналу: три одинаковые кнопки подряд
            // читались как три главных действия, то есть ни одно.
            variant={index === 0 ? "default" : "outline"}
          >
            <a
              data-testid={`pf-aside-${contact.label}`}
              href={contact.href}
              onClick={() => onContact?.(contact.label)}
              rel={contact.external ? "noreferrer" : undefined}
              target={contact.external ? "_blank" : undefined}
            >
              {contact.label}
            </a>
          </Button>
        ))}
      </div>
    </aside>
  )
}
