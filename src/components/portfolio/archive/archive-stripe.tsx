import * as React from "react"

import { StripeRaster } from "./stripe-raster"

/**
 * Полоса Archive.
 *
 * 🔴 ЗАЕЗД БОЛИДА СНЯТ 14.09.2026 по решению владельца: «убери машинку».
 * Вместе с ней ушло всё, что жило ради неё, — приборная строка с процентами,
 * светофор перед стартом, запуск нажатием на слово и хук `use-race-boot`,
 * который считал дистанцию по ширине полосы. Слово снова подпись, а не кнопка.
 *
 * История приёма, чтобы не заводить его снова по кругу: сначала заезд пускала
 * финишная шахматка справа (снята 2026-09-10), потом само слово «Archive».
 *
 * Осталась заливка: живой пиксельный растр под словом.
 */

export interface ArchiveStripeProps {
  /** Слово курсивом. */
  cursive: React.ReactNode
}

export function ArchiveStripe({ cursive }: ArchiveStripeProps) {
  return (
    <div className="pa-stripe" data-testid="pa-stripe">
      {/* Растр идёт фоном: слово стоит поверх него. */}
      <StripeRaster />

      {cursive}
    </div>
  )
}
