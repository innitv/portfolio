/**
 * Пиксельный болид — спрайт, нарисованный тенями по сетке 6 px.
 *
 * Перенесён из прототипа `v8.html` без изменения ни одной координаты: рисунок
 * там подбирался вручную (вид сбоку, едет вправо), и любое «улучшение»
 * геометрии — это уже другой болид.
 *
 * ─── ПОЧЕМУ СПИСОК ТЕНЕЙ, А НЕ SVG ИЛИ КАДР ─────────────────────────────────
 * `box-shadow` по сетке даёт настоящие пиксели: при масштабировании они
 * остаются квадратами без сглаживания, чего от растрового кадра пришлось бы
 * добиваться отдельно. Список держится здесь, а не в CSS-файле, потому что это
 * рисунок, а не оформление: правится он целиком и только вместе со спрайтом.
 *
 * В прототипе спрайт однажды потерялся при переносе стилей — «машинки не
 * видно». Поэтому у обёртки есть `data-testid`: проверка считает красные
 * пиксели в области полосы и падает, если болид исчез.
 */

/** Сторона пикселя спрайта. Совпадает с размером самого узла. */
const PIXEL = 6

/** Увеличение спрайта на экране. */
const SCALE = 2.8

/** Цвета болида: кузов, стекло, резина, протектор, фара. */
const BODY = "#E11D2E"
const GLASS = "#BFE3FF"
const TYRE = "#111"
const TREAD = "#2A2A2A"
const LAMP = "#FFE066"
const NUMBER = "#fff"

/**
 * Пиксели спрайта: `[колонка, ряд, цвет]` в единицах сетки 6 px.
 *
 * Ряды сверху вниз: стекло и крыша, борт с антикрылом, верхний борт с номером,
 * нижний борт с фарой, две строки колёс.
 */
const SPRITE: [number, number, string][] = [
  // стекло и крыша
  [9, 0, GLASS], [10, 0, GLASS], [11, 0, GLASS],
  [8, 1, BODY], [9, 1, GLASS], [10, 1, GLASS], [11, 1, GLASS], [12, 1, BODY],
  // антикрыло сзади
  [0, 1, BODY], [1, 1, BODY], [0, 2, BODY],
  // верхний борт с номером
  [2, 2, BODY], [3, 2, BODY], [4, 2, BODY], [5, 2, NUMBER], [6, 2, BODY],
  [7, 2, BODY], [8, 2, BODY], [9, 2, BODY], [10, 2, BODY], [11, 2, BODY],
  [12, 2, BODY], [13, 2, BODY], [14, 2, BODY],
  // нижний борт и фара
  [1, 3, BODY], [2, 3, BODY], [3, 3, BODY], [4, 3, BODY], [5, 3, BODY],
  [6, 3, BODY], [7, 3, BODY], [8, 3, BODY], [9, 3, BODY], [10, 3, BODY],
  [11, 3, BODY], [12, 3, BODY], [13, 3, BODY], [14, 3, BODY], [15, 3, LAMP],
  // колёса
  [3, 4, TYRE], [4, 4, TYRE], [5, 4, TYRE],
  [10, 4, TYRE], [11, 4, TYRE], [12, 4, TYRE],
  [3, 5, TYRE], [4, 5, TREAD], [5, 5, TYRE],
  [10, 5, TYRE], [11, 5, TREAD], [12, 5, TYRE],
]

const spriteShadow = SPRITE.map(
  ([column, row, color]) => `${column * PIXEL}px ${row * PIXEL}px ${color}`,
).join(", ")

/** Скоростные штрихи позади болида. */
const TRAIL_SHADOW = "0 10px 0 rgba(255,255,255,.55), 0 -8px 0 rgba(255,255,255,.35)"

export function PixelCar() {
  return (
    <div
      data-testid="pa-car"
      style={{
        position: "absolute",
        insetBlockEnd: 0,
        insetInlineStart: 0,
        inlineSize: PIXEL,
        blockSize: PIXEL,
        transform: `scale(${SCALE})`,
        transformOrigin: "left bottom",
        imageRendering: "pixelated",
      }}
    >
      <span
        style={{
          position: "absolute",
          insetBlockStart: 0,
          insetInlineStart: 0,
          inlineSize: PIXEL,
          blockSize: PIXEL,
          boxShadow: spriteShadow,
        }}
      />
      <span
        style={{
          position: "absolute",
          insetBlockStart: PIXEL * 2,
          insetInlineStart: -60,
          inlineSize: 48,
          blockSize: 2,
          background: "linear-gradient(90deg, transparent, rgba(255,255,255,.9))",
          boxShadow: TRAIL_SHADOW,
        }}
      />
    </div>
  )
}
