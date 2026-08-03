import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Контейнер темы shadcn.
 *
 * Компоненты под тему НЕ дублируются: все значения приходят через
 * CSS-переменные из `src/styles/shadcn/tokens.generated.css`
 * (блок `[data-shadcn-theme="default"]`). Этот компонент только ставит
 * атрибут — смена темы это одна строка, а не другой набор компонентов.
 *
 * ─── ПОЧЕМУ ОБЁРТКА ОСТАЁТСЯ ПРИ ОДНОЙ ТЕМЕ ─────────────────────────────────
 * Обёртка не «переключает» темы, а СКОУПИТ их, и на одной теме эта работа
 * никуда не делась. Альтернатива — объявить переменные в `:root`, и тогда тема
 * красит весь документ, включая канву Storybook. Канва нейтральна намеренно
 * (`.storybook/canvas.css`): на тематическом фоне компонент
 * сравнивался бы не сам с собой, а проверка контраста axe мерила бы текст
 * против чужой поверхности и давала ложные нарушения. Переход на `:root`
 * означал бы переснять все эталоны и заново вывести два уже задокументированных
 * решения — про канву и про порталы ниже.
 *
 * Цена содержания — этот файл и один атрибут; цена возврата — оба разбора
 * заново плюс перегенерация baseline. Тема при этом свойство ПРОЕКТА: она
 * появится в первом же продукте, и появится именно здесь.
 *
 * ─── ПРО ПОРТАЛЫ ────────────────────────────────────────────────────────────
 * Оверлеи Radix (`SelectContent`, `DropdownMenuContent`, `TooltipContent`)
 * уходят порталом в `document.body`, то есть ЗА пределы контейнера. Скоупнутые
 * переменные до них не доходят, и раскрытый список оказался бы некрашеным —
 * это не косметика, а «половина интерфейса мимо темы». Пробрасывать `container`
 * в каждый компонент — правка исходников shadcn в четырёх местах; вместо этого
 * атрибут темы зеркалится на `<body>` на время жизни контейнера. В CSS базовые
 * свойства (фон, цвет, шрифт) навешены только на `.shadcn-scope`, поэтому на
 * body попадают ровно переменные и ничего больше.
 */

/**
 * Темы, объявленные в `design/tokens/shadcn/`.
 *
 * `default` — штатный реестр shadcn, опорная точка отсчёта. `a3` — тема
 * продукта «А3 Финанс» (run `outputs/a3-shadcn/2026-07-29`): переопределены
 * только цвет и две гарнитуры, шкала радиусов и `--spacing` совпадают с
 * опорной (`CLAUDE.md` §6.1). `portfolio` — тема редизайна портфолио (run
 * `outputs/portfolio-redesign-seconddesk/2026-08-01`): монохромная нейтральная
 * палитра и Inter; геометрия тоже совпадает с опорной.
 *
 * Тип — единственное место, где перечень тем объявлен для TypeScript: новая
 * тема добавляется дописыванием сюда одного имени, и компилятор сам показывает
 * все места, где тему надо выбрать явно.
 */
export type ShadcnTheme = "a3" | "default" | "portfolio"

export interface ShadcnThemeScopeProps extends React.ComponentProps<"div"> {
  /**
   * Зеркалить тему на корень документа ради порталов и канвы. Выключается
   * только там, где оверлеев заведомо нет и нужна полная изоляция.
   */
  mirrorToBody?: boolean
  theme?: ShadcnTheme
}

export function ShadcnThemeScope({
  children,
  className,
  mirrorToBody = true,
  theme = "default",
  ...props
}: ShadcnThemeScopeProps) {
  React.useEffect(() => {
    if (!mirrorToBody) return undefined

    // Корень документа, а не body: за боксом страницы (overscroll, системные
    // зоны мобильного браузера) виден фон ИМЕННО html. Через body покрасить
    // его нельзя, а без этого в safe-area проступает фон по умолчанию, а не
    // поверхность темы.
    const root = document.documentElement
    const previous = root.dataset.shadcnTheme
    root.dataset.shadcnTheme = theme

    return () => {
      if (previous === undefined) {
        delete root.dataset.shadcnTheme
      } else {
        root.dataset.shadcnTheme = previous
      }
    }
  }, [mirrorToBody, theme])

  return (
    <div className={cn("shadcn-scope", className)} data-shadcn-theme={theme} {...props}>
      {children}
    </div>
  )
}
