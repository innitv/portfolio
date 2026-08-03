import a3Logo from "@/assets/logos/a3.svg?raw"
import rtkLogo from "@/assets/logos/rtk.svg?raw"
import rtkMark from "@/assets/logos/rtk-mark.svg?raw"
import smltLogo from "@/assets/logos/smlt.svg?raw"
import smltMark from "@/assets/logos/smlt-mark.svg?raw"
import { cn } from "@/lib/utils"

import { companies, type CompanyId } from "@/views/portfolio.data"

/**
 * Знак компании.
 *
 * ─── ПОЧЕМУ ИНЛАЙН, А НЕ `<img src>` ────────────────────────────────────────
 * Знаки экспортированы из Figma и переведены в `fill="currentColor"`: приём
 * разводящей (`supabase.com` → `/customers`) требует ПРИГЛУШЁННОГО логотипа,
 * который на hover набирает полный тон. Через `<img>` цветом знака управлять
 * нельзя — пришлось бы держать по два файла на компанию или красить фильтром.
 *
 * Знаки монохромны по построению: цветных фирменных знаков на монохромной
 * странице быть не должно (решение человека от 2026-08-01). Единственная
 * белая заливка — вырез внутри чёрного круга у «Самолета», это не цвет знака,
 * а его форма.
 *
 * Высота задаётся снаружи классом; ширина считается из соотношения сторон
 * самим SVG (`width`/`height` в разметке), поэтому знаки разной пропорции
 * стоят в ряду на одной оптической высоте, а не на одной ширине.
 */

const LOGOS: Record<CompanyId, string> = {
  a3: a3Logo,
  rtk: rtkLogo,
  smlt: smltLogo,
}

/**
 * Знак без словесной части — для кружка в строке заголовка.
 *
 * В кружке ширина равна высоте, и словесный логотип туда физически не влезает:
 * `rtk.svg` это 338×86, то есть при вписывании по ширине слово стало бы 7 px
 * высотой. Поэтому у двух знаков есть отдельный файл только со знаковой частью,
 * собранный из тех же путей без единой изменённой координаты.
 *
 * У А3 отдельного файла нет и не нужно: `a3.svg` — это уже эмблема 64×64 без
 * слова. Заводить её копию значило бы держать два файла, которые обязаны
 * совпадать, и однажды они разойдутся.
 */
const MARKS: Record<CompanyId, string> = {
  a3: a3Logo,
  rtk: rtkMark,
  smlt: smltMark,
}

/**
 * Оптическая поправка высоты.
 *
 * Знаки разной конструкции: у А3 — квадратная эмблема 64×64, заполненная почти
 * целиком; у «Самолета» — знак плюс слово, где буквы занимают 16 из 24; у РТК —
 * знак в две строки высотой, где слово «Ростелеком» занимает 35 из 87. При
 * ОДИНАКОВОЙ заданной высоте рамки они читались бы разными по величине: глаз
 * сравнивает высоту букв и площадь пятна, а не габарит бокса.
 *
 * Коэффициенты подобраны по скриншоту ряда из трёх карточек, а не одной
 * формулой: замер до правки давал Ростелеком 202×52, Самолет 200×31 и А3
 * 61×27 — последний читался втрое легче соседей. Эмблема А3 держится крупнее
 * высоты строчных у wordmark-ов, иначе квадрат «проваливается» рядом со
 * словом той же высоты.
 */
const OPTICAL_SCALE: Record<CompanyId, number> = {
  a3: 1.55,
  rtk: 1.7,
  smlt: 1.05,
}

export interface CompanyLogoProps {
  className?: string
  company: CompanyId
  /**
   * Высота знака в пикселях до оптической поправки.
   *
   * Не задана — инлайн-стиль не пишется вовсе, и высоту назначает CSS
   * (`--pf-logo-height`). Так устроен кружок заголовка: его диаметр — это
   * `clamp()`, а инлайн-число за таким размером не следует и на 390 давало бы
   * знак от десктопной ширины.
   */
  height?: number
  /** `full` — знак со словом, `mark` — только знаковая часть (для кружка). */
  variant?: "full" | "mark"
}

export function CompanyLogo({
  className,
  company,
  height,
  variant = "full",
}: CompanyLogoProps) {
  const source = variant === "mark" ? MARKS[company] : LOGOS[company]
  const scale = variant === "mark" ? 1 : OPTICAL_SCALE[company]

  return (
    <span
      aria-hidden="true"
      className={cn("pf-logo inline-flex items-center", className)}
      dangerouslySetInnerHTML={{ __html: source }}
      data-company={company}
      data-testid={`pf-logo-${company}`}
      data-variant={variant}
      style={
        height === undefined
          ? undefined
          : { ["--pf-logo-height" as string]: `${Math.round(height * scale)}px` }
      }
    />
  )
}
