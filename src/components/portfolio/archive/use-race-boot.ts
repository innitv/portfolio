import * as React from "react"

import { animate } from "framer-motion"

/**
 * Заезд — пасхалка на финишном флаге.
 *
 * ─── ЗАЕЗД БОЛЬШЕ НЕ ЗАГРУЗКА ───────────────────────────────────────────────
 * До 2026-08-13 болид ехал при каждом заходе на страницу и держал содержимое
 * скрытым 4.5 с: заезд был индикатором загрузки. Решение владельца — убрать:
 * страница ничего не грузит эти секунды, и заезд превращался в искусственную
 * задержку на пути к работам. Осталась пасхалка: заезд запускает нажатие на
 * финишный флаг. Отдельной кнопки «↻ заезд» тоже больше нет — она перекрывала
 * мету RTK на десктопе и имена на мобильной ширине.
 *
 * Отсюда два следствия в поведении: содержимое страницы НЕ гаснет на время
 * заезда (человек уже читает — прятать прочитанное нельзя), а сам заезд идёт
 * поверх готовой страницы по той же полосе Archive.
 *
 * ─── ЧТО ЗДЕСЬ НЕЛЬЗЯ ТРОГАТЬ ───────────────────────────────────────────────
 * 1. Проезд ведёт CSS-анимация `pa-drive` (`styles/portfolio-archive.css`), а
 *    финиш ловится её событием `animationend`. В прототипе проезд пробовали
 *    вести библиотекой по свойству `left` — он схлопывался в прыжок. Поэтому
 *    хук не анимирует положение сам, а только выставляет две переменные
 *    (`--pa-race`, `--pa-race-to`) и слушает конец анимации.
 * 2. Длительность 4.5 с согласована с владельцем.
 * 3. Дистанция считается от фактической ширины полосы минус 150 px: болид
 *    должен встать под финишным флагом, а флаг привязан к правому краю.
 */

/** Длительность проезда, секунды. */
const RACE_SECONDS = 4.5

/** Запас до правого края полосы: болид останавливается под флагом. */
const FINISH_GAP = 150

/** Пауза между зажиганием ламп старта, мс. */
const LAMP_STEP = 260

/** Пауза после команды «марш» до срыва с места, мс. */
const GO_DELAY = 140

/** Потолок ожидания гарнитур: заезд не должен зависеть от медленной сети. */
const FONTS_TIMEOUT = 600

/** Пауза после мигания флага до снятия приборной строки, мс. */
const FINISH_HOLD = 260

export type LampState = "go" | "off" | "on"

export interface RaceBoot {
  /** Обёртка болида: ей выставляются переменные проезда и она же даёт финиш. */
  carRef: React.RefObject<HTMLDivElement | null>
  /** Проезд идёт: класс включает CSS-анимацию. */
  driving: boolean
  /** Финишный флаг — мигает на финише и запускает повтор по нажатию. */
  flagRef: React.RefObject<HTMLElement | null>
  /** Подпись состояния: «на старт» → «марш» → «финиш». */
  hint: string
  lamps: LampState[]
  /** Процент дистанции для счётчика. */
  percent: number
  /** Ключ прогона: меняется на каждом заезде и перемонтирует болид. */
  raceId: number
  /** Пустить заезд — пасхалка на финишном флаге. */
  replay: () => void
  /** Заезд идёт: видны болид и приборная строка. */
  running: boolean
  /** Полоса Archive: по её ширине считается дистанция. */
  stripeRef: React.RefObject<HTMLDivElement | null>
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export function useRaceBoot(): RaceBoot {
  const carRef = React.useRef<HTMLDivElement | null>(null)
  const flagRef = React.useRef<HTMLElement | null>(null)
  const stripeRef = React.useRef<HTMLDivElement | null>(null)

  // `0` — заезда не было. Значение служит и ключом перемонтирования болида:
  // без нового узла CSS-анимация не перезапустится, а сбрасывать её через
  // принудительный reflow пришлось бы вне React.
  const [raceId, setRaceId] = React.useState(0)
  const [running, setRunning] = React.useState(false)
  const [driving, setDriving] = React.useState(false)
  const [percent, setPercent] = React.useState(0)
  const [hint, setHint] = React.useState("на старт")
  const [lamps, setLamps] = React.useState<LampState[]>(["off", "off", "off"])

  const replay = React.useCallback(() => setRaceId((id) => id + 1), [])

  React.useEffect(() => {
    if (raceId === 0) return undefined

    let cancelled = false
    let frame = 0
    const car = carRef.current

    const sequence = async () => {
      setRunning(true)
      setDriving(false)
      setPercent(0)
      setHint("на старт")
      setLamps(["off", "off", "off"])

      // Приборная строка набрана моноширинной гарнитурой: без неё лампы и
      // счётчик прыгают по ширине. Ждём шрифты, но не дольше потолка.
      await Promise.race([document.fonts.ready.catch(() => undefined), wait(FONTS_TIMEOUT)])
      if (cancelled) return

      for (let index = 0; index < 3; index += 1) {
        setLamps((current) => current.map((lamp, i) => (i <= index ? "on" : lamp)))
        await wait(LAMP_STEP)
        if (cancelled) return
      }

      setHint("марш")
      setLamps(["go", "go", "go"])
      await wait(GO_DELAY)
      if (cancelled || !car) return

      const stripeWidth = stripeRef.current?.getBoundingClientRect().width ?? 0
      car.style.setProperty("--pa-race", `${RACE_SECONDS}s`)
      car.style.setProperty("--pa-race-to", `${Math.round(stripeWidth - FINISH_GAP)}px`)

      // Финиш ловится событием самой CSS-анимации: считать его по таймеру
      // значило бы разъехаться с картинкой при любом лаге вкладки.
      const finished = new Promise<void>((resolve) => {
        car.addEventListener("animationend", () => resolve(), { once: true })
      })

      setDriving(true)

      const startedAt = performance.now()
      const tick = () => {
        const progress = Math.min(1, (performance.now() - startedAt) / (RACE_SECONDS * 1000))
        setPercent(Math.round(progress * 100))
        if (progress < 1 && !cancelled) frame = requestAnimationFrame(tick)
      }
      frame = requestAnimationFrame(tick)

      await finished
      if (cancelled) return

      setHint("финиш")
      if (flagRef.current) {
        animate(flagRef.current, { opacity: [1, 0.2, 1, 0.2, 1] }, { duration: 0.45 })
      }
      await wait(FINISH_HOLD)
      if (cancelled) return

      setRunning(false)
      setDriving(false)
    }

    void sequence()

    return () => {
      cancelled = true
      cancelAnimationFrame(frame)
    }
  }, [raceId])

  return {
    carRef,
    driving,
    flagRef,
    hint,
    lamps,
    percent,
    raceId,
    replay,
    running,
    stripeRef,
  }
}
