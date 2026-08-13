import * as React from "react"

import { AnimatePresence, motion } from "framer-motion"

import type { ArchiveCompany } from "@/views/portfolio-archive.model"

/**
 * Синий экран компании.
 *
 * ─── ПОЧЕМУ ПЛОСКОСТЬ СПУСКАЕТСЯ СВЕРХУ ─────────────────────────────────────
 * Экран приходит `clip-path`-ом сверху вниз и набирает ход: старт медленный,
 * середина быстрая. Выезд снизу пробовали — он читался как «всплыло окно», а
 * не как разлив цвета из полосы Archive, которая стоит наверху страницы.
 *
 * Содержимое приходит ПОСЛЕ плоскости, лесенкой: пока цвет ещё едет, текста на
 * нём нет. Отсюда задержка 0.38 с у первого элемента — она больше половины
 * длительности самой плоскости.
 *
 * ─── ЧТО ДОБАВЛЕНО К ПРОТОТИПУ ──────────────────────────────────────────────
 * Строки кейсов ведут на настоящие страницы кейсов сайта. В прототипе они были
 * немыми: данных там не было, вести было некуда. Кликабельная строка, которая
 * ничего не делает, — дефект, поэтому на живом сайте она получила адрес.
 *
 * Возврат: «← все работы», Esc и возврат фокуса на имя компании, с которого
 * экран открыли.
 *
 * ─── ПОЧЕМУ ЗДЕСЬ НЕТ ВЕТКИ prefers-reduced-motion ──────────────────────────
 * Раньше при `reduce` спуск заменялся на `duration: 0` — экран просто возникал.
 * На машине владельца эта настройка включена системно, и 2026-08-13 он увидел
 * ровно это: «пропали анимации на синих экранах». Промежуточный вариант —
 * кроссфейд вместо спуска — он тоже отклонил: «они просто появляются».
 *
 * Решение владельца: спуск плоскости остаётся всегда. Это осознанное отступление
 * от WCAG 2.3.3 — движение здесь и есть содержание экрана, а не украшение.
 * Смягчено тем, что движение одно, короткое (0.72 с), без параллакса и мигания,
 * и происходит только по прямому нажатию человека. Заезд болида — единственное
 * крупное перемещение — при заходе не запускается вовсе.
 */

/** Длительность спуска плоскости, секунды. */
const SHEET_IN = 0.72

/** Длительность ухода плоскости, секунды. */
const SHEET_OUT = 0.4

/** Пауза перед первым элементом содержимого, секунды. */
const ITEMS_DELAY = 0.38

/** Шаг лесенки, секунды. */
const ITEMS_STAGGER = 0.06

/** Длительность появления элемента, секунды. */
const ITEM_DURATION = 0.52

/** Сдвиг элемента при появлении, px. */
const ITEM_OFFSET = 20

const EASE_IN_SHEET = [0.4, 0, 0.15, 1] as const
const EASE_OUT_SHEET = [0.4, 0, 1, 1] as const
const EASE_ITEM = [0.16, 1, 0.3, 1] as const

const CLOSED = "inset(0% 0% 100% 0%)"
const OPEN = "inset(0% 0% 0% 0%)"

export interface ArchiveSheetProps {
  company?: ArchiveCompany
  onClose: () => void
  onOpenCase?: (companyId: ArchiveCompany["id"], caseId: string) => void
}

export function ArchiveSheet({ company, onClose, onOpenCase }: ArchiveSheetProps) {
  const backRef = React.useRef<HTMLButtonElement | null>(null)

  React.useEffect(() => {
    if (!company) return undefined

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }

    window.addEventListener("keydown", onKeyDown)
    // Фокус уезжает на экран вместе с содержимым: иначе после нажатия он
    // остаётся на имени компании, спрятанном под плоскостью.
    backRef.current?.focus()
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [company, onClose])

  /**
   * Появление одного элемента содержимого. Задержка считается по месту в
   * общем порядке (имя, подпись, строки кейсов, величины) — ровно так же, как
   * в прототипе, где эти узлы шли одним плоским списком.
   */
  const item = (index: number, shift = true) => ({
    animate: { opacity: 1, y: 0 },
    initial: { opacity: 0, y: shift ? ITEM_OFFSET : 0 },
    transition: {
      delay: ITEMS_DELAY + index * ITEMS_STAGGER,
      duration: ITEM_DURATION,
      ease: EASE_ITEM,
    },
  })

  return (
    <AnimatePresence>
      {company ? (
        <section
          aria-label={company.wordmark}
          className="pa-sheet"
          data-testid="pa-sheet"
          key={company.id}
        >
          {/*
            ─── ПЛОСКОСТЬ ЕДЕТ ОТДЕЛЬНО ОТ ТЕКСТА ──────────────────────────
            Анимируется ТОЛЬКО цвет — пустой слой без содержимого. Текст лежит
            рядом, в обычном потоке, и в композитный слой не попадает вовсе.

            Раньше `clip-path` стоял на всём листе, и текст неизбежно оказывался
            внутри анимируемого слоя: там он рисуется без субпиксельного
            сглаживания и выглядит обведённым. Первый заход лечил последствие —
            снимал слой после прихода, — но всё время движения заголовок был
            мутным. Разделение убирает причину: рендер одинаково чёткий на
            любом кадре.

            Скрывать текст на время проезда больше не нужно клипом: он и так
            приходит позже плоскости, прозрачностью (`ITEMS_DELAY`).
          */}
          <motion.div
            animate={{ clipPath: OPEN }}
            aria-hidden="true"
            className="pa-sheet-plane"
            data-testid="pa-sheet-plane"
            exit={{
              clipPath: CLOSED,
              // Уход короче прихода и на разгонной кривой: возврат к списку не
              // должен читаться как второе событие.
              transition: { duration: SHEET_OUT, ease: EASE_OUT_SHEET },
            }}
            initial={{ clipPath: CLOSED }}
            transition={{ duration: SHEET_IN, ease: EASE_IN_SHEET }}
          />

          {/*
            Содержимое уходит вместе с плоскостью, только быстрее: пока она
            уезжает, текст не должен остаться висеть на чернилах. Раньше об этом
            заботился общий `clip-path` — он обрезал и фон, и текст разом.
          */}
          <motion.div
            className="pa-sheet-inner"
            exit={{ opacity: 0, transition: { duration: SHEET_OUT * 0.45 } }}
          >
          <div>
            <button
              className="pa-back"
              data-testid="pa-back"
              onClick={onClose}
              ref={backRef}
              type="button"
            >
              ← все работы
            </button>
            {/*
              Имя проявляется прозрачностью, но БЕЗ сдвига — и с заранее
              зафиксированным сглаживанием (см. `.pa-huge` в CSS).

              Сдвиг убран потому, что ставил буквы кегля 215 на дробные позиции
              и они дрожали. Прозрачность оставлена: плавность нужна, а разницы
              в толщине больше нет — сглаживание не переключается.
            */}
            <motion.div className="pa-huge" {...item(0, false)}>
              {company.wordmark}
            </motion.div>
            <motion.div className="pa-sub" {...item(1)}>
              {company.meta}
            </motion.div>
          </div>

          <div className="pa-cases">
            {company.cases.map((study, index) => (
              <motion.button
                className="pa-case"
                data-testid={`pa-case-${study.caseId}`}
                key={study.caseId}
                onClick={() => onOpenCase?.(company.id, study.caseId)}
                type="button"
                {...item(2 + index)}
              >
                <span className="pa-case-index">{study.index}</span>
                <span className="pa-case-title">{study.title}</span>
                <span className="pa-case-impact">{study.impact}</span>
              </motion.button>
            ))}
          </div>

          <div className="pa-facts">
            {company.facts.map((fact, index) => (
              <motion.div
                key={`${fact.value}-${fact.caption}`}
                {...item(2 + company.cases.length + index)}
              >
                <div className="pa-fact-value">{fact.value}</div>
                <div className="pa-fact-caption">{fact.caption}</div>
              </motion.div>
            ))}
          </div>
          </motion.div>
        </section>
      ) : null}
    </AnimatePresence>
  )
}
