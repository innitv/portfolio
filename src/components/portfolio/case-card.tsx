import { MoveRight } from "lucide-react"

import { ROW_CELL, ROW_CELL_BODY } from "./company-card"

import type { CaseStudy } from "@/views/portfolio.data"

/**
 * Карточка кейса на странице компании.
 *
 * Та же ячейка ряда, что и у компании (`ROW_CELL`), — оформление выбрано
 * владельцем по нижней паре карточек блока `@shadcnblocks/case-studies3`.
 * Отличается только содержимым верхней строки: знака компании здесь нет и быть
 * не должно — все кейсы страницы принадлежат одной компании, чьё имя стоит в
 * заголовке страницы. Его место занимает номер кейса и категория.
 *
 * Год не выводится: в данных у кейсов А3 стоит `2023`, а период компании
 * заявлен как `2025—н.в.`. Расхождение принадлежит контенту, а не вёрстке, и
 * показ поля вынес бы его на страницу.
 */

export interface CaseCardProps {
  caseStudy: CaseStudy
  onOpen: (caseId: string) => void
}

export function CaseCard({ caseStudy, onOpen }: CaseCardProps) {
  return (
    <button
      className={ROW_CELL}
      data-testid={`pf-case-${caseStudy.id}`}
      onClick={() => onOpen(caseStudy.id)}
      type="button"
    >
      <span className="flex items-center gap-3">
        {/* Номер занимает место знака компании: он и есть метка кейса в ряду.
            Квадрат держит ряд на той же оптической высоте, что и логотипы на
            разводящей, — иначе две страницы разъезжаются по верхней линии.

            Радиус `rounded-md` — тот же, которым скруглены кнопки реестра
            (8 px при `--radius` 0.625rem). Правка владельца 2026-08-03: до неё
            это была единственная прямая рамка среди скруглённых элементов
            страницы, вместе с рамкой ряда карточек. Ступень выбрана по
            масштабу: у элемента 32 px радиус кадра (14) съел бы угол. */}
        <span
          aria-hidden="true"
          className="border-border pf-caption pf-num text-foreground flex size-8 shrink-0 items-center justify-center rounded-md border font-medium"
        >
          {caseStudy.index}
        </span>
        <span className="pf-lead font-medium">{caseStudy.type}</span>
      </span>

      <span className="block">
        {/* Заголовок и подзаголовок — одна фраза в два тона. Точка между ними
            добавлена как знак препинания: ни одно слово автора не изменено. */}
        <span className="pf-h2 text-foreground mb-5 block">
          {caseStudy.title}.{" "}
          <span
            className="text-primary/60 group-hover:text-primary/80 font-medium transition-colors duration-500 ease-out"
            data-testid="pf-lede-tail"
          >
            {caseStudy.subtitle}
          </span>
        </span>

      </span>

      <span className={`pf-ui inline-flex items-center gap-2 font-medium ${ROW_CELL_BODY}`}>
          Читать кейс
          <MoveRight
            aria-hidden="true"
            className="size-4 transition-transform duration-500 ease-out group-hover:translate-x-1"
          />
      </span>
    </button>
  )
}
