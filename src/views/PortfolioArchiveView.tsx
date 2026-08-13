import * as React from "react"

import { motion } from "framer-motion"

import { ArchiveSheet } from "@/components/portfolio/archive/archive-sheet"
import { ArchiveStripe } from "@/components/portfolio/archive/archive-stripe"
import { useRaceBoot } from "@/components/portfolio/archive/use-race-boot"

import { archiveCompanies, type ArchiveCompany } from "./portfolio-archive.model"
import { contacts, type CompanyId } from "./portfolio.data"

import "@/styles/portfolio-archive.css"

/**
 * `/archive` — швейцарский экран-заезд.
 *
 * Перенос согласованного с владельцем прототипа
 * `outputs/portfolio-swiss-shot/2026-08-11/prototype/v8.html` (репозиторий
 * студии) на стек сайта. Все выверенные величины подняты в переменные
 * `--pa-*` в `styles/portfolio-archive.css` и там же объяснены; здесь остаётся
 * состав экрана и поведение.
 *
 * ─── ЭТОТ ЭКРАН СТОИТ РЯДОМ, А НЕ ВМЕСТО ────────────────────────────────────
 * Маршруты `/`, `/<companyId>` и `/<companyId>/case/<caseId>` не тронуты: сайт
 * по ним проиндексирован. Экран не пользуется ни темой `portfolio`, ни её
 * контейнером `ShadcnThemeScope` — у него собственная поверхность (чернила,
 * кобальт, три гарнитуры), и она скоупнута на `.pa-root` и на атрибут
 * `data-portfolio-surface` корня документа. Компоненты реестра сюда не
 * годятся по построению: на экране нет ни одного примитива реестра — только
 * типографика, полоса и строки.
 *
 * ─── ЧТО ДАЮТ ДАННЫЕ ────────────────────────────────────────────────────────
 * Имена, отрасли, годы, кейсы и их итоги приходят из `portfolio.data.ts` через
 * `portfolio-archive.model.ts`. В прототипе они были вписаны руками и местами
 * расходились с сайтом. Латиница имён (PRODUCT / Archive / SAMOLET / RTK) —
 * решение владельца по макету, разбор — там же в модели.
 */

/** Порядок появления содержимого при заходе — как в прототипе. */
const REVEAL_ORDER = {
  cursive: 0,
  top: 1,
  word: 2,
  works: 3,
  spec: 4,
} as const

/** Шаг лесенки проявления, секунды. */
const REVEAL_STAGGER = 0.07

/** Длительность проявления одного блока, секунды. */
const REVEAL_DURATION = 0.5

/** Сдвиг блока при проявлении, px. */
const REVEAL_OFFSET = 14

const EASE_REVEAL = [0.16, 1, 0.3, 1] as const

/** Потолок ожидания гарнитур перед проявлением, мс. */
const FONTS_TIMEOUT = 600

/**
 * Подпись цвета внизу экрана. Строка из макета: она документирует кобальт как
 * основной цвет системы и контраст к белому.
 */
const COLOR_SPEC = "#044AB3 · контраст к белому 7,97 : 1 · основной цвет системы"

export interface PortfolioArchiveViewProps {
  /** Переход на главную сайта. Без него верхняя строка остаётся текстом. */
  onHome?: () => void
  /** Переход на страницу кейса из строки на синем экране. */
  onOpenCase?: (companyId: CompanyId, caseId: string) => void
}

export function PortfolioArchiveView({ onHome, onOpenCase }: PortfolioArchiveViewProps) {
  /*
   * Системная настройка «уменьшить движение» этот экран НЕ гасит — решение
   * владельца 2026-08-13. Разбор: движение здесь и есть содержание, а не
   * оформление; заезд болида, единственное крупное перемещение, при заходе
   * больше не идёт и запускается только прямым нажатием на шахматку. Подробно —
   * в шапке `archive-sheet.tsx`.
   */
  const race = useRaceBoot()

  /*
   * Проявление содержимого больше НЕ ждёт заезда: с 2026-08-13 заезд — пасхалка
   * на флаге, а не загрузка. Ждём только гарнитуры: кегль 130 и курсив 138
   * подменой шрифта дёргают всю раскладку, и лесенка на этом дёрганье видна.
   */
  const [ready, setReady] = React.useState(false)

  React.useEffect(() => {
    let cancelled = false
    const timer = window.setTimeout(() => {
      if (!cancelled) setReady(true)
    }, FONTS_TIMEOUT)

    void document.fonts.ready
      .catch(() => undefined)
      .then(() => {
        if (!cancelled) setReady(true)
      })

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [])

  const [openId, setOpenId] = React.useState<CompanyId | undefined>(undefined)
  const company: ArchiveCompany | undefined = archiveCompanies.find((item) => item.id === openId)

  // Узел, с которого открыли синий экран: на него возвращается фокус.
  const cellsRef = React.useRef(new Map<CompanyId, HTMLButtonElement>())

  /*
   * Канва документа и запрет прокрутки живут на `html`, а не на контейнере:
   * за боксом страницы (overscroll, системные зоны мобильного браузера) виден
   * фон именно корня. Атрибут снимается при уходе с маршрута — остальные
   * страницы сайта о нём не знают.
   */
  React.useEffect(() => {
    const root = document.documentElement
    const previous = root.dataset.portfolioSurface
    root.dataset.portfolioSurface = "archive"

    return () => {
      if (previous === undefined) delete root.dataset.portfolioSurface
      else root.dataset.portfolioSurface = previous
    }
  }, [])

  const closeCompany = React.useCallback(() => {
    setOpenId((current) => {
      if (current) cellsRef.current.get(current)?.focus()
      return undefined
    })
  }, [])

  /** Проявление блока при заходе: индекс задаёт место в лесенке. */
  const reveal = (index: number) => ({
    animate: ready ? { opacity: 1, y: 0 } : { opacity: 0, y: 0 },
    initial: { opacity: 0, y: REVEAL_OFFSET },
    transition: {
      delay: ready ? index * REVEAL_STAGGER : 0,
      duration: REVEAL_DURATION,
      ease: EASE_REVEAL,
    },
  })

  const email = contacts.find((channel) => channel.label === "email")

  return (
    <div className="pa-root" data-testid="pa-root">
      <div aria-hidden="true" className="pa-grid" data-testid="pa-grid" />

      <div className="pa-screen">
        <motion.div className="pa-top" data-testid="pa-top" {...reveal(REVEAL_ORDER.top)}>
          {onHome ? (
            <button className="pa-home" data-testid="pa-home" onClick={onHome} type="button">
              портфолио · 2026
            </button>
          ) : (
            <span>портфолио · 2026</span>
          )}
          <span>{email?.href.replace("mailto:", "") ?? ""}</span>
        </motion.div>

        <div className="pa-title">
          <motion.div className="pa-word" data-testid="pa-word" {...reveal(REVEAL_ORDER.word)}>
            Product
          </motion.div>

          <ArchiveStripe
            cursive={
              <motion.span
                className="pa-cursive"
                data-testid="pa-cursive"
                {...reveal(REVEAL_ORDER.cursive)}
              >
                Archive
              </motion.span>
            }
            race={race}
          />
        </div>

        <motion.div className="pa-works" data-testid="pa-works" {...reveal(REVEAL_ORDER.works)}>
          <div className="pa-works-label">работы</div>
          <div className="pa-row">
            {archiveCompanies.map((item, index) => (
              <React.Fragment key={item.id}>
                {index > 0 ? <span aria-hidden="true" className="pa-sep" /> : null}
                <button
                  className="pa-cell"
                  data-testid={`pa-company-${item.id}`}
                  onClick={() => setOpenId(item.id)}
                  ref={(node) => {
                    if (node) cellsRef.current.set(item.id, node)
                    else cellsRef.current.delete(item.id)
                  }}
                  type="button"
                >
                  <span className="pa-name">{item.wordmark}</span>
                  <span className="pa-meta">{item.meta}</span>
                </button>
              </React.Fragment>
            ))}
          </div>
        </motion.div>

        <motion.div className="pa-spec" {...reveal(REVEAL_ORDER.spec)}>
          {COLOR_SPEC}
        </motion.div>
      </div>

      <ArchiveSheet company={company} onClose={closeCompany} onOpenCase={onOpenCase} />
    </div>
  )
}
