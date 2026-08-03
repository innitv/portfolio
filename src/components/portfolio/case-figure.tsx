import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "@/components/shadcn/button"
import { cn } from "@/lib/utils"

import {
  imageFallback,
  imageKeyFromSrc,
  imageSrcSet,
  maxRenderWidth,
  type CaseImage,
} from "@/views/portfolio.data"

/**
 * Кадр со скриншотом работы — единственное место сайта, где живёт цвет.
 *
 * ─── ШИРИНА КАДРА ВЫЧИСЛЯЕТСЯ, А НЕ НАЗНАЧАЕТСЯ ─────────────────────────────
 * Правило `STYLE_GUIDE.md`: ни один кадр не растянут выше `natural / 1.5`.
 * Ассеты портфолио — от 480 до 2880 px; «кадр во всю ширину 1152» физически
 * возможен только у четырёх из двадцати двух. Поэтому ширина берётся из
 * манифеста: узкий кадр показывается уже и остаётся резким.
 *
 * Подпись стоит СНАРУЖИ контейнера кадра: рамка держит геометрию, подпись —
 * текст страницы, и накладывать её на изображение нельзя.
 */

export interface CaseFigureProps {
  className?: string
  /** Скрыть подпись: у пары кадров она общая и стоит под обоими. */
  captionHidden?: boolean
  image: CaseImage
  /** Потолок ширины показа; ниже него действует правило natural/1.5. */
  limit?: number
}

export function CaseFigure({ captionHidden, className, image, limit = 1152 }: CaseFigureProps) {
  const key = imageKeyFromSrc(image.src)

  // Кадра нет в манифесте — молча показать битую картинку нельзя.
  if (!key) {
    return (
      <figure className={cn("pf-frame border-border border border-dashed p-6", className)}>
        <figcaption className="pf-caption pf-ink-soft">
          Кадр «{image.caption}» отсутствует в манифесте оптимизированных изображений.
        </figcaption>
      </figure>
    )
  }

  return (
    <figure className={cn("min-w-0", className)} data-testid={`pf-figure-${key}`}>
      <div className="pf-frame" style={{ maxWidth: maxRenderWidth(key, limit) }}>
        <img
          alt={image.alt}
          decoding="async"
          loading="lazy"
          sizes={`(max-width: 720px) calc(100vw - 40px), min(${maxRenderWidth(key, limit)}px, calc(100vw - 112px))`}
          src={imageFallback(key)}
          srcSet={imageSrcSet(key)}
        />
      </div>
      {captionHidden ? null : (
        <figcaption className="pf-caption pf-ink-soft mt-3">{image.caption}</figcaption>
      )}
    </figure>
  )
}

export interface CaseFiguresProps {
  className?: string
  images: CaseImage[]
}

/**
 * Кадры одного раздела: ОДИН показан, остальные — по стрелкам.
 *
 * ─── ПОЧЕМУ НЕ РЯДОМ (правка владельца 2026-08-03) ──────────────────────────
 * Прежняя сборка ставила кадры группы в две колонки, и это давало сразу два
 * дефекта, замеренные на живой странице:
 *
 *   • кадры съедали страницу. Доля высоты под кадрами: «Дизайн-система» 79 %
 *     (8 кадров, 4545 px), «Оптимизация флоу» 54 %, «Услуги Web» 54 %. Кейс
 *     повествует, а выглядел как выкладка — четыре пятых страницы картинки;
 *   • и при этом были мелкими: половина колонки — это 334 px показа при
 *     ассете 560+, то есть интерфейс на скриншоте читался текстурой.
 *
 * Оба лечатся одним: кадр занимает ВСЮ колонку, соседний показывается на его
 * месте. Ширина растёт (насколько именно — считает `maxRenderWidth` из
 * правила «не выше natural/1.5»), высота группы падает до высоты одного
 * кадра, а «до/после» становится настоящим сравнением: кадры сменяются в
 * одной рамке, и глаз видит разницу, а не сличает две мелкие картинки по
 * бокам.
 *
 * ─── ПОЧЕМУ ВСЕ КАДРЫ ЛЕЖАТ В ОДНОЙ ЯЧЕЙКЕ СЕТКИ ────────────────────────────
 * Пропорции внутри группы разные — у «Оптимизации флоу» в одной группе 1.60 и
 * 0.94, то есть при ширине 692 высоты 432 и 736. Если показывать кадры по
 * очереди обычным условным рендером, рамка прыгала бы на 300 px, а текст под
 * ней уезжал — ровно тот класс дефектов, который на этой странице уже
 * чинили. Поэтому кадры лежат в ОДНОЙ ячейке (`col-start-1 row-start-1`):
 * высота контейнера равна самому высокому кадру группы и не меняется при
 * переключении.
 *
 * Когда подписи кадров дословно совпадают («Пример компонентов» и «Пример
 * компонентов»), подпись под рамкой одна и не мигает при переключении.
 */
export function CaseFigures({ className, images }: CaseFiguresProps) {
  const [index, setIndex] = React.useState(0)

  if (images.length === 0) return null

  if (images.length === 1) {
    return <CaseFigure className={className} image={images[0]} />
  }

  const shared = new Set(images.map((image) => image.caption)).size === 1
  const current = Math.min(index, images.length - 1)

  return (
    <figure className={cn("pf-figure-capped min-w-0", className)} data-testid="pf-figure-group">
      {/* `items-center`: кадры группы имеют разную пропорцию, и высота ячейки
          равна самому высокому. Без центрирования низкий кадр прижимался к
          верху, а вся разница собиралась дырой под ним — на 390 это 155 px
          пустоты под широким кадром пары «до/после». Поделённая пополам, она
          читается как поле рамки, а не как обрыв. */}
      <div className="grid items-center">
        {images.map((image, position) => (
          <div
            aria-hidden={position !== current}
            className={cn(
              "col-start-1 row-start-1",
              position !== current && "invisible pointer-events-none"
            )}
            key={image.src}
          >
            <CaseFigure captionHidden image={image} limit={692} />
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
        {/* Подпись объявляется вслух при переключении: смена кадра — это смена
            содержания, и без объявления она не существует для скринридера. */}
        <figcaption
          aria-live="polite"
          className="pf-caption pf-ink-soft min-w-0"
          data-testid="pf-figure-caption"
        >
          {shared ? images[0].caption : images[current].caption}
        </figcaption>

        <div className="flex shrink-0 items-center gap-1">
          <span aria-hidden="true" className="pf-caption pf-num pf-ink-soft mr-1 tabular-nums">
            {current + 1}/{images.length}
          </span>
          {/* Стрелки гаснут на краях, а не зацикливаются: у пары «до/после»
              цикл превратил бы обе кнопки в одну и то же действие, и человек
              терял бы, где он в паре. */}
          <Button
            aria-label="Предыдущий кадр"
            className="size-11 sm:size-9"
            data-testid="pf-figure-prev"
            disabled={current === 0}
            onClick={() => setIndex(current - 1)}
            size="icon"
            type="button"
            variant="outline"
          >
            <ChevronLeft />
          </Button>
          <Button
            aria-label="Следующий кадр"
            className="size-11 sm:size-9"
            data-testid="pf-figure-next"
            disabled={current === images.length - 1}
            onClick={() => setIndex(current + 1)}
            size="icon"
            type="button"
            variant="outline"
          >
            <ChevronRight />
          </Button>
        </div>
      </div>
    </figure>
  )
}
