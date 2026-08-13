import * as React from "react"

import { PixelCar } from "./pixel-car"
import type { RaceBoot } from "./use-race-boot"

/**
 * Полоса Archive — она же трасса заезда.
 *
 * Второй полосы для загрузки не существует: болид идёт по той самой ступени,
 * которая остаётся на странице после финиша. Отсюда состав узла: слово курсивом,
 * финишный флаг, болид и приборная строка живут внутри одного блока, а не в
 * отдельном слое поверх страницы.
 *
 * Ширину полосы читает `use-race-boot` через `stripeRef`: дистанция считается
 * от фактической ширины, а не от ширины окна, — полоса уходит вправо навылет и
 * эти величины не совпадают.
 */

export interface ArchiveStripeProps {
  /** Слово курсивом. Прячется вместе с остальным содержимым на время заезда. */
  cursive: React.ReactNode
  race: RaceBoot
}

export function ArchiveStripe({ cursive, race }: ArchiveStripeProps) {
  return (
    <div className="pa-stripe" data-testid="pa-stripe" ref={race.stripeRef}>
      {cursive}

      {/* Пасхалка: нажатие на финишный флаг — ещё один заезд. */}
      <button
        aria-label="Повторить заезд"
        className="pa-flag"
        data-testid="pa-flag"
        onClick={race.replay}
        ref={race.flagRef as React.RefObject<HTMLButtonElement>}
        title="ещё заезд"
        type="button"
      />

      {/* Ключ перемонтирует узел на каждом заезде: CSS-анимация иначе не
          начнётся заново — она уже отыграна на этом элементе. */}
      <div
        className="pa-car-wrap"
        data-drive={race.driving}
        data-on={race.running}
        data-testid="pa-car-wrap"
        key={race.raceId}
        ref={race.carRef}
      >
        <PixelCar />
      </div>

      <div aria-hidden="true" className="pa-hud" data-on={race.running} data-testid="pa-hud">
        <span className="pa-lights">
          {race.lamps.map((lamp, index) => (
            <i className="pa-lamp" data-state={lamp} key={index} />
          ))}
        </span>
        <span className="pa-count" data-testid="pa-count">
          {race.percent}%
        </span>
        <span>{race.hint}</span>
      </div>
    </div>
  )
}
